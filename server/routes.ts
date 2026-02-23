import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { createCheckoutSession, verifyWebhook, handleSubscriptionCreated, handleSubscriptionCanceled } from "./stripe";

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

  return httpServer;
}
