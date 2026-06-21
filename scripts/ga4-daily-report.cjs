#!/usr/bin/env node
/**
 * DalKonnect GA4 일일 페이지 통계 리포트
 * Property: 528528065 (G-KSNNMJTP4C)
 * 매일 7:30am — 어제 어느 페이지에 사람이 왔는지 + 보강 추천
 */

const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const PROPERTY_ID = '528528065';
const KEY_FILE = path.join(__dirname, '..', 'konnect-firebase-key.json');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = '-5280678324';

const client = new BetaAnalyticsDataClient({ keyFilename: KEY_FILE });

// 페이지 경로 → 한글 레이블
function pageLabel(p) {
  if (p === '/') return '홈';
  if (p.startsWith('/news/')) return '뉴스 상세: ' + p.split('/').pop()?.slice(0, 12);
  if (p.startsWith('/business/')) return '업소 상세: ' + p.split('/').pop()?.slice(0, 12);
  if (p.startsWith('/blog/')) return '블로그 상세: ' + p.split('/').pop()?.slice(0, 12);
  if (p.startsWith('/community/')) return '커뮤니티 글: ' + p.split('/').pop()?.slice(0, 12);
  const map = {
    '/businesses': '업체 목록', '/news': '뉴스 목록', '/deals': '딜/쿠폰',
    '/community': '커뮤니티', '/charts': '차트', '/shopping': '마트 픽',
    '/blog': '블로그', '/marketplace': '마켓', '/roommate': '룸메이트',
  };
  return map[p] || p.slice(0, 30);
}

// 페이지 유형별 보강 힌트
function improvementHint(p) {
  if (p.startsWith('/news/')) return '관련 뉴스 링크, 업소 크로스링크 강화';
  if (p.startsWith('/business/')) return '리뷰 스키마, 사진 보강, 관련 뉴스 연결';
  if (p.startsWith('/blog/')) return '관련 업소/뉴스 링크, 내부 링크 추가';
  if (p === '/') return '인기 콘텐츠 노출 강화, CTA 개선';
  if (p === '/news') return '카테고리 필터 UX, 썸네일 품질';
  if (p === '/businesses') return '검색 필터, 평점 표시, 리뷰 수';
  if (p === '/community') return '최신 글 노출, 댓글 유도 CTA';
  return '콘텐츠 보강, 내부 링크';
}

async function getReport() {
  const [ydOverall, ydPages, ydSources, wk7Pages, wk7Overall] = await Promise.all([
    // 어제 전체
    client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }, { name: 'bounceRate' }],
    }),
    // 어제 페이지별 TOP 15
    client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 15,
    }),
    // 어제 유입 소스
    client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 4,
    }),
    // 7일 페이지별 TOP 10
    client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    // 7일 전체
    client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }],
    }),
  ]);

  const yt = ydOverall[0].totals?.[0]?.metricValues || [];
  const wt = wk7Overall[0].totals?.[0]?.metricValues || [];

  return {
    yd: {
      users: parseInt(yt[0]?.value || 0),
      views: parseInt(yt[1]?.value || 0),
      sessions: parseInt(yt[2]?.value || 0),
      bounce: parseFloat(yt[3]?.value || 0),
    },
    wk7: {
      users: parseInt(wt[0]?.value || 0),
      views: parseInt(wt[1]?.value || 0),
      sessions: parseInt(wt[2]?.value || 0),
    },
    ydPages: (ydPages[0].rows || []).map(r => ({
      path: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    sources: (ydSources[0].rows || []).map(r => ({
      src: r.dimensionValues[0].value === '(direct)' ? '직접방문' : r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
    })),
    wk7Pages: (wk7Pages[0].rows || []).map(r => ({
      path: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
    })),
  };
}

async function sendTelegram(msg) {
  if (!TELEGRAM_BOT_TOKEN) { console.log(msg); return; }
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg }),
  });
  const data = await res.json();
  if (!data.ok) console.error('Telegram 실패:', JSON.stringify(data));
}

async function main() {
  try {
    const d = await getReport();
    const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

    // 페이지 목록 (어제)
    const pageLines = d.ydPages.slice(0, 10).map((p, i) =>
      `${i + 1}. ${pageLabel(p.path)} — ${p.views}뷰 (${p.users}명)`
    ).join('\n');

    // 보강 추천 — TOP 3 페이지 기준
    const topPaths = d.ydPages.slice(0, 3);
    const hints = topPaths.map(p => `- ${pageLabel(p.path)}: ${improvementHint(p.path)}`).join('\n');

    // 유입 소스
    const srcLines = d.sources.map(s => `- ${s.src}: ${s.sessions}세션`).join('\n');

    const msg = `DalKonnect 일일 통계 (${today})

어제 하루
방문자 ${d.yd.users}명 | 페이지뷰 ${d.yd.views}회 | 세션 ${d.yd.sessions} | 이탈률 ${(d.yd.bounce * 100).toFixed(0)}%

어제 인기 페이지 TOP 10
${pageLines}

유입 소스
${srcLines}

7일 합계: 방문자 ${d.wk7.users}명 / 뷰 ${d.wk7.views}회 / 세션 ${d.wk7.sessions}

오늘 보강 우선순위
${hints}`;

    await sendTelegram(msg);
    console.log('GA4 리포트 전송 완료');
  } catch (e) {
    console.error('GA4 리포트 실패:', e.message);
    process.exit(1);
  }
}

main();
