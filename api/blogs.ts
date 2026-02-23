import type { Request, Response } from 'express';
import { desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from './_db';
import { blogs } from '../shared/schema';

export default async function handler(req: Request, res: Response) {
  try {
    // GET - List blogs with filters
    if (req.method === 'GET') {
      const { category, target_age, search, page = '1', limit = '12' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      let conditions: any[] = [];
      
      if (category && category !== 'all') {
        conditions.push(eq(blogs.category, category as string));
      }
      
      if (target_age && target_age !== 'all') {
        conditions.push(eq(blogs.target_age, target_age as string));
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(blogs.title, searchTerm),
            like(blogs.content, searchTerm),
            like(blogs.excerpt, searchTerm)
          )
        );
      }

      // Get total count
      const countQuery = conditions.length > 0 
        ? db.select({ count: sql<number>`count(*)::int` }).from(blogs).where(sql`${sql.join(conditions, sql` AND `)}`).limit(1)
        : db.select({ count: sql<number>`count(*)::int` }).from(blogs).limit(1);
      
      const countResult = await countQuery;
      const total = countResult[0]?.count || 0;

      // Get paginated results
      let query = db.select().from(blogs);
      
      if (conditions.length > 0) {
        query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
      }
      
      const items = await query
        .orderBy(desc(blogs.published_at))
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
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Blog API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
