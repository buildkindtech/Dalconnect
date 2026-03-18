import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import crypto from 'crypto';

const ALLOWED_ORIGINS = [
  'https://dalkonnect.com', 'https://www.dalkonnect.com',
  'https://dalconnect.com', 'https://dalconnect.buildkind.tech',
  'http://localhost:5000', 'http://localhost:5002', 'http://localhost:5173',
];

function cors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    // GET /api/market — 목록
    if (req.method === 'GET' && !action) {
      const { category, status = '판매중', limit = '20', offset = '0', city = 'dallas' } = req.query as any;
      let where = `WHERE m.status = $1 AND (m.city = $2 OR m.city IS NULL) AND m.expires_at > NOW()`;
      const params: any[] = [status, city];
      if (category && category !== 'all') {
        params.push(category);
        where += ` AND m.category = $${params.length}`;
      }
      const result = await pool.query(
        `SELECT id, title, price, price_type, category, condition, images, contact_method, nickname, status, city, views, created_at
         FROM market_posts m ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, parseInt(limit as string), parseInt(offset as string)]
      );
      return res.json(result.rows);
    }

    // GET /api/market?action=detail&id=xxx
    if (req.method === 'GET' && action === 'detail') {
      const { id } = req.query;
      await pool.query('UPDATE market_posts SET views = views + 1 WHERE id = $1', [id]);
      const result = await pool.query('SELECT * FROM market_posts WHERE id = $1', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: '게시물을 찾을 수 없어요' });
      const post = { ...result.rows[0] };
      delete post.password_hash;
      return res.json(post);
    }

    // POST /api/market — 새 글 작성
    if (req.method === 'POST' && !action) {
      const { title, price, price_type, category, condition, description, images, contact_method, contact_value, nickname, password, city } = req.body;
      if (!title || !category || !nickname || !password) {
        return res.status(400).json({ error: '필수 항목을 입력해주세요' });
      }
      const id = `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const pw_hash = hash(password);
      await pool.query(
        `INSERT INTO market_posts (id, title, price, price_type, category, condition, description, images, contact_method, contact_value, nickname, password_hash, city)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [id, title, price || null, price_type || 'fixed', category, condition || null, description || null,
         images || [], contact_method || null, contact_value || null, nickname, pw_hash, city || 'dallas']
      );
      return res.status(201).json({ id });
    }

    // POST /api/market?action=delete
    if (req.method === 'POST' && action === 'delete') {
      const { id, password } = req.body;
      const result = await pool.query('SELECT password_hash FROM market_posts WHERE id = $1', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: '게시물 없음' });
      if (result.rows[0].password_hash !== hash(password)) return res.status(403).json({ error: '비밀번호가 틀려요' });
      await pool.query('UPDATE market_posts SET status = $1 WHERE id = $2', ['삭제', id]);
      return res.json({ success: true });
    }

    // POST /api/market?action=status — 상태 변경 (판매중/예약중/완료)
    if (req.method === 'POST' && action === 'status') {
      const { id, password, status } = req.body;
      const result = await pool.query('SELECT password_hash FROM market_posts WHERE id = $1', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: '게시물 없음' });
      if (result.rows[0].password_hash !== hash(password)) return res.status(403).json({ error: '비밀번호가 틀려요' });
      await pool.query('UPDATE market_posts SET status = $1 WHERE id = $2', [status, id]);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e: any) {
    console.error('Market API error:', e.message);
    return res.status(500).json({ error: '서버 오류' });
  } finally {
    await pool.end();
  }
}
