import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { handleCorsPreflightOrSetHeaders } from './_cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCorsPreflightOrSetHeaders(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Slug required' });

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    const r = await pool.query('SELECT * FROM blogs WHERE slug = $1 LIMIT 1', [slug]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e: any) {
    console.error('blog-detail error:', e);
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  } finally {
    await pool.end();
  }
}
