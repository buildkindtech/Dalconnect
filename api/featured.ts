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

      const result = await pool.query(`
        SELECT * FROM businesses 
        WHERE featured = true 
        ORDER BY rating DESC NULLS LAST, created_at DESC 
        LIMIT 10
      `);
      
      await pool.end();
      
      return res.status(200).json(result.rows);
    } catch (error: any) {
      console.error("GET /api/featured error:", error);
      return res.status(500).json({ 
        error: "Failed to fetch featured businesses",
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
