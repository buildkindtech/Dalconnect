import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { category, city, search, featured } = req.query;
      
      const results = await db.getBusinesses({
        category: category as string | undefined,
        city: city as string | undefined,
        search: search as string | undefined,
        featured: featured === 'true' ? true : undefined,
      });
      
      return res.status(200).json(results);
    } catch (error) {
      console.error("GET /api/businesses error:", error);
      return res.status(500).json({ error: "Failed to fetch businesses" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
