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
    const { type, limit = '20' } = req.query;

    let query = `
      SELECT 
        id, chart_type, rank, title_ko, title_en,
        artist, platform, youtube_url, thumbnail_url, description,
        score, chart_date, created_at
      FROM charts
      ORDER BY chart_date DESC, rank ASC
    `;

    const params: any[] = [];

    if (type) {
      query = `
        SELECT 
          id, chart_type, rank, title_ko, title_en,
          artist, platform, youtube_url, thumbnail_url, description,
          score, chart_date, created_at
        FROM charts
        WHERE chart_type = $1
        ORDER BY rank ASC
        LIMIT $2
      `;
      params.push(type, parseInt(limit as string));
    } else {
      query += ` LIMIT $1`;
      params.push(parseInt(limit as string));
    }

    const result = await pool.query(query, params);

    return res.status(200).json(result.rows);

  } catch (error: any) {
    console.error('Charts API error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
