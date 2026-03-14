import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','https://dalkonnect.com','https://www.dalkonnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    if (req.method === 'POST') {
      const { email, name, city } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      
      const exists = await pool.query('SELECT id FROM newsletter_subscribers WHERE email = $1', [email]);
      if (exists.rowCount && exists.rowCount > 0) return res.json({ message: '이미 구독 중입니다' });
      
      await pool.query(
        'INSERT INTO newsletter_subscribers (id, email, name, city) VALUES (gen_random_uuid(), $1, $2, $3)', 
        [email, name || null, city || 'dallas']
      );
      
      res.json({ message: '구독 완료! 🎉 매주 월요일 아침에 만나요' });
    } else if (req.method === 'DELETE') {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      await pool.query('UPDATE newsletter_subscribers SET active = false WHERE email = $1', [email]);
      res.json({ message: '구독이 취소되었습니다' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    console.error('newsletter error:', e);
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  } finally {
    await pool.end();
  }
}
