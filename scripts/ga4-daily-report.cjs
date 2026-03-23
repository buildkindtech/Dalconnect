#!/usr/bin/env node
/**
 * DalKonnect GA4 일일 통계 리포트
 * Property: 528528065 (G-KSNNMJTP4C)
 * 서비스 계정: konnect-firebase-key.json
 */

const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const PROPERTY_ID = '528528065';
const KEY_FILE = path.join(__dirname, '..', 'konnect-firebase-key.json');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = '-5280678324';

const client = new BetaAnalyticsDataClient({
  keyFilename: KEY_FILE,
});

async function getReport() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const fmt = d => d.toISOString().split('T')[0];

  // 어제 기준 날짜 범위 (7일)
  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
    ],
  });

  const totals = response.totals?.[0]?.metricValues || [];
  const sessions = Math.round(parseFloat(totals[0]?.value || 0));
  const users = Math.round(parseFloat(totals[1]?.value || 0));
  const pageviews = Math.round(parseFloat(totals[2]?.value || 0));
  const bounceRate = parseFloat(totals[3]?.value || 0);

  // 인기 페이지 TOP 5
  const [pageResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5,
  });

  const topPages = (pageResponse.rows || []).map(row => ({
    path: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value),
  }));

  // 유입 소스 TOP 3
  const [sourceResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 3,
  });

  const sources = (sourceResponse.rows || []).map(row => ({
    source: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
  }));

  // 어제 하루 수치
  const [yesterdayResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
    ],
  });

  const ytotals = yesterdayResponse.totals?.[0]?.metricValues || [];
  const yUsers = Math.round(parseFloat(ytotals[0]?.value || 0));
  const yViews = Math.round(parseFloat(ytotals[1]?.value || 0));

  return { sessions, users, pageviews, bounceRate, topPages, sources, yUsers, yViews };
}

function pageLabel(p) {
  const map = {
    '/': '홈',
    '/businesses': '업체 목록',
    '/news': '뉴스',
    '/deals': '딜/쿠폰',
    '/community': '커뮤니티',
    '/charts': '차트',
    '/shopping': '마트 픽',
    '/blog': '블로그',
    '/marketplace': '마켓',
  };
  return map[p] || p;
}

async function sendTelegram(msg) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN 없음 — 콘솔 출력만:\n', msg);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown',
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram error: ${JSON.stringify(data)}`);
}

async function main() {
  try {
    const data = await getReport();

    const bounceStr = (data.bounceRate * 100).toFixed(1);

    const topPageStr = data.topPages.map((p, i) =>
      `  ${i + 1}. ${pageLabel(p.path)} — ${p.views.toLocaleString()}뷰`
    ).join('\n');

    const sourceStr = data.sources.map(s =>
      `  • ${s.source === '(direct)' ? '직접 방문' : s.source}: ${s.sessions}세션`
    ).join('\n');

    const msg = `📊 *DalKonnect 주간 GA4 리포트*
${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} 기준

*📅 어제 하루*
• 방문자: ${data.yUsers}명
• 페이지뷰: ${data.yViews}회

*📈 최근 7일 합계*
• 세션: ${data.sessions.toLocaleString()}
• 방문자: ${data.users.toLocaleString()}명
• 페이지뷰: ${data.pageviews.toLocaleString()}회
• 이탈률: ${bounceStr}%

*🔥 인기 페이지 TOP 5*
${topPageStr}

*🌐 유입 소스*
${sourceStr}`;

    await sendTelegram(msg);
    console.log('✅ GA4 리포트 전송 완료');
  } catch (e) {
    console.error('❌ GA4 리포트 실패:', e.message);
    process.exit(1);
  }
}

main();
