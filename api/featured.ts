import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "DATABASE_URL not set" });
  }

  const pg = await import('pg');
  const pool = new pg.default.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const { action, category, city, hot, id } = req.query as Record<string, string>;

    if (req.method === 'GET') {
      // Deal endpoints
      if (action === 'deals') {
        let query = `
          SELECT 
            id, title, description, discount, 
            category, expires_at, store,
            original_price, deal_price, coupon_code,
            deal_url, image_url, is_verified,
            likes, views, source, created_at
          FROM deals 
          WHERE expires_at > NOW()
        `;
        
        const params: any[] = [];
        let paramCount = 0;
        
        // Category filter
        if (category && category !== 'all') {
          paramCount++;
          query += ` AND category = $${paramCount}`;
          params.push(category);
        }
        
        // Hot deals (sorted by likes + views)
        if (hot === 'true') {
          query += ` ORDER BY (likes + views) DESC, created_at DESC`;
        } else {
          query += ` ORDER BY created_at DESC`;
        }
        
        query += ` LIMIT 50`;
        
        const result = await pool.query(query, params);
        await pool.end();
        return res.status(200).json(result.rows);
      }
      
      // Original featured businesses endpoint
      if (!action) {
        // Featured businesses from all DFW cities (no city filter)
        const query = `
          SELECT * FROM businesses 
          WHERE featured = true 
          ORDER BY rating DESC NULLS LAST, created_at DESC
          LIMIT 12
        `;

        const result = await pool.query(query);
        await pool.end();
        return res.status(200).json(result.rows);
      }
    }

    if (req.method === 'POST') {
      // Like a deal
      if (action === 'deal-like' && id) {
        // Update views count
        await pool.query(
          'UPDATE deals SET views = views + 1 WHERE id = $1',
          [id]
        );

        // Update likes count
        const result = await pool.query(
          'UPDATE deals SET likes = likes + 1 WHERE id = $1 RETURNING likes',
          [id]
        );
        
        await pool.end();
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Deal not found' });
        }
        
        return res.status(200).json({ 
          success: true, 
          likes: result.rows[0].likes 
        });
      }
    }

    await pool.end();
    return res.status(405).json({ error: "Method not allowed or invalid action" });

  } catch (error: any) {
    await pool.end();
    return res.status(500).json({ 
      error: error.message
    });
  }
}
