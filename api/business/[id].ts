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

      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: "Business ID is required" });
      }

      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      const query = 'SELECT * FROM businesses WHERE id = $1';
      const result = await pool.query(query, [id]);
      await pool.end();
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      return res.status(200).json(result.rows[0]);
    } catch (error: any) {
      return res.status(500).json({ 
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
