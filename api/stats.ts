import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const ALLOWED_ORIGINS = [
  'https://dalkonnect.com', 'https://www.dalkonnect.com',
  'https://dalconnect.com', 'https://dalconnect.buildkind.tech',
  'http://localhost:5000', 'http://localhost:5173',
];

// GA4 서비스 계정 키 (환경변수에서 로드)
const GA4_PROPERTY = 'properties/528528065';

async function getGA4Stats(): Promise<{ totalViews: number; todayViews: number; totalUsers: number }> {
  try {
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    
    // Vercel에서는 환경변수로 서비스 계정 키 전달
    const credentials = process.env.GOOGLE_SA_KEY 
      ? JSON.parse(process.env.GOOGLE_SA_KEY)
      : undefined;
    
    const client = new BetaAnalyticsDataClient(credentials ? { credentials } : undefined);

    const [[r30], [today]] = await Promise.all([
      client.runReport({
        property: GA4_PROPERTY,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      }),
      client.runReport({
        property: GA4_PROPERTY,
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      }),
    ]);

    return {
      totalViews: parseInt(r30.rows?.[0]?.metricValues?.[0]?.value || '0') + 3000,
      todayViews: parseInt(today.rows?.[0]?.metricValues?.[0]?.value || '0'),
      totalUsers: parseInt(r30.rows?.[0]?.metricValues?.[1]?.value || '0'),
    };
  } catch (e) {
    console.error('GA4 fetch error:', (e as Error).message);
    return { totalViews: 0, todayViews: 0, totalUsers: 0 };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Cache 5분
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const [businesses, posts, ga4] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as cnt FROM businesses").catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query("SELECT (SELECT COUNT(*)::int FROM news) + (SELECT COUNT(*)::int FROM community_posts) as cnt").catch(() => ({ rows: [{ cnt: 0 }] })),
      getGA4Stats(),
    ]);

    return res.json({
      totalBusinesses: businesses.rows[0].cnt,
      totalPosts: posts.rows[0].cnt,
      totalViews: ga4.totalViews,
      todayViews: ga4.todayViews,
      totalUsers: ga4.totalUsers,
    });
  } catch (err: any) {
    console.error('stats error:', err?.message);
    return res.json({ totalBusinesses: 0, totalPosts: 0, totalViews: 0, todayViews: 0, totalUsers: 0 });
  } finally {
    await pool.end().catch(() => {});
  }
}
