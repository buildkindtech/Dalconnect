import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../_db';
import { blogs } from '../../shared/schema';

export default async function handler(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    if (req.method === 'GET') {
      const blog = await db.select()
        .from(blogs)
        .where(eq(blogs.slug, slug))
        .limit(1);

      if (!blog || blog.length === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      res.json(blog[0]);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Blog detail API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
