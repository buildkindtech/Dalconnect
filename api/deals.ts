import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '50', category, city } = req.query;

    let query = `
      SELECT 
        id, title, description, discount, 
        category, expires_at, store,
        original_price, deal_price, coupon_code,
        deal_url, image_url, is_verified,
        likes, views, source, created_at
      FROM deals
      WHERE expires_at > NOW()
      ORDER BY created_at DESC
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query = query.replace('ORDER BY', `AND category = $${paramIndex} ORDER BY`);
      params.push(category);
      paramIndex++;
    }

    if (city) {
      query = query.replace('ORDER BY', `AND city = $${paramIndex} ORDER BY`);
      params.push(city);
      paramIndex++;
    }

    query += ` LIMIT $${paramIndex}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    return res.status(200).json(result.rows);

  } catch (error: any) {
    console.error('Deals API error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
