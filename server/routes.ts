import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "../db";
import { businesses, news } from "@/shared/schema";
import { eq, and, like, desc, or, ilike } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // GET /api/businesses - 전체 비즈니스 리스팅 (필터 지원)
  app.get("/api/businesses", async (req, res) => {
    try {
      const { category, city, tier, featured, search } = req.query;
      
      let conditions = [];
      
      if (category) {
        conditions.push(eq(businesses.category, category as string));
      }
      if (city) {
        conditions.push(eq(businesses.city, city as string));
      }
      if (tier) {
        conditions.push(eq(businesses.tier, tier as string));
      }
      if (featured === 'true') {
        conditions.push(eq(businesses.featured, true));
      }
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            ilike(businesses.name_en, searchTerm),
            ilike(businesses.name_ko, searchTerm)
          )
        );
      }
      
      const query = db.select().from(businesses);
      const results = conditions.length > 0 
        ? await query.where(and(...conditions))
        : await query;
      
      res.json(results);
    } catch (error) {
      console.error("GET /api/businesses error:", error);
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });
  
  // GET /api/businesses/:id - 개별 비즈니스
  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const business = await db.select()
        .from(businesses)
        .where(eq(businesses.id, req.params.id))
        .limit(1);
      
      if (business.length === 0) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      res.json(business[0]);
    } catch (error) {
      console.error("GET /api/businesses/:id error:", error);
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });
  
  // GET /api/featured - Featured 비즈니스
  app.get("/api/featured", async (req, res) => {
    try {
      const featured = await db.select()
        .from(businesses)
        .where(eq(businesses.featured, true))
        .limit(10);
      
      res.json(featured);
    } catch (error) {
      console.error("GET /api/featured error:", error);
      res.status(500).json({ error: "Failed to fetch featured businesses" });
    }
  });
  
  // POST /api/businesses - 비즈니스 추가 (자동화용)
  app.post("/api/businesses", async (req, res) => {
    try {
      const newBusiness = await db.insert(businesses)
        .values(req.body)
        .returning();
      
      res.status(201).json(newBusiness[0]);
    } catch (error) {
      console.error("POST /api/businesses error:", error);
      res.status(500).json({ error: "Failed to create business" });
    }
  });
  
  // GET /api/news - 뉴스 전체
  app.get("/api/news", async (req, res) => {
    try {
      const { category, limit = 20 } = req.query;
      
      let query = db.select().from(news).orderBy(desc(news.published_date));
      
      if (category) {
        query = query.where(eq(news.category, category as string));
      }
      
      const results = await query.limit(Number(limit));
      res.json(results);
    } catch (error) {
      console.error("GET /api/news error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  
  // GET /api/news/:category - 카테고리별 뉴스
  app.get("/api/news/:category", async (req, res) => {
    try {
      const results = await db.select()
        .from(news)
        .where(eq(news.category, req.params.category))
        .orderBy(desc(news.published_date))
        .limit(20);
      
      res.json(results);
    } catch (error) {
      console.error("GET /api/news/:category error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  
  // POST /api/news - 뉴스 추가 (자동화용)
  app.post("/api/news", async (req, res) => {
    try {
      const newNews = await db.insert(news)
        .values(req.body)
        .returning();
      
      res.status(201).json(newNews[0]);
    } catch (error) {
      console.error("POST /api/news error:", error);
      res.status(500).json({ error: "Failed to create news" });
    }
  });

  return httpServer;
}
