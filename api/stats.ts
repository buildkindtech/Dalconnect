import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const ALLOWED_ORIGINS = [
  'https://dalkonnect.com', 'https://www.dalkonnect.com',
  'https://dalconnect.com', 'https://dalconnect.buildkind.tech',
  'http://localhost:5000', 'http://localhost:5173',
];

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
    const [businesses, posts, views] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as cnt FROM businesses").catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query("SELECT (SELECT COUNT(*)::int FROM news) + (SELECT COUNT(*)::int FROM community_posts) as cnt").catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query("SELECT COALESCE(SUM(views),0)::int as total, COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN views ELSE 0 END),0)::int as today FROM businesses").catch(() => ({ rows: [{ total: 0, today: 0 }] })),
    ]);

    return res.json({
      totalBusinesses: businesses.rows[0].cnt,
      totalPosts: posts.rows[0].cnt,
      totalViews: views.rows[0].total,
      todayViews: views.rows[0].today,
    });
  } catch (err: any) {
    console.error('stats error:', err?.message);
    return res.json({ totalBusinesses: 0, totalPosts: 0, totalViews: 0, todayViews: 0 });
  } finally {
    await pool.end().catch(() => {});
  }
}
