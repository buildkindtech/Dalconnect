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

      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query 'q' is required" });
      }

      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      const searchPattern = `%${q}%`;

      // Search businesses
      const businessQuery = `
        SELECT * FROM businesses 
        WHERE name_en ILIKE $1 OR name_ko ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
        ORDER BY rating DESC NULLS LAST
        LIMIT 20
      `;
      const businessResult = await pool.query(businessQuery, [searchPattern]);

      // Search news
      const newsQuery = `
        SELECT * FROM news 
        WHERE title ILIKE $1 OR content ILIKE $1
        ORDER BY published_date DESC NULLS LAST
        LIMIT 10
      `;
      const newsResult = await pool.query(newsQuery, [searchPattern]);

      await pool.end();
      
      return res.status(200).json({
        businesses: businessResult.rows,
        news: newsResult.rows,
        query: q
      });
    } catch (error: any) {
      return res.status(500).json({ 
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
