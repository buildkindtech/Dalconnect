import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Businesses table
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name_en: varchar("name_en", { length: 255 }).notNull(),
  name_ko: varchar("name_ko", { length: 255 }),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),
  hours: json("hours").$type<Record<string, string>>(),
  logo_url: varchar("logo_url", { length: 500 }),
  cover_url: varchar("cover_url", { length: 500 }),
  photos: json("photos").$type<string[]>(),
  tier: varchar("tier", { length: 20 }).default('free'),
  featured: boolean("featured").default(false),
  claimed: boolean("claimed").default(false),
  rating: numeric("rating", { precision: 2, scale: 1 }).default('0'),
  review_count: integer("review_count").default(0),
  google_place_id: varchar("google_place_id", { length: 500 }).unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

// News table
export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull().unique(),
  content: text("content"),
  category: varchar("category", { length: 100 }),
  published_date: timestamp("published_date"),
  source: varchar("source", { length: 255 }),
  thumbnail_url: varchar("thumbnail_url", { length: 500 }),
  created_at: timestamp("created_at").defaultNow()
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  created_at: true,
});
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

// Blogs table
export const blogs = pgTable("blogs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  category: varchar("category", { length: 100 }),
  cover_image: varchar("cover_image", { length: 500 }),
  author: varchar("author", { length: 255 }).default('DalConnect'),
  published_at: timestamp("published_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertBlogSchema = createInsertSchema(blogs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type Blog = typeof blogs.$inferSelect;
