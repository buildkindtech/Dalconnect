import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

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

      const { action, type } = req.query;

      // 차트 데이터 반환
      if (action === 'charts') {
        try {
          let query = `
            SELECT 
              id, chart_type, rank, title_ko, title_en, artist, platform, 
              thumbnail_url, description, score, chart_date, youtube_url
            FROM charts
            WHERE chart_date = (SELECT MAX(chart_date) FROM charts)
          `;
          let params: any[] = [];

          // 특정 차트 타입 필터링
          if (type && typeof type === 'string') {
            query += ` AND chart_type = $1`;
            params = [type];
          }

          query += ` ORDER BY rank ASC`;

          const result = await pool.query(query, params);
          await pool.end();

          return res.status(200).json({
            success: true,
            type: type || 'all',
            date: new Date().toISOString().split('T')[0],
            data: result.rows
          });
        } catch (error: any) {
          await pool.end();
          return res.status(500).json({ 
            error: error.message,
            success: false 
          });
        }
      }

      // 방문자 기록 및 통계 반환
      if (action === 'visit') {
        try {
          // IP와 User-Agent로 visitor_hash 생성
          const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
                    || (req.headers['x-real-ip'] as string) 
                    || 'unknown';
          const userAgent = req.headers['user-agent'] || 'unknown';
          const visitorHash = crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
          
          const page = (req.query.page as string) || '/';
          const referrer = req.headers['referer'] || req.headers['referrer'] || null;

          // visitor_logs에 방문 기록
          await pool.query(
            `INSERT INTO visitor_logs (visitor_hash, page, referrer) VALUES ($1, $2, $3)`,
            [visitorHash, page, referrer]
          );

          // 오늘 날짜의 site_stats 업데이트 (page_views 증가)
          await pool.query(
            `INSERT INTO site_stats (date, page_views, unique_visitors)
             VALUES (CURRENT_DATE, 1, 0)
             ON CONFLICT (date) 
             DO UPDATE SET page_views = site_stats.page_views + 1`
          );

          // 오늘 처음 방문한 유니크 방문자인지 확인
          const uniqueCheck = await pool.query(
            `SELECT COUNT(*) as count
             FROM visitor_logs
             WHERE visitor_hash = $1
             AND DATE(created_at) = CURRENT_DATE`,
            [visitorHash]
          );

          // 오늘 처음 방문이면 unique_visitors 증가
          if (parseInt(uniqueCheck.rows[0].count) === 1) {
            await pool.query(
              `UPDATE site_stats 
               SET unique_visitors = unique_visitors + 1
               WHERE date = CURRENT_DATE`
            );
          }

          // 오늘 통계
          const todayStats = await pool.query(
            `SELECT page_views, unique_visitors 
             FROM site_stats 
             WHERE date = CURRENT_DATE`
          );

          // 전체 통계
          const totalStats = await pool.query(
            `SELECT 
               SUM(page_views) as total_views,
               SUM(unique_visitors) as total_unique
             FROM site_stats`
          );

          await pool.end();

          return res.status(200).json({
            todayViews: todayStats.rows[0]?.page_views || 0,
            todayUnique: todayStats.rows[0]?.unique_visitors || 0,
            totalViews: parseInt(totalStats.rows[0]?.total_views || '0'),
            totalUnique: parseInt(totalStats.rows[0]?.total_unique || '0')
          });
        } catch (error: any) {
          await pool.end();
          return res.status(500).json({ error: error.message });
        }
      }

      // 기존 카테고리 목록 조회
      const query = `
        SELECT 
          category,
          COUNT(*) as count
        FROM businesses
        GROUP BY category
        ORDER BY count DESC, category ASC
      `;

      const result = await pool.query(query);
      await pool.end();
      
      return res.status(200).json(result.rows);
    } catch (error: any) {
      return res.status(500).json({ 
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
