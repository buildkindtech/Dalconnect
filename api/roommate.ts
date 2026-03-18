import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import crypto from 'crypto';

const ALLOWED_ORIGINS = [
  'https://dalkonnect.com', 'https://www.dalkonnect.com',
  'http://localhost:5000', 'http://localhost:5002', 'http://localhost:5173',
];

function cors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function hash(pw: string) {
  return crypto.createHash('sha256').update(String(pw)).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const { action } = req.query;

    // GET — 목록
    if (req.method === 'GET' && !action) {
      const { room_type, gender_pref, max_price, limit = '20', offset = '0' } = req.query as any;
      let where = `WHERE status = '모집중' AND expires_at > NOW()`;
      const params: any[] = [];
      if (room_type && room_type !== 'all') { params.push(room_type); where += ` AND room_type = $${params.length}`; }
      if (gender_pref && gender_pref !== '무관') { params.push(gender_pref); where += ` AND (gender_pref = $${params.length} OR gender_pref = '무관')`; }
      if (max_price) { params.push(parseInt(max_price)); where += ` AND price <= $${params.length}`; }
      const result = await pool.query(
        `SELECT id, title, room_type, price, location, gender_pref, move_in_date, nickname, status, views, created_at
         FROM roommate_posts ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, parseInt(limit), parseInt(offset)]
      );
      return res.json(result.rows);
    }

    // GET detail
    if (req.method === 'GET' && action === 'detail') {
      const { id } = req.query;
      await pool.query('UPDATE roommate_posts SET views = views + 1 WHERE id = $1', [id]);
      const result = await pool.query('SELECT * FROM roommate_posts WHERE id = $1', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: '게시물 없음' });
      const post = { ...result.rows[0] };
      delete post.password_hash;
      return res.json(post);
    }

    // POST — 새 글
    if (req.method === 'POST' && !action) {
      const { title, room_type, price, location, gender_pref, move_in_date, description, contact_method, contact_value, nickname, password, city } = req.body;
      if (!title || !price || !nickname || !password) {
        return res.status(400).json({ error: '필수 항목을 입력해주세요' });
      }
      const id = `rm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await pool.query(
        `INSERT INTO roommate_posts (id, title, room_type, price, location, gender_pref, move_in_date, description, contact_method, contact_value, nickname, password_hash, city)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [id, title, room_type || '원룸', parseInt(price), location || null, gender_pref || '무관',
         move_in_date || null, description || null, contact_method || null, contact_value || null,
         nickname, hash(password), city || 'dallas']
      );
      return res.status(201).json({ id });
    }

    // POST delete
    if (req.method === 'POST' && action === 'delete') {
      const { id, password } = req.body;
      const result = await pool.query('SELECT password_hash FROM roommate_posts WHERE id = $1', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: '게시물 없음' });
      if (result.rows[0].password_hash !== hash(password)) return res.status(403).json({ error: '비밀번호가 틀려요' });
      await pool.query('UPDATE roommate_posts SET status = $1 WHERE id = $2', ['삭제', id]);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e: any) {
    console.error('Roommate API error:', e.message);
    return res.status(500).json({ error: '서버 오류' });
  } finally {
    await pool.end();
  }
}
