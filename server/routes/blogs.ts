import { Router } from "express";
import { db } from "../db";
import { blogs } from "../../shared/schema";
import { desc, sql, like } from "drizzle-orm";

const router = Router();

// Get all blogs with optional filtering
router.get("/blogs", async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;

    let query = db.select().from(blogs);

    // Filter by category
    if (category && typeof category === 'string') {
      query = query.where(sql`${blogs.category} = ${category}`) as any;
    }

    // Search in title and content
    if (search && typeof search === 'string') {
      query = query.where(
        sql`${blogs.title} ILIKE ${`%${search}%`} OR ${blogs.content} ILIKE ${`%${search}%`}`
      ) as any;
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
