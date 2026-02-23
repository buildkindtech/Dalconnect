import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    if (req.method === 'GET') {
      const { category, search, page = '1', limit = '12', status = 'active' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const conditions: string[] = ["status = $1", "expires_at >= NOW()"];
      const params: any[] = [status];
      let idx = 2;

      if (category && category !== 'all') { conditions.push(`category = $${idx++}`); params.push(category); }
      if (search) { conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

      const where = `WHERE ${conditions.join(' AND ')}`;
      const countR = await pool.query(`SELECT count(*)::int as total FROM listings ${where}`, params);
      const dataR = await pool.query(`SELECT * FROM listings ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, limitNum, offset]);

      res.json({ items: dataR.rows, pagination: { page: pageNum, limit: limitNum, total: countR.rows[0].total, totalPages: Math.ceil(countR.rows[0].total / limitNum) } });
    } else if (req.method === 'POST') {
      const { title, description, price, price_type, category, condition, contact_method, contact_info, author_name, location } = req.body;
      if (!title || !category) return res.status(400).json({ error: 'Title and category required' });
      const r = await pool.query(
        `INSERT INTO listings (id, title, description, price, price_type, category, condition, contact_method, contact_info, author_name, location) VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [title, description, price, price_type || 'fixed', category, condition, contact_method || 'phone', contact_info, author_name, location]
      );
      res.status(201).json(r.rows[0]);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  } finally {
    await pool.end();
  }
}
