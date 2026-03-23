#!/usr/bin/env node
/**
 * DalKonnect 종합 통계 리포트
 * GA4 + DB 통합 → 달커넥트 텔레그램 방 전송
 * 
 * 항목:
 * 1. 트래픽 (방문자/페이지뷰/이탈률)
 * 2. 인기 페이지 TOP 5
 * 3. 유입 소스 (어디서 오는지)
 * 4. 업체 광고 현황 (featured 업체 + 승인 대기)
 * 5. 콘텐츠 현황 (뉴스/커뮤니티/블로그)
 * 6. 전환 (업체 등록 신청, 마켓 등록)
 */

const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { Pool } = require('pg');

const PROPERTY_ID = '528528065';
const KEY_FILE = path.join(__dirname, '..', 'konnect-firebase-key.json');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const ga4 = new BetaAnalyticsDataClient({ keyFilename: KEY_FILE });
const pool = new Pool({ connectionString: DB_URL });

// ─── GA4 데이터 ────────────────────────────────────
async function getGA4Stats(range = '7daysAgo') {
  // 전체 지표
  const [overview] = await ga4.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: range, endDate: 'yesterday' }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
  });

  const t = overview.totals?.[0]?.metricValues || [];
  const sessions = Math.round(parseFloat(t[0]?.value || 0));
  const users = Math.round(parseFloat(t[1]?.value || 0));
  const pageviews = Math.round(parseFloat(t[2]?.value || 0));
  const bounce = (parseFloat(t[3]?.value || 0) * 100).toFixed(1);
  const avgDur = Math.round(parseFloat(t[4]?.value || 0));
  const durMin = Math.floor(avgDur / 60);
  const durSec = avgDur % 60;

  // 인기 페이지 TOP 5
  const [pages] = await ga4.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: range, endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 7,
  });

  const topPages = (pages.rows || [])
    .filter(r => !r.dimensionValues[0].value.includes('/admin'))
    .slice(0, 5)
    .map(r => ({
      path: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    }));

  // 유입 소스
  const [sources] = await ga4.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: range, endDate: 'yesterday' }],
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 5,
  });

  const topSources = (sources.rows || []).map(r => ({
    source: r.dimensionValues[0].value,
    medium: r.dimensionValues[1].value,
    sessions: parseInt(r.metricValues[0].value),
  }));

  // 어제 하루 단독
  const [yesterday] = await ga4.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }],
  });
  const yt = yesterday.totals?.[0]?.metricValues || [];

  return {
    sessions, users, pageviews, bounce,
    durMin, durSec,
    topPages, topSources,
    yesterday: {
      users: Math.round(parseFloat(yt[0]?.value || 0)),
      views: Math.round(parseFloat(yt[1]?.value || 0)),
      sessions: Math.round(parseFloat(yt[2]?.value || 0)),
    }
  };
}

// ─── DB 데이터 ────────────────────────────────────
async function getDBStats() {
  const [
    bizTotal, bizFeatured, bizPending,
    newsTotal, newsToday,
    communityTotal, communityToday,
    dealsTotal, blogsTotal,
    listingsTotal, listingsToday,
    newsletterTotal,
    newBizWeek,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) as c FROM businesses'),
    pool.query("SELECT COUNT(*) as c FROM businesses WHERE featured = true"),
    pool.query('SELECT COUNT(*) as c FROM pending_businesses'),
    pool.query('SELECT COUNT(*) as c FROM news'),
    pool.query("SELECT COUNT(*) as c FROM news WHERE created_at >= CURRENT_DATE"),
    pool.query('SELECT COUNT(*) as c FROM community_posts'),
    pool.query("SELECT COUNT(*) as c FROM community_posts WHERE created_at >= CURRENT_DATE"),
    pool.query('SELECT COUNT(*) as c FROM deals'),
    pool.query('SELECT COUNT(*) as c FROM blogs'),
    pool.query('SELECT COUNT(*) as c FROM listings'),
    pool.query("SELECT COUNT(*) as c FROM listings WHERE created_at >= CURRENT_DATE"),
    pool.query('SELECT COUNT(*) as c FROM newsletter_subscribers').catch(() => ({ rows: [{ c: 0 }] })),
    pool.query("SELECT COUNT(*) as c FROM businesses WHERE created_at >= NOW() - INTERVAL '7 days'"),
  ]);

  // 인기 업체 (가장 많이 조회된 featured)
  const topBiz = await pool.query(`
    SELECT name_ko, name_en, category, rating, review_count
    FROM businesses 
    WHERE featured = true 
    ORDER BY rating DESC, review_count DESC 
    LIMIT 3
  `).catch(() => ({ rows: [] }));

  return {
    biz: {
      total: parseInt(bizTotal.rows[0].c),
      featured: parseInt(bizFeatured.rows[0].c),
      pending: parseInt(bizPending.rows[0].c),
      newThisWeek: parseInt(newBizWeek.rows[0].c),
      top: topBiz.rows,
    },
    news: {
      total: parseInt(newsTotal.rows[0].c),
      today: parseInt(newsToday.rows[0].c),
    },
    community: {
      total: parseInt(communityTotal.rows[0].c),
      today: parseInt(communityToday.rows[0].c),
    },
    deals: parseInt(dealsTotal.rows[0].c),
    blogs: parseInt(blogsTotal.rows[0].c),
    listings: {
      total: parseInt(listingsTotal.rows[0].c),
      today: parseInt(listingsToday.rows[0].c),
    },
    newsletter: parseInt(newsletterTotal.rows[0].c),
  };
}

