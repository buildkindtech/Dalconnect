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
    } catch (error: any) {
      console.error("GET /api/featured error:", error);
      return res.status(500).json({ 
        error: "Failed to fetch featured businesses",
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
