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
  website: varchar("website", { length: 1000 }),
  hours: json("hours").$type<Record<string, string>>(),
  logo_url: varchar("logo_url", { length: 1000 }),
  cover_url: varchar("cover_url", { length: 1000 }),
  photos: json("photos").$type<string[]>(),
  tier: varchar("tier", { length: 20 }).default('free'),
  featured: boolean("featured").default(false),
  claimed: boolean("claimed").default(false),
  rating: numeric("rating", { precision: 2, scale: 1 }).default('0'),
  review_count: integer("review_count").default(0),
  google_place_id: varchar("google_place_id", { length: 1000 }).unique(),
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
  url: varchar("url", { length: 2000 }).notNull().unique(),
  content: text("content"),
  category: varchar("category", { length: 100 }),
  published_date: timestamp("published_date"),
  source: varchar("source", { length: 255 }),
  thumbnail_url: varchar("thumbnail_url", { length: 1000 }),
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
  tags: json("tags").$type<string[]>(),
  target_age: varchar("target_age", { length: 50 }).default('all'),
  cover_url: varchar("cover_url", { length: 500 }),
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

// Listings table (Marketplace)
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  price_type: varchar("price_type", { length: 20 }).default('fixed'), // fixed, negotiable, free, contact
  category: varchar("category", { length: 50 }).notNull(),
  condition: varchar("condition", { length: 20 }), // new, like_new, good, fair
  photos: json("photos").$type<string[]>().default(sql`'[]'`),
  contact_method: varchar("contact_method", { length: 20 }).default('phone'), // phone, email, kakao, message
  contact_info: varchar("contact_info", { length: 200 }),
  author_name: varchar("author_name", { length: 100 }),
  author_phone: varchar("author_phone", { length: 20 }),
  location: varchar("location", { length: 100 }),
  status: varchar("status", { length: 20 }).default('active'), // active, sold, expired, removed
  views: integer("views").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  expires_at: timestamp("expires_at").default(sql`NOW() + INTERVAL '30 days'`)
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  created_at: true,
  updated_at: true,
  expires_at: true,
  views: true,
});
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// Search logs table
export const searchLogs = pgTable("search_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: varchar("query", { length: 200 }).notNull(),
  results_count: integer("results_count").default(0),
  ip_address: varchar("ip_address", { length: 45 }),
  created_at: timestamp("created_at").defaultNow()
});

export const insertSearchLogSchema = createInsertSchema(searchLogs).omit({
  id: true,
  created_at: true,
});
export type InsertSearchLog = z.infer<typeof insertSearchLogSchema>;
export type SearchLog = typeof searchLogs.$inferSelect;

// Newsletter subscribers table
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  active: boolean("active").default(true),
  subscribed_at: timestamp("subscribed_at").defaultNow(),
  unsubscribed_at: timestamp("unsubscribed_at"),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribed_at: true,
  unsubscribed_at: true,
});
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Community news submissions table
export const newsSubmissions = pgTable("news_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  source_url: varchar("source_url", { length: 1000 }),
  submitter_name: varchar("submitter_name", { length: 255 }),
  submitter_email: varchar("submitter_email", { length: 255 }),
  submitter_phone: varchar("submitter_phone", { length: 50 }),
  status: varchar("status", { length: 20 }).default('pending'), // pending, approved, rejected
  created_at: timestamp("created_at").defaultNow(),
  reviewed_at: timestamp("reviewed_at"),
});

export const insertNewsSubmissionSchema = createInsertSchema(newsSubmissions).omit({
  id: true,
  created_at: true,
  reviewed_at: true,
  status: true,
});
export type InsertNewsSubmission = z.infer<typeof insertNewsSubmissionSchema>;
export type NewsSubmission = typeof newsSubmissions.$inferSelect;

// Community posts table
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default('자유게시판'),
  tags: json("tags").$type<string[]>().default(sql`'[]'`),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comment_count: integer("comment_count").default(0),
  is_pinned: boolean("is_pinned").default(false),
  ip_hash: varchar("ip_hash", { length: 64 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  created_at: true,
  updated_at: true,
  views: true,
  likes: true,
  comment_count: true,
});
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;

// Community comments table
export const communityComments = pgTable("community_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  post_id: varchar("post_id").notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  parent_id: varchar("parent_id").references(() => communityComments.id, { onDelete: 'cascade' }),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  ip_hash: varchar("ip_hash", { length: 64 }),
  created_at: timestamp("created_at").defaultNow()
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  created_at: true,
  likes: true,
});
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type CommunityComment = typeof communityComments.$inferSelect;

// Community trends table
export const communityTrends = pgTable("community_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  period: varchar("period", { length: 20 }).notNull(), // 'daily', 'weekly'
  trending_topics: json("trending_topics").$type<Array<{topic: string, count: number, sentiment: string}>>(),
  popular_keywords: json("popular_keywords").$type<Array<{keyword: string, count: number}>>(),
  recommended_content: json("recommended_content").$type<Array<{type: string, id: string, title: string, relevance_score: number}>>(),
  analyzed_at: timestamp("analyzed_at").defaultNow()
});

export const insertCommunityTrendSchema = createInsertSchema(communityTrends).omit({
  id: true,
  analyzed_at: true,
});
export type InsertCommunityTrend = z.infer<typeof insertCommunityTrendSchema>;
export type CommunityTrend = typeof communityTrends.$inferSelect;
