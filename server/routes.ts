import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/businesses", async (req, res) => {
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

  return httpServer;
}
