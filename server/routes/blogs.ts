import { Router } from "express";
import { db } from "../db";
import { blogs } from "../../shared/schema";
import { desc, sql, like } from "drizzle-orm";

const router = Router();

// Get all blogs with optional filtering
router.get("/blogs", async (req, res) => {
  try {
    const { category, search, target_age, tag, limit = 20, offset = 0 } = req.query;

    let conditions = [];

    // Filter by category
    if (category && typeof category === 'string') {
      conditions.push(sql`${blogs.category} = ${category}`);
    }

    // Filter by target_age
    if (target_age && typeof target_age === 'string') {
      conditions.push(sql`${blogs.target_age} = ${target_age}`);
    }

    // Filter by tag
    if (tag && typeof tag === 'string') {
      conditions.push(sql`${blogs.tags}::jsonb @> ${JSON.stringify([tag])}`);
    }

    // Search in title and content
    if (search && typeof search === 'string') {
      conditions.push(
        sql`(${blogs.title} ILIKE ${`%${search}%`} OR ${blogs.content} ILIKE ${`%${search}%`})`
      );
    }

    // Build query with conditions
    let query = db.select().from(blogs);
    
    if (conditions.length > 0) {
      const combined = conditions.reduce((acc, condition) => 
        acc ? sql`${acc} AND ${condition}` : condition
      );
      query = query.where(combined) as any;
    }

    // Apply pagination and ordering
    const results = await query
      .orderBy(desc(blogs.published_at))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json(results);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

// Get single blog by slug
router.get("/blogs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const [blog] = await db
      .select()
      .from(blogs)
      .where(sql`${blogs.slug} = ${slug}`)
      .limit(1);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
});

// Get blog categories with counts
router.get("/blogs/stats/categories", async (req, res) => {
  try {
    const categories = await db
      .select({
        category: blogs.category,
        count: sql<number>`count(*)::int`
      })
      .from(blogs)
      .groupBy(blogs.category);

    res.json(categories);
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

export default router;
