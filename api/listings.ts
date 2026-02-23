import type { Request, Response } from 'express';
import { desc, eq, like, or, and, sql, gte } from 'drizzle-orm';
import { db } from './_db';
import { listings } from '../shared/schema';

export default async function handler(req: Request, res: Response) {
  try {
    // GET - List listings with filters
    if (req.method === 'GET') {
      const { 
        category, 
        price_type,
        location,
        search, 
        page = '1', 
        limit = '12',
        status = 'active'
      } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      let conditions: any[] = [];
      
      // Only show active and non-expired listings by default
      conditions.push(eq(listings.status, status as string));
      conditions.push(gte(listings.expires_at, sql`NOW()`));
      
      if (category && category !== 'all') {
        conditions.push(eq(listings.category, category as string));
      }
      
      if (price_type && price_type !== 'all') {
        conditions.push(eq(listings.price_type, price_type as string));
      }
      
      if (location && location !== 'all') {
        conditions.push(eq(listings.location, location as string));
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(listings.title, searchTerm),
            like(listings.description, searchTerm)
          )
        );
      }

      // Get total count
      const countQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(and(...conditions))
        .limit(1);
      
      const countResult = await countQuery;
      const total = countResult[0]?.count || 0;

      // Get paginated results
      const items = await db
        .select()
        .from(listings)
        .where(and(...conditions))
        .orderBy(desc(listings.created_at))
        .limit(limitNum)
        .offset(offset);

      res.json({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } 
    // POST - Create new listing
    else if (req.method === 'POST') {
      const listingData = req.body;
      
      // Basic validation
      if (!listingData.title || !listingData.category) {
        return res.status(400).json({ 
          error: 'Title and category are required' 
        });
      }
      
      const [newListing] = await db
        .insert(listings)
        .values(listingData)
        .returning();

      res.status(201).json(newListing);
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Listings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
