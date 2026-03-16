#!/usr/bin/env node
/**
 * DalKonnect Health Check — 데이터 업데이트 후 자동 실행
 * 
 * 테스트 항목:
 * 1. 차트 — 4개 타입 모두 데이터 있음, 썸네일 있음
 * 2. 뉴스 — 기사 있음, HTML 엔티티 없음 (&lsquo; 등)
 * 3. 비즈니스 — API 응답 정상
 * 4. 커뮤니티 — 포스트 있음
 * 
 * 사용법:
 *   node scripts/health-check.cjs              # 로컬 서버 (localhost:5000)
 *   node scripts/health-check.cjs production   # 프로덕션 (dalkonnect.com)
 */

require('dotenv').config();

const BASE_URL = process.argv[2] === 'production'
  ? 'https://dalkonnect.com'
  : 'http://localhost:5000';

const RESULTS = [];
let passed = 0, failed = 0;

function pass(test, detail = '') {
  RESULTS.push(`  ✅ ${test}${detail ? ': ' + detail : ''}`);
  passed++;
}

function fail(test, detail = '') {
  RESULTS.push(`  ❌ ${test}${detail ? ': ' + detail : ''}`);
  failed++;
}

function warn(test, detail = '') {
  RESULTS.push(`  ⚠️  ${test}${detail ? ': ' + detail : ''}`);
}

