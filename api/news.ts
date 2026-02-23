import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: "DATABASE_URL not set" });
      }

      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      const { category, limit, id } = req.query;

      // Single news detail
      if (id) {
        const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        await pool.end();
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "News not found" });
        }
        return res.status(200).json(result.rows[0]);
      }
      
      let query = 'SELECT * FROM news WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      query += ' ORDER BY published_date DESC NULLS LAST, created_at DESC';

      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit as string));
      } else {
        query += ' LIMIT 50';
      }

      const result = await pool.query(query, params);
      await pool.end();
      
      return res.status(200).json(result.rows);
    } catch (error: any) {
      return res.status(500).json({ 
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
