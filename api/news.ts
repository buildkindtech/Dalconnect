import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { news } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const db = getDb();
      const { category, limit } = req.query;
      const limitNum = limit ? Number(limit) : 20;
      
      const results = category
        ? await db
            .select()
            .from(news)
            .where(eq(news.category, category as string))
            .orderBy(desc(news.published_date))
            .limit(limitNum)
        : await db
            .select()
            .from(news)
            .orderBy(desc(news.published_date))
            .limit(limitNum);
      
      return res.status(200).json(results);
    } catch (error: any) {
      console.error("GET /api/news error:", error);
      return res.status(500).json({ 
        error: "Failed to fetch news",
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