// ─── 레이블 변환 ─────────────────────────────────
function pageLabel(p) {
  const map = {
    '/': '🏠 홈',
    '/businesses': '🏪 업체 목록',
    '/news': '📰 뉴스',
    '/deals': '🔥 딜/쿠폰',
    '/community': '💬 커뮤니티',
    '/charts': '🎵 차트',
    '/shopping': '🛒 마트 픽',
    '/blog': '📝 블로그',
    '/marketplace': '🛍️ 마켓',
    '/about': '💡 소개',
  };
  if (p.startsWith('/business/')) return '🏪 업체 상세';
  if (p.startsWith('/news/')) return '📰 뉴스 상세';
  if (p.startsWith('/blog/')) return '📝 블로그 상세';
  return map[p] || p;
}

function sourceLabel(source, medium) {
  if (source === '(direct)' || source === 'direct') return '직접 방문';
  if (source === 'ig' || source === 'instagram') return 'Instagram';
  if (source.includes('facebook') || source.includes('fb')) return 'Facebook';
  if (source === 'google') return 'Google 검색';
  if (source === 'telegram') return 'Telegram';
  return source;
}

// ─── 메인 ─────────────────────────────────────────
async function main() {
  try {
    console.log('📊 GA4 + DB 통계 수집 중...');
    const [ga4Stats, dbStats] = await Promise.all([
      getGA4Stats('7daysAgo'),
      getDBStats(),
    ]);

    const today = new Date().toLocaleDateString('ko-KR', {
      month: 'long', day: 'numeric', weekday: 'short'
    });

    // 수익 관련 계산
    const featuredRevenue = dbStats.biz.featured * 95; // $95/mo 기준 (추정)

    const report = `
📊 *DalKonnect 종합 통계* — ${today}

━━━━━━━━━━━━━━━━
📅 *어제 하루*
• 방문자: ${ga4Stats.yesterday.users}명
• 세션: ${ga4Stats.yesterday.sessions}
• 페이지뷰: ${ga4Stats.yesterday.views}회

📈 *최근 7일*
• 방문자: ${ga4Stats.users.toLocaleString()}명
• 세션: ${ga4Stats.sessions.toLocaleString()}
• 페이지뷰: ${ga4Stats.pageviews.toLocaleString()}회
• 이탈률: ${ga4Stats.bounce}%
• 평균 체류: ${ga4Stats.durMin}분 ${ga4Stats.durSec}초

━━━━━━━━━━━━━━━━
🔥 *인기 페이지 TOP 5*
${ga4Stats.topPages.map((p, i) => `${i + 1}. ${pageLabel(p.path)} — ${p.views}뷰`).join('\n')}

🌐 *유입 소스*
${ga4Stats.topSources.map(s => `• ${sourceLabel(s.source, s.medium)}: ${s.sessions}세션`).join('\n')}

━━━━━━━━━━━━━━━━
🏪 *업체 광고 현황*
• 전체 등록 업체: ${dbStats.biz.total.toLocaleString()}개
• Featured (광고중): ${dbStats.biz.featured}개
• 이번 주 신규: ${dbStats.biz.newThisWeek}개
• 승인 대기: ${dbStats.biz.pending}개 ${dbStats.biz.pending > 0 ? '⚠️' : '✅'}

━━━━━━━━━━━━━━━━
📦 *콘텐츠 현황*
• 뉴스: ${dbStats.news.total.toLocaleString()}개 (오늘 +${dbStats.news.today})
• 커뮤니티: ${dbStats.community.total.toLocaleString()}개 (오늘 +${dbStats.community.today})
• 블로그: ${dbStats.blogs}개
• 딜/쿠폰: ${dbStats.deals}개
• 마켓 매물: ${dbStats.listings.total}개 (오늘 +${dbStats.listings.today})
• 뉴스레터 구독자: ${dbStats.newsletter}명
`.trim();

    console.log(report);

    // OpenClaw message 툴 대신 직접 출력 (크론에서 OpenClaw가 처리)
    process.stdout.write('\n__REPORT_START__\n' + report + '\n__REPORT_END__\n');

    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ 통계 수집 실패:', e.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

main();
