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

      const { category, city, limit, id, offset } = req.query;

      // Single news detail
      if (id) {
        const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        await pool.end();
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "News not found" });
        }
        return res.status(200).json(result.rows[0]);
      }
      
      let query = 'SELECT * FROM news WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      // Default to dallas if no city specified (backward compatibility)
      const targetCity = city || 'dallas';
      paramCount++;
      query += ` AND city = $${paramCount}`;
      params.push(targetCity);

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      query += ' ORDER BY published_date DESC NULLS LAST, created_at DESC';

      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit as string));
      } else {
        query += ' LIMIT 50';
      }

      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(parseInt(offset as string));
      }

      const result = await pool.query(query, params);
      await pool.end();

      // 뉴스 내용이 너무 짧으면 title로 대체 표시 (content = title인 경우)
      const enriched = result.rows.map((row: any) => ({
        ...row,
        content: (row.content && row.content !== row.title && row.content.length > 80)
          ? row.content
          : row.title, // fallback: title만이라도 표시
        has_full_content: row.content && row.content !== row.title && row.content.length > 80,
      }));
      
      return res.status(200).json(enriched);
    } catch (error: any) {
      console.error('news error:', error);
      // Firestore fallback — DB 오류 시 캐시 데이터 반환
      try {
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        if (!getApps().length) {
          const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
          initializeApp({ credential: cert(sa) });
        }
        const db = getFirestore();
        const snap = await db.collection('news_cache')
          .where('city', '==', req.query.city || 'dallas')
          .orderBy('published_date', 'desc')
          .limit(parseInt(req.query.limit as string) || 20)
          .get();
        const cached = snap.docs.map(d => ({ ...d.data(), _from_cache: true }));
        console.log(`DB fallback: returning ${cached.length} cached articles from Firestore`);
        return res.status(200).json(cached);
      } catch(cacheErr) {
        return res.status(500).json({ error: "서버 오류가 발생했습니다" });
      }
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
