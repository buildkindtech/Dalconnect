import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { category, city, target_age, search, page = '1', limit = '12' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    // Default to dallas if no city specified (backward compatibility)
    const targetCity = city || 'dallas';
    conditions.push(`city = $${paramIdx++}`);
    params.push(targetCity);

    if (category && category !== 'all') {
      conditions.push(`category = $${paramIdx++}`);
      params.push(category);
    }
    if (target_age && target_age !== 'all') {
      conditions.push(`target_age = $${paramIdx++}`);
      params.push(target_age);
    }
    if (search) {
      conditions.push(`(title ILIKE $${paramIdx} OR content ILIKE $${paramIdx} OR excerpt ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countR = await pool.query(`SELECT count(*)::int as total FROM blogs ${where}`, params);
    const total = countR.rows[0].total;

    const dataR = await pool.query(
      `SELECT * FROM blogs ${where} ORDER BY published_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      items: dataR.rows,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (e: any) {
    console.error('blogs error:', e);
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  } finally {
    await pool.end();
  }
}
