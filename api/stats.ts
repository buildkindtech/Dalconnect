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

      // Get category counts
      const categoryQuery = `
        SELECT category, COUNT(*) as count 
        FROM businesses 
        GROUP BY category 
        ORDER BY count DESC
      `;
      const categoryResult = await pool.query(categoryQuery);

      // Get city counts
      const cityQuery = `
        SELECT city, COUNT(*) as count 
        FROM businesses 
        WHERE city IS NOT NULL 
        GROUP BY city 
        ORDER BY count DESC
      `;
      const cityResult = await pool.query(cityQuery);

      // Get total businesses
      const totalQuery = 'SELECT COUNT(*) FROM businesses';
      const totalResult = await pool.query(totalQuery);

      // Get trending (high rating + recent reviews)
      const trendingQuery = `
        SELECT * FROM businesses 
        WHERE rating IS NOT NULL AND CAST(rating AS DECIMAL) >= 4.0 
        ORDER BY CAST(rating AS DECIMAL) DESC, review_count DESC 
        LIMIT 6
      `;
      const trendingResult = await pool.query(trendingQuery);

      // Get recent businesses
      const recentQuery = `
        SELECT * FROM businesses 
        ORDER BY created_at DESC 
        LIMIT 6
      `;
      const recentResult = await pool.query(recentQuery);

      await pool.end();
      
      return res.status(200).json({
        categoryStats: categoryResult.rows.map(row => ({
          category: row.category,
          count: parseInt(row.count)
        })),
        cityStats: cityResult.rows.map(row => ({
          city: row.city,
          count: parseInt(row.count)
        })),
        totalBusinesses: parseInt(totalResult.rows[0].count),
        trending: trendingResult.rows,
        recent: recentResult.rows
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
