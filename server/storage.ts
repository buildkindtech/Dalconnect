import { db } from "./db";
import { users, businesses, news, type User, type InsertUser, type Business, type News } from "../shared/schema";
import { eq, and, desc, or, ilike } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getBusinesses(filters?: { category?: string; city?: string; search?: string; featured?: boolean }): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | undefined>;
  getFeaturedBusinesses(): Promise<Business[]>;
  getNews(category?: string, limit?: number): Promise<News[]>;
  getNewsById(id: string): Promise<News | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getBusinesses(filters?: { category?: string; city?: string; search?: string; featured?: boolean }): Promise<Business[]> {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(businesses.category, filters.category));
    }
    if (filters?.city) {
      conditions.push(eq(businesses.city, filters.city));
    }
    if (filters?.featured) {
      conditions.push(eq(businesses.featured, true));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(businesses.name_en, searchTerm),
          ilike(businesses.name_ko, searchTerm)
        )
      );
    }

    if (conditions.length > 0) {
      return db.select().from(businesses).where(and(...conditions));
    }
    return db.select().from(businesses);
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async getFeaturedBusinesses(): Promise<Business[]> {
    return db.select().from(businesses).where(eq(businesses.featured, true)).limit(10);
  }

  async getNews(category?: string, limit: number = 20): Promise<News[]> {
    if (category) {
      return db.select().from(news).where(eq(news.category, category)).orderBy(desc(news.published_date)).limit(limit);
    }
    return db.select().from(news).orderBy(desc(news.published_date)).limit(limit);
  }

  async getNewsById(id: string): Promise<News | undefined> {
    const [newsItem] = await db.select().from(news).where(eq(news.id, id));
    return newsItem;
  }
}

export const storage = new DatabaseStorage();
