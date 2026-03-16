import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
  
  try {
    const { rows } = await pool.query('SELECT id, title, category FROM community_posts LIMIT 3');
    return res.json({ success: true, data: rows });
  } catch(e: any) {
    return res.status(500).json({ error: e.message });
  } finally {
    await pool.end().catch(() => {});
  }
}
