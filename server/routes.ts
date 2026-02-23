import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { createCheckoutSession, verifyWebhook, handleSubscriptionCreated, handleSubscriptionCanceled } from "./stripe";
import { db } from "./db";
import { blogs, newsletterSubscribers, newsSubmissions } from "../shared/schema";
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
      const { category, city, search, featured } = req.query;
      
      const results = await storage.getBusinesses({
        category: category as string | undefined,
        city: city as string | undefined,
        search: search as string | undefined,
        featured: featured === 'true' ? true : undefined,
      });
      
      res.json(results);
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

  return httpServer;
}
