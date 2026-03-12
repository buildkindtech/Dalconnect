import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { createCheckoutSession, verifyWebhook, handleSubscriptionCreated, handleSubscriptionCanceled } from "./stripe";
import { db } from "./db";
import { blogs, newsletterSubscribers, newsSubmissions, listings } from "../shared/schema";
import { desc, sql, eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server | null,
  app: Express
): Promise<Server | null> {
  
  // Health check / setup status
  app.get("/api/health", async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        status: "setup_required",
        message: "DATABASE_URL environment variable not configured",
        instructions: "Add DATABASE_URL to Vercel Environment Variables"
      });
    }
    res.json({ status: "ok" });
  });
  
  app.get("/api/businesses", async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: "Database not configured" });
    }
    try {
      const { category, city, search, featured, id } = req.query;

      // Single business lookup by id
      if (id) {
        const business = await storage.getBusiness(id as string);
        if (!business) return res.status(404).json({ error: "Business not found" });
        return res.json(business);
      }
      
      const results = await storage.getBusinesses({
        category: category as string | undefined,
        city: city as string | undefined,
        search: search as string | undefined,
        featured: featured === 'true' ? true : undefined,
      });
      
      // Return { businesses, total } shape expected by frontend
      res.json({ businesses: results, total: results.length });
    } catch (error) {
      console.error("GET /api/businesses error:", error);
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });
  
  app.get("/api/featured", async (_req, res) => {
    try {
      const featured = await storage.getFeaturedBusinesses();
      res.json(featured);
    } catch (error) {
      console.error("GET /api/featured error:", error);
      res.status(500).json({ error: "Failed to fetch featured businesses" });
    }
  });

  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      res.json(business);
    } catch (error) {
      console.error("GET /api/businesses/:id error:", error);
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });
  
  app.get("/api/news", async (req, res) => {
    try {
      const { category, limit } = req.query;
      const results = await storage.getNews(
        category as string | undefined,
        limit ? Number(limit) : undefined
      );
      res.json(results);
    } catch (error) {
      console.error("GET /api/news error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  
  app.get("/api/news/:idOrCategory", async (req, res) => {
    try {
      const param = req.params.idOrCategory;
      
      // If it looks like an ID (news-1, news-2, etc.), fetch by ID
      if (param.startsWith('news-')) {
        const newsItem = await storage.getNewsById(param);
        if (!newsItem) {
          return res.status(404).json({ error: "News not found" });
        }
        return res.json(newsItem);
      }
      
      // Otherwise, treat as category
      const results = await storage.getNews(param);
      res.json(results);
    } catch (error) {
      console.error("GET /api/news/:idOrCategory error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Stripe: Create Checkout Session
  app.post("/api/stripe/create-checkout", async (req, res) => {
    try {
      const { tier, businessId, email } = req.body;
      
      if (!tier || !businessId || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (tier !== "premium" && tier !== "elite") {
        return res.status(400).json({ error: "Invalid tier" });
      }

      const session = await createCheckoutSession(tier, businessId, email);
      
      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("POST /api/stripe/create-checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Stripe: Webhook Handler
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      
      if (!signature) {
        return res.status(400).json({ error: "Missing signature" });
      }

      const event = verifyWebhook(req.rawBody as Buffer, signature);

      // Handle different event types
      switch (event.type) {
        case "customer.subscription.created":
          await handleSubscriptionCreated(event.data.object as any);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionCanceled(event.data.object as any);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("POST /api/stripe/webhook error:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });

  // Blog routes
  app.get("/api/blogs", async (req, res) => {
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
  app.get("/api/blogs/:slug", async (req, res) => {
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

  // Newsletter subscription
  app.post("/api/newsletter", async (req, res) => {
    try {
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({ message: "이메일은 필수입니다" });
      }

      // Check if already subscribed
      const existing = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .limit(1);

      if (existing.length > 0) {
        // Reactivate if previously unsubscribed
        if (!existing[0].active) {
          await db
            .update(newsletterSubscribers)
            .set({ 
              active: true, 
              subscribed_at: new Date(),
              unsubscribed_at: null,
            })
            .where(eq(newsletterSubscribers.email, email));
          
          return res.json({ message: "구독이 재활성화되었습니다" });
        }
        
        return res.status(400).json({ message: "이미 구독 중입니다" });
      }

      // Create new subscription
      await db.insert(newsletterSubscribers).values({
        email,
        name: name || null,
        active: true,
      });

      res.json({ message: "구독 완료!" });
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ message: "구독에 실패했습니다" });
    }
  });

  // Newsletter unsubscribe
  app.delete("/api/newsletter", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "이메일은 필수입니다" });
      }

      await db
        .update(newsletterSubscribers)
        .set({ 
          active: false,
          unsubscribed_at: new Date(),
        })
        .where(eq(newsletterSubscribers.email, email));

      res.json({ message: "구독이 취소되었습니다" });
    } catch (error) {
      console.error("Error unsubscribing from newsletter:", error);
      res.status(500).json({ message: "구독 취소에 실패했습니다" });
    }
  });

  // News submission
  app.post("/api/news-submissions", async (req, res) => {
    try {
      const {
        title,
        content,
        category,
        source_url,
        submitter_name,
        submitter_email,
        submitter_phone,
      } = req.body;

      if (!title || !content || !category) {
        return res.status(400).json({ 
          message: "제목, 내용, 카테고리는 필수입니다" 
        });
      }

      await db.insert(newsSubmissions).values({
        title,
        content,
        category,
        source_url: source_url || null,
        submitter_name: submitter_name || null,
        submitter_email: submitter_email || null,
        submitter_phone: submitter_phone || null,
        status: 'pending',
      });

      res.json({ message: "제보가 성공적으로 제출되었습니다" });
    } catch (error) {
      console.error("Error submitting news:", error);
      res.status(500).json({ message: "제보에 실패했습니다" });
    }
  });

  // 사고팔기 (Listings)
  app.get("/api/listings", async (req, res) => {
    try {
      const { category, city, limit = "50" } = req.query as Record<string, string>;
      let query = db.select().from(listings).where(eq(listings.status, 'active'));
      const results = await db.select().from(listings)
        .where(eq(listings.status, 'active'))
        .orderBy(desc(listings.created_at))
        .limit(parseInt(limit));
      const filtered = results.filter(r => {
        if (category && r.category !== category) return false;
        if (city && r.city !== city) return false;
        return true;
      });
      res.json(filtered);
    } catch (error) {
      console.error("Listings error:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const { title, description, price, category, condition, contact_method, contact_info, author_name, author_phone, location, city } = req.body;
      const result = await db.insert(listings).values({
        id: `listing_${Date.now()}`,
        title, description,
        price: price ? String(price) : null,
        category, condition,
        contact_method: contact_method || '카카오톡',
        contact_info: contact_info || null,
        author_name, author_phone: author_phone || null,
        location, city,
        status: 'active',
        views: 0,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }).returning();
      res.json(result[0]);
    } catch (error) {
      console.error("Create listing error:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  // /api/community - stub (future feature)
  app.get("/api/community", async (req, res) => {
    const { action } = req.query;
    if (action === 'posts') {
      return res.json({ success: true, posts: [], total: 0 });
    }
    return res.json({ success: true, data: [] });
  });

  app.post("/api/community", async (req, res) => {
    return res.json({ success: true });
  });

  // /api/search - search across businesses, news, listings
  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ businesses: [], news: [], listings: [] });
    try {
      const term = `%${q}%`;
      const [bizResults, newsResults, listingResults] = await Promise.all([
        db.execute(sql`SELECT id, name_en as name, name_ko, category, address, city, rating FROM businesses WHERE name_en ILIKE ${term} OR name_ko ILIKE ${term} OR category ILIKE ${term} LIMIT 5`),
        db.execute(sql`SELECT id, title, category, source, published_at FROM news WHERE title ILIKE ${term} LIMIT 5`),
        db.execute(sql`SELECT id, title, category, price, location FROM listings WHERE title ILIKE ${term} AND status = 'active' LIMIT 5`),
      ]);
      return res.json({
        businesses: bizResults.rows || [],
        news: newsResults.rows || [],
        listings: listingResults.rows || [],
      });
    } catch (e) {
      return res.json({ businesses: [], news: [], listings: [] });
    }
  });

  // /api/categories - stub for charts, visit tracking, category list
  app.get("/api/categories", async (req, res) => {
    const { action, type } = req.query;
    if (action === 'charts') {
      // Return empty chart data (future feature)
      return res.json({ success: false, data: [] });
    }
    if (action === 'visit') {
      // Track visit (no-op for now)
      return res.json({ success: true });
    }
    // Default: return category counts from businesses
    try {
      const result = await db.execute(
        sql`SELECT category, COUNT(*) as count FROM businesses GROUP BY category ORDER BY count DESC`
      );
      return res.json(result.rows || []);
    } catch (e) {
      return res.json([]);
    }
  });

  return httpServer;
}
