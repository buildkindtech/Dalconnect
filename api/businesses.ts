import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { businesses } from '../shared/schema';
import { eq, and, or, ilike } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const db = getDb();
      const { category, city, search, featured } = req.query;
      
      const conditions = [];

      if (category) {
        conditions.push(eq(businesses.category, category as string));
      }
      if (city) {
        conditions.push(eq(businesses.city, city as string));
      }
      if (featured === 'true') {
        conditions.push(eq(businesses.featured, true));
      }
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            ilike(businesses.name_en, searchTerm),
            ilike(businesses.name_ko, searchTerm)
          )
        );
      }

      const results = conditions.length > 0
        ? await db.select().from(businesses).where(and(...conditions))
        : await db.select().from(businesses);
      
      return res.status(200).json(results);
    } catch (error: any) {
      console.error("GET /api/businesses error:", error);
      return res.status(500).json({ 
        error: "Failed to fetch businesses",
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
