import type { Request, Response } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../_db';
import { listings } from '../../shared/schema';

export default async function handler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (req.method === 'GET') {
      // Increment view count
      await db.execute(sql`
        UPDATE listings 
        SET views = views + 1 
        WHERE id = ${id}
      `);
      
      const listing = await db.select()
        .from(listings)
        .where(eq(listings.id, id))
        .limit(1);

      if (!listing || listing.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json(listing[0]);
    } 
    else if (req.method === 'PATCH') {
      const updates = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updates.id;
      delete updates.created_at;
      delete updates.views;
      
      updates.updated_at = new Date();

      const [updatedListing] = await db
        .update(listings)
        .set(updates)
        .where(eq(listings.id, id))
        .returning();

      if (!updatedListing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json(updatedListing);
    } 
    else if (req.method === 'DELETE') {
      // Soft delete - mark as removed instead of actual deletion
      const [deletedListing] = await db
        .update(listings)
        .set({ 
          status: 'removed',
          updated_at: new Date()
        })
        .where(eq(listings.id, id))
        .returning();

      if (!deletedListing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json({ message: 'Listing removed successfully' });
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Listing detail API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
