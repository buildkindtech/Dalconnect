import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
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

      const { category, limit } = req.query;
      const limitNum = limit ? Number(limit) : 20;
      
      let query = 'SELECT * FROM news WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      query += ' ORDER BY published_date DESC';
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limitNum);

      const result = await pool.query(query, params);
      await pool.end();
      
      return res.status(200).json(result.rows);
    } catch (error: any) {
      console.error("GET /api/news error:", error);
      return res.status(500).json({ 
        error: "Failed to fetch news",
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
