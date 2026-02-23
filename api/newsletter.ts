import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    if (req.method === 'POST') {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const exists = await pool.query('SELECT id FROM newsletter_subscribers WHERE email = $1', [email]);
      if (exists.rowCount && exists.rowCount > 0) return res.json({ message: '이미 구독 중입니다' });
      await pool.query('INSERT INTO newsletter_subscribers (id, email, name) VALUES (gen_random_uuid(), $1, $2)', [email, name || null]);
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
    res.status(500).json({ error: e.message });
  } finally {
    await pool.end();
  }
}
