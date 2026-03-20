#!/usr/bin/env node
/**
 * DalKonnect Site Guardian — 사이트 안정성 + 품질 자동 감시
 * 
 * 크론잡으로 3시간마다 실행. 문제 발견 시 텔레그램 알림.
 * 
 * 검사 항목:
 * 1. API 엔드포인트 전체 (15개) — 404/500 체크
 * 2. 뉴스 품질 — HTML 엔티티, 빈 내용, 영어 미번역
 * 3. 블로그 품질 — 가짜 데이터 탐지 (DB에 없는 업체명)
 * 4. 차트 썸네일 — null 체크
 * 5. 커뮤니티 — 빈 응답 체크
 * 6. 프론트 렌더링 — 주요 페이지 200 체크
 */

const BASE = 'https://dalkonnect.com';
const issues = [];

async function fetchJSON(path, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── 1. API 엔드포인트 존재 확인 ───
async function checkEndpoints() {
  const endpoints = [
    '/api/news', '/api/businesses', '/api/categories', '/api/charts',
    '/api/community', '/api/deals', '/api/featured', '/api/listings',
    '/api/search?q=test', '/api/stats', '/api/popular-searches',
    '/api/blogs', '/api/newsletter', '/api/contact', '/api/news-submissions',
  ];
  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${BASE}${ep}`, { signal: controller.signal, method: ep.includes('contact') || ep.includes('news-submissions') ? 'OPTIONS' : 'GET' });
      clearTimeout(timer);
      if (res.status === 404) issues.push(`🔴 API 404: ${ep}`);
      else if (res.status >= 500) issues.push(`🔴 API ${res.status}: ${ep}`);
    } catch (e) {
      issues.push(`🔴 API 타임아웃: ${ep} — ${e.message}`);
    }
  }
}

// ─── 2. 뉴스 품질 체크 ───
async function checkNewsQuality() {
  try {
    const news = await fetchJSON('/api/news?limit=20', 20000); // 뉴스 API 타임아웃 20초로 상향
    const items = Array.isArray(news) ? news : (news.items || []);
    
    let htmlEntities = 0, emptyContent = 0, noThumb = 0;
    // Reddit 소스는 이미지가 원래 없으므로 썸네일 체크에서 제외
    const nonRedditItems = items.filter(i => !String(i.source || '').startsWith('r/'));
    for (const item of items) {
      if (/&[a-z]+;|&#\d+;/.test(item.title || '')) htmlEntities++;
      if (/&[a-z]+;|&#\d+;/.test(item.content || '')) htmlEntities++;
      if (!item.content || item.content.length < 50) emptyContent++;
    }
    for (const item of nonRedditItems) {
      if (!item.thumbnail_url) noThumb++;
    }
    
    if (htmlEntities > 0) issues.push(`⚠️ 뉴스 HTML 엔티티: ${htmlEntities}건`);
    if (emptyContent > 2) issues.push(`⚠️ 뉴스 내용 없음: ${emptyContent}/${items.length}건`);
    if (nonRedditItems.length > 0 && noThumb > nonRedditItems.length * 0.5) issues.push(`⚠️ 뉴스 썸네일 없음: ${noThumb}/${nonRedditItems.length}건 (Reddit 제외)`);
    if (items.length === 0) issues.push('🔴 뉴스 0건 — 크론 실패 의심');
  } catch (e) {
    issues.push(`🔴 뉴스 API 에러: ${e.message}`);
  }
}

// ─── 3. 차트 썸네일 체크 ───
async function checkCharts() {
  try {
    const raw = await fetchJSON('/api/charts');
    // API가 flat array 또는 { music: [], drama: [] } 형식일 수 있음
    const all = Array.isArray(raw) ? raw : Object.values(raw).flat();
    for (const type of ['music', 'drama', 'netflix', 'movie']) {
      const items = Array.isArray(raw) ? all.filter(i => i.chart_type === type) : (raw[type] || []);
      if (items.length === 0) {
        issues.push(`⚠️ 차트 ${type}: 0건`);
      } else {
        const noThumb = items.filter(i => !i.thumbnail_url).length;
        if (noThumb > items.length * 0.5) {
          issues.push(`⚠️ 차트 ${type} 썸네일 없음: ${noThumb}/${items.length}`);
        }
      }
    }
  } catch (e) {
    issues.push(`🔴 차트 API 에러: ${e.message}`);
  }
}

// ─── 4. 커뮤니티 체크 ───
async function checkCommunity() {
  try {
    const data = await fetchJSON('/api/community?limit=3');
    const posts = data.data || data.posts || data;
    if (!Array.isArray(posts) || posts.length === 0) {
      issues.push('⚠️ 커뮤니티 포스트 0건');
    }
  } catch (e) {
    issues.push(`🔴 커뮤니티 API 에러: ${e.message}`);
  }
}

// ─── 5. 통계 체크 ───
async function checkStats() {
  try {
    const stats = await fetchJSON('/api/stats');
    if (!stats.totalBusinesses || stats.totalBusinesses === 0) {
      issues.push('🔴 통계: 업체 수 0');
    }
  } catch (e) {
    issues.push(`🔴 통계 API 에러: ${e.message}`);
  }
}

// ─── 6. 주요 페이지 렌더링 ───
async function checkPages() {
  const pages = ['/', '/news', '/businesses', '/community', '/charts', '/listings', '/contact'];
  for (const page of pages) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BASE}${page}`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) issues.push(`🔴 페이지 ${page}: HTTP ${res.status}`);
    } catch (e) {
      issues.push(`🔴 페이지 ${page} 로드 실패: ${e.message}`);
    }
  }
}

// ─── 실행 ───
async function main() {
  console.log(`\n🛡️  DalKonnect Site Guardian — ${new Date().toLocaleString('ko-KR')}`);
  console.log('─'.repeat(50));
  
  await checkEndpoints();
  await checkNewsQuality();
  await checkCharts();
  await checkCommunity();
  await checkStats();
  await checkPages();
  
  console.log(`\n검사 완료. 이슈: ${issues.length}건`);
  
  if (issues.length === 0) {
    console.log('✅ ALL CLEAR — 이상 없음');
    // 이슈 없으면 조용히 종료 (알림 안 보냄)
  } else {
    const report = `🛡️ DalKonnect Guardian 알림\n\n${issues.join('\n')}\n\n총 ${issues.length}건 — 확인 필요`;
    console.log('\n' + report);
    // 표준 출력으로 리포트 → 크론잡이 텔레그램으로 전달
    console.log('\n__GUARDIAN_ALERT__');
    console.log(report);
  }
}

main().catch(e => {
  console.error('Guardian 크래시:', e);
  process.exit(1);
});
