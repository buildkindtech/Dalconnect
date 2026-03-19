import type { VercelRequest, VercelResponse } from '@vercel/node';
function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','https://dalkonnect.com','https://www.dalkonnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

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
        // 시간 기반 시드로 랜덤 로테이션 (1시간마다 바뀜)
        // featured=true 우선, 나머지는 전체 풀에서 랜덤
        const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60)); // 1시간마다 변경
        const query = `
          SELECT * FROM businesses
          WHERE featured = true
            AND cover_url IS NOT NULL
            AND cover_url != ''
            AND category != '교회'
          ORDER BY md5(id || $1::text)
          LIMIT 60
        `;

        const result = await pool.query(query, [String(hourSeed)]);
        const rows = result.rows;
        await pool.end();
        
        // Cache 1시간
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
        return res.status(200).json(rows);
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
    console.error('featured error:', error);
    return res.status(500).json({
      error: "서버 오류가 발생했습니다"
    });
  }
}
