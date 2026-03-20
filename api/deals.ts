import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','https://dalkonnect.com','https://www.dalkonnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

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
      ORDER BY
        CASE
          WHEN category = '한인마트' THEN 0
          WHEN store IN ('Costco', 'Sam''s Club') THEN 1
          WHEN source = 'groupon.com' THEN 2
          ELSE 3
        END,
        created_at DESC
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
      error: "서버 오류가 발생했습니다"
    });
  }
}
