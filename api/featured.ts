import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { businesses } from '../shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const db = getDb();
      const featured = await db
        .select()
        .from(businesses)
        .where(eq(businesses.featured, true))
        .limit(10);
      
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
