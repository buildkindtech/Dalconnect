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

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID required' });
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    // 조회수 증가 + 데이터 반환
    await pool.query('UPDATE listings SET views = views + 1 WHERE id = $1', [id]).catch(() => {});
    const { rows } = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    return res.json(rows[0]);
  } catch (err: any) {
    console.error('Listing detail error:', err?.message);
    return res.status(500).json({ error: '서버 오류' });
  } finally {
    await pool.end().catch(() => {});
  }
}
