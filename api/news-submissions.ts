import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const ALLOWED = ['https://dalkonnect.com','https://www.dalkonnect.com','https://dalconnect.buildkind.tech','http://localhost:5000','http://localhost:5173'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { title, url, category, submitter_name, submitter_email } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: 'title과 url은 필수입니다' });

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    await pool.query(
      "INSERT INTO news_submissions (id, title, url, category, submitter_name, submitter_email, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,'pending',NOW())",
      [id, title, url, category || '기타', submitter_name || '익명', submitter_email || null]
    );
    return res.json({ success: true, id });
  } catch (err: any) {
    console.error('news-submissions error:', err?.message);
    return res.status(500).json({ error: 'Failed to submit' });
  } finally { await pool.end().catch(() => {}); }
}
