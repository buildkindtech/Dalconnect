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

      // Get top 10 most searched queries
      const query = `
        SELECT 
          query, 
          COUNT(*) as search_count,
          MAX(created_at) as last_searched
        FROM search_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY query
        ORDER BY search_count DESC
        LIMIT 10
      `;

      const result = await pool.query(query);
      await pool.end();
      
      return res.status(200).json({
        searches: result.rows
      });
    } catch (error: any) {
      return res.status(500).json({ 
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
