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

      // Step 3: Raw query (no drizzle, no ORM)
      const result = await pool.query('SELECT * FROM businesses LIMIT 20');
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