async function fetchJSON(path, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ──────────────────────────────────────────────
// 1. 차트 테스트
// ──────────────────────────────────────────────
async function testCharts() {
  console.log('\n🎬 차트 테스트...');
  try {
    const data = await fetchJSON('/api/charts');
    if (!Array.isArray(data)) { fail('차트 API 응답 형식', 'array 아님'); return; }
    
    const types = ['music', 'drama', 'netflix', 'movie'];
    for (const type of types) {
      const items = data.filter(x => x.chart_type === type);
      if (items.length === 0) {
        fail(`차트 ${type}`, '데이터 없음');
        continue;
      }
      
      const withThumb = items.filter(x => x.thumbnail_url && x.thumbnail_url.length > 10);
      const ratio = Math.round(withThumb.length / items.length * 100);
      
      if (withThumb.length === 0) {
        fail(`차트 ${type} 썸네일`, `${items.length}개 중 0개`);
      } else if (ratio < 50) {
        warn(`차트 ${type} 썸네일`, `${withThumb.length}/${items.length}개 (${ratio}%)`);
      } else {
        pass(`차트 ${type}`, `${items.length}개, 썸네일 ${withThumb.length}/${items.length}`);
      }
    }
  } catch (e) {
    fail('차트 API', e.message);
  }
}

// ──────────────────────────────────────────────
// 2. 뉴스 테스트
// ──────────────────────────────────────────────
async function testNews() {
  console.log('\n📰 뉴스 테스트...');
  try {
    const data = await fetchJSON('/api/news?limit=10');
    if (!Array.isArray(data)) { fail('뉴스 API 응답 형식', 'array 아님'); return; }
    if (data.length === 0) { fail('뉴스 데이터', '기사 없음'); return; }
    
    pass('뉴스 API', `${data.length}개 기사`);
    
    // HTML 엔티티 체크
    const HTML_ENTITIES = /&(lsquo|rsquo|ldquo|rdquo|middot|bull|amp|nbsp|hellip|ndash|mdash);/;
    const entityBad = data.filter(x =>
      HTML_ENTITIES.test(x.title || '') || HTML_ENTITIES.test(x.content || '')
    );
    
    if (entityBad.length > 0) {
      fail('뉴스 HTML 엔티티', `${entityBad.length}개 기사에 raw 엔티티 있음 (예: "${(entityBad[0].title || '').slice(0,40)}")`);
    } else {
      pass('뉴스 HTML 엔티티', '모두 정상 디코딩됨');
    }
    
    // 썸네일 체크
    const withThumb = data.filter(x => x.thumbnail_url && x.thumbnail_url.length > 10);
    if (withThumb.length < data.length * 0.5) {
      warn('뉴스 썸네일', `${withThumb.length}/${data.length}개만 있음`);
    } else {
      pass('뉴스 썸네일', `${withThumb.length}/${data.length}개`);
    }
    
    // 뉴스 상세 페이지 테스트 (첫 번째 기사 ID로)
    try {
      const testId = data[0].id;
      const detail = await fetchJSON(`/api/news?id=${testId}`);
      if (detail && detail.id) {
        pass('뉴스 상세 API', `id=${testId.slice(0,8)}...`);
      } else {
        fail('뉴스 상세 API', '응답 없음');
      }
    } catch (e) {
      fail('뉴스 상세 API', e.message);
    }
    
  } catch (e) {
    fail('뉴스 API', e.message);
  }
}

// ──────────────────────────────────────────────
// 3. 비즈니스 테스트
// ──────────────────────────────────────────────
async function testBusinesses() {
  console.log('\n🏢 비즈니스 테스트...');
  try {
    const data = await fetchJSON('/api/businesses?featured=true&limit=5');
    const items = data.businesses || data;
    if (!Array.isArray(items) || items.length === 0) {
      fail('비즈니스 API', '데이터 없음');
      return;
    }
    pass('비즈니스 API', `featured ${items.length}개`);
  } catch (e) {
    fail('비즈니스 API', e.message);
  }
}

// ──────────────────────────────────────────────
// 4. 커뮤니티 테스트
// ──────────────────────────────────────────────
async function testCommunity() {
  console.log('\n💬 커뮤니티 테스트...');
  try {
    const data = await fetchJSON('/api/community?action=posts&limit=5');
    const posts = data.data || data.posts || data;
    if (Array.isArray(posts) && posts.length > 0) {
      pass('커뮤니티 목록 API', `${posts.length}개 포스트`);
      // 첫 번째 포스트 상세도 확인
      const firstId = posts[0].id;
      try {
        const detail = await fetchJSON(`/api/community?action=post&id=${firstId}`);
        if (detail.post) pass('커뮤니티 상세 API', `id=${firstId.slice(0,8)}...`);
        else fail('커뮤니티 상세 API', '응답에 post 없음');
      } catch(e2) {
        fail('커뮤니티 상세 API', e2.message);
      }
    } else {
      warn('커뮤니티 API', '포스트 없음 (시드 필요할 수 있음)');
    }
  } catch (e) {
    fail('커뮤니티 API', e.message);
  }
}

// ──────────────────────────────────────────────
// 4b. 매물 테스트
// ──────────────────────────────────────────────
async function testListings() {
  console.log('\n🛍️ 매물 테스트...');
  try {
    const data = await fetchJSON('/api/listings?limit=3');
    const items = data.items || data.listings || data;
    if (Array.isArray(items) && items.length > 0) {
      pass('매물 목록 API', `${items.length}개`);
      // 매물 상세 클릭 테스트
      const firstId = items[0].id;
      try {
        const detail = await fetchJSON(`/api/listings/${firstId}`);
        if (detail.id) pass('매물 상세 API', `id=${firstId.slice(0,15)}...`);
        else fail('매물 상세 API', '응답에 id 없음');
      } catch(e2) {
        fail('매물 상세 API', e2.message);
      }
    } else {
      warn('매물 API', '매물 없음');
    }
  } catch (e) {
    fail('매물 API', e.message);
  }
}

// ──────────────────────────────────────────────
// 5. 검색 테스트
// ──────────────────────────────────────────────
async function testSearch() {
  console.log('\n🔍 검색 테스트...');
  try {
    const data = await fetchJSON('/api/search?q=한인');
    if (typeof data === 'object') {
      const total = (data.businesses?.length || 0) + (data.news?.length || 0) + (data.listings?.length || 0);
      pass('검색 API', `비즈니스 ${data.businesses?.length || 0}개, 뉴스 ${data.news?.length || 0}개, 리스팅 ${data.listings?.length || 0}개`);
    } else {
      fail('검색 API', '응답 형식 오류');
    }
  } catch (e) {
    fail('검색 API', e.message);
  }
}

// ──────────────────────────────────────────────
// 메인 실행
// ──────────────────────────────────────────────
async function main() {
  const env = process.argv[2] === 'production' ? '🌐 PRODUCTION (dalkonnect.com)' : '💻 LOCAL (localhost:5000)';
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' });
  console.log(`\n${'='.repeat(50)}`);
  console.log(`DalKonnect Health Check`);
  console.log(`환경: ${env}`);
  console.log(`시간: ${now}`);
  console.log('='.repeat(50));

  await testCharts();
  await testNews();
  await testBusinesses();
  await testCommunity();
  await testListings();
  await testSearch();

  const total = passed + failed;
  const status = failed === 0 ? '✅ ALL PASS' : `❌ ${failed}/${total} FAILED`;
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`결과: ${status}`);
  console.log('='.repeat(50));
  RESULTS.forEach(r => console.log(r));
  console.log('='.repeat(50));
  
  if (failed > 0) {
    console.log('\n⚠️  실패 항목이 있습니다. 위 로그를 확인하세요.');
    process.exit(1);
  } else {
    console.log('\n🎉 모든 테스트 통과!');
  }
}

main().catch(e => {
  console.error('Health check 실행 오류:', e.message);
  process.exit(1);
});
