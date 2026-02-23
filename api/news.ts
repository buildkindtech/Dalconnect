import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { category, limit } = req.query;
      const results = await storage.getNews(
        category as string | undefined,
        limit ? Number(limit) : undefined
      );
      return res.status(200).json(results);
    } catch (error) {
      console.error("GET /api/news error:", error);
      return res.status(500).json({ error: "Failed to fetch news" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
