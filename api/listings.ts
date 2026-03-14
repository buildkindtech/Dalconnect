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
    if (req.method === 'GET') {
      const { id, category, city, search, page = '1', limit = '12', status = 'active' } = req.query;
      if (id && typeof id === 'string') {
        const r = await pool.query('SELECT * FROM listings WHERE id = $1 LIMIT 1', [id]);
        if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        return res.json(r.rows[0]);
      }
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Default to dallas if no city specified (backward compatibility)
      const targetCity = city || 'dallas';
      const conditions: string[] = ["status = $1", "expires_at >= NOW()", "city = $2"];
      const params: any[] = [status, targetCity];
      let idx = 3;

      if (category && category !== 'all') { conditions.push(`category = $${idx++}`); params.push(category); }
      if (search) { conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

      const where = `WHERE ${conditions.join(' AND ')}`;
      const countR = await pool.query(`SELECT count(*)::int as total FROM listings ${where}`, params);
      const dataR = await pool.query(`SELECT * FROM listings ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, limitNum, offset]);

      res.json({ items: dataR.rows, pagination: { page: pageNum, limit: limitNum, total: countR.rows[0].total, totalPages: Math.ceil(countR.rows[0].total / limitNum) } });
    } else if (req.method === 'POST') {
      const { title, description, price, price_type, category, condition, contact_method, contact_info, author_name, location, city } = req.body;
      if (!title || !category) return res.status(400).json({ error: 'Title and category required' });
      
      // Default to dallas if no city specified (backward compatibility)
      const targetCity = city || 'dallas';
      
      const r = await pool.query(
        `INSERT INTO listings (id, title, description, price, price_type, category, condition, contact_method, contact_info, author_name, location, city) VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [title, description, price, price_type || 'fixed', category, condition, contact_method || 'phone', contact_info, author_name, location, targetCity]
      );
      res.status(201).json(r.rows[0]);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    console.error('listings error:', e);
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  } finally {
    await pool.end();
  }
}
