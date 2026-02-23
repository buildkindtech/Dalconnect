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

      // Parse query parameters
      const { id, category, city, search, featured, page, limit } = req.query;

      // Single business by ID
      if (id && typeof id === 'string') {
        const r = await pool.query('SELECT * FROM businesses WHERE id = $1 LIMIT 1', [id]);
        await pool.end();
        if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        return res.json(r.rows[0]);
      }
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const offset = (pageNum - 1) * limitNum;

      let query = 'SELECT * FROM businesses WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (city) {
        paramCount++;
        query += ` AND city = $${paramCount}`;
        params.push(city);
      }

      if (search) {
        paramCount++;
        query += ` AND (name_en ILIKE $${paramCount} OR name_ko ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (featured === 'true') {
        query += ` AND featured = true`;
      }

      // Count total for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Add ordering and pagination
      query += ' ORDER BY rating DESC NULLS LAST, created_at DESC';
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limitNum);
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await pool.query(query, params);
      
      // Log search query if present
      if (search) {
        const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
        const ipAddress = Array.isArray(clientIp) ? clientIp[0] : clientIp?.toString().split(',')[0] || 'unknown';
        
        try {
          await pool.query(
            'INSERT INTO search_logs (query, results_count, ip_address) VALUES ($1, $2, $3)',
            [search, total, ipAddress]
          );
        } catch (logError) {
          console.error('Failed to log search:', logError);
          // Don't fail the request if logging fails
        }
      }
      
      await pool.end();
      
      return res.status(200).json({
        businesses: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        no_results: total === 0 && !!search
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
