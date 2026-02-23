import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Step 1: Check env
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: "DATABASE_URL not set" });
      }

      // Step 2: Import pg dynamically to catch import errors
      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      // Step 3: Parse query parameters for filtering
      const { category, city, search, featured, limit } = req.query;
      
      let query = 'SELECT * FROM businesses WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (city) {
        paramCount++;
        query += ` AND city = $${paramCount}`;
        params.push(city);
      }

      if (search) {
        paramCount++;
        query += ` AND (name_en ILIKE $${paramCount} OR name_ko ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (featured === 'true') {
        query += ` AND featured = true`;
      }

      // Add ordering by rating and created_at
      query += ' ORDER BY rating DESC NULLS LAST, created_at DESC';

      // Optional limit
      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit as string));
      }

      const result = await pool.query(query, params);
      await pool.end();
      
      return res.status(200).json(result.rows);
    } catch (error: any) {
      return res.status(500).json({ 
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
