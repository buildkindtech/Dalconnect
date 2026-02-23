import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const featured = await storage.getFeaturedBusinesses();
      return res.status(200).json(featured);
    } catch (error) {
      console.error("GET /api/featured error:", error);
      // Return empty array instead of error for now
      return res.status(200).json([]);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
