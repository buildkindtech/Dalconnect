import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { createCheckoutSession, verifyWebhook, handleSubscriptionCreated, handleSubscriptionCanceled } from "./stripe";
import { db } from "./db";
import { blogs, newsletterSubscribers, newsSubmissions, listings } from "../shared/schema";
import { desc, sql, eq } from "drizzle-orm";

// HTML entity decoder for news content
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#039;': "'", '&apos;': "'", '&nbsp;': ' ',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019',
    '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&laquo;': '«', '&raquo;': '»',
    '&middot;': '·', '&bull;': '•', '&hellip;': '…',
    '&ndash;': '–', '&mdash;': '—',
    '&copy;': '©', '&reg;': '®', '&trade;': '™',
    '&times;': '×', '&divide;': '÷',
    '&yen;': '¥', '&euro;': '€', '&pound;': '£',
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    if (entities[match]) return entities[match];
    if (match.startsWith('&#x')) return String.fromCharCode(parseInt(match.slice(3, -1), 16));
    if (match.startsWith('&#')) return String.fromCharCode(parseInt(match.slice(2, -1), 10));
    return match;
  });
}
function sanitizeNewsItem(item: any) {
  if (!item) return item;
  return {
    ...item,
    title: decodeHtmlEntities(item.title || ''),
    content: decodeHtmlEntities(item.content || ''),
  };
}

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
      const { category, city, search, featured, sort, id, limit } = req.query;

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
        sort: sort as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      console.log(`[businesses] cat=${category} city=${city} sort=${sort} featured=${featured} limit=${limit} → ${results.length} results`);
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
      const { category, limit, id, offset, city } = req.query;
      // ?id= 단일 기사 조회 (Vercel API와 동일한 동작)
      if (id) {
        const newsItem = await storage.getNewsById(id as string);
        if (!newsItem) return res.status(404).json({ error: "News not found" });
        return res.json(sanitizeNewsItem(newsItem));
      }
      const results = await storage.getNews(
        category as string | undefined,
        limit ? Number(limit) : undefined
      );
      res.json(results.map(sanitizeNewsItem));
    } catch (error) {
      console.error("GET /api/news error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  
  app.get("/api/news/:idOrCategory", async (req, res) => {
    try {
      const param = req.params.idOrCategory;
      
      // If it looks like a UUID or news-* ID, fetch by ID
      if (param.match(/^[0-9a-f]{8}-/) || param.startsWith('news-')) {
        const newsItem = await storage.getNewsById(param);
        if (!newsItem) {
          return res.status(404).json({ error: "News not found" });
        }
        return res.json(sanitizeNewsItem(newsItem));
      }
      
      // Otherwise, treat as category
      const results = await storage.getNews(param);
      res.json(results.map(sanitizeNewsItem));
    } catch (error) {
      console.error("GET /api/news/:idOrCategory error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Contact Form
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, type, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Store in DB
      await db.execute(sql`
        INSERT INTO contact_messages (name, email, type, message, created_at)
        VALUES (${name}, ${email}, ${type || '일반 문의'}, ${message}, NOW())
      `);

      // Send notification email via SendGrid
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      if (SENDGRID_API_KEY) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: 'info@dalkonnect.com' }] }],
            from: { email: 'info@dalkonnect.com', name: 'DalKonnect' },
            reply_to: { email, name },
            subject: `[DalKonnect 문의] ${type || '일반 문의'} - ${name}`,
            content: [{
              type: 'text/html',
              value: `
                <h2>새로운 문의가 접수되었습니다</h2>
                <table style="border-collapse:collapse;width:100%;max-width:500px;">
                  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">이름</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">이메일</td><td style="padding:8px;border:1px solid #ddd;">${email}</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">유형</td><td style="padding:8px;border:1px solid #ddd;">${type || '일반 문의'}</td></tr>
                  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">메시지</td><td style="padding:8px;border:1px solid #ddd;">${message}</td></tr>
                </table>
                <p style="margin-top:16px;color:#666;font-size:12px;">이 메일은 DalKonnect 문의 폼에서 자동 발송되었습니다.</p>
              `,
            }],
          }),
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("POST /api/contact error:", error);
      res.status(500).json({ error: "Failed to send message" });
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

  // Listing detail
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.select().from(listings).where(sql`${listings.id} = ${id}`).limit(1);
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(result[0]);
    } catch(e) {
      console.error("Listing detail error:", e);
      res.status(500).json({ error: "Failed to fetch listing" });
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

  // /api/community
  app.get("/api/community", async (req, res) => {
    try {
      const { action, id, limit = "20" } = req.query as Record<string, string>;
      
      // Detail view: action=post&id=xxx
      if (action === 'post' && id) {
        const postResult = await db.execute(
          sql`SELECT * FROM community_posts WHERE id = ${id} LIMIT 1`
        );
        if (!postResult.rows || postResult.rows.length === 0) {
          return res.json({ success: false, message: "Post not found" });
        }
        let comments: any[] = [];
        try {
          const cr = await db.execute(
            sql`SELECT * FROM community_comments WHERE post_id = ${id} ORDER BY created_at ASC`
          );
          comments = cr.rows || [];
        } catch(e) { /* comments table may not exist */ }
        return res.json({ post: postResult.rows[0], comments });
      }
      
      const lim = parseInt(limit);
      const result = await db.execute(
        sql`SELECT * FROM community_posts ORDER BY created_at DESC LIMIT ${lim}`
      );
      if (action === 'posts') {
        return res.json({ success: true, posts: result.rows || [], total: (result.rows || []).length });
      }
      return res.json({ success: true, data: result.rows || [] });
    } catch (e) {
      console.error("Community error:", e);
      if ((req.query as any).action === 'posts') {
        return res.json({ success: true, posts: [], total: 0 });
      }
      return res.json({ success: true, data: [] });
    }
  });

  // Community detail
  app.get("/api/community/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.execute(
        sql`SELECT * FROM community_posts WHERE id = ${id} LIMIT 1`
      );
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }
      // Also fetch comments if table exists
      let comments: any[] = [];
      try {
        const commentResult = await db.execute(
          sql`SELECT * FROM community_comments WHERE post_id = ${id} ORDER BY created_at ASC`
        );
        comments = commentResult.rows || [];
      } catch(e) { /* comments table may not exist */ }
      
      return res.json({ ...result.rows[0], comments });
    } catch(e) {
      console.error("Community detail error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/community", async (req, res) => {
    try {
      const { action } = req.query as Record<string, string>;
      const body = req.body || {};

      // ── 댓글 등록 ─────────────────────────────────────────────
      if (action === 'comment') {
        const { post_id, nickname, password, content } = body;
        if (!post_id || !nickname || !password || !content) {
          return res.status(400).json({ success: false, message: '필수 항목 누락' });
        }
        const id = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        
        const passwordHash = require('crypto').createHash('sha256').update(String(password)).digest('hex');

        // community_comments 테이블 없으면 생성
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS community_comments (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL,
            parent_id TEXT,
            nickname TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            content TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            ip_hash TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);

        await db.execute(sql`
          INSERT INTO community_comments (id, post_id, parent_id, nickname, password_hash, content, likes, created_at)
          VALUES (${id}, ${post_id}, ${body.parent_id || null}, ${nickname}, ${passwordHash}, ${content}, 0, NOW())
        `);

        // comment_count 업데이트
        await db.execute(sql`
          UPDATE community_posts SET comment_count = comment_count + 1, updated_at = NOW() WHERE id = ${post_id}
        `);

        return res.json({ success: true, id });
      }

      // ── 좋아요 ────────────────────────────────────────────────
      if (action === 'like') {
        const { post_id, comment_id } = body;
        if (post_id) {
          await db.execute(sql`UPDATE community_posts SET likes = likes + 1 WHERE id = ${post_id}`);
        } else if (comment_id) {
          await db.execute(sql`UPDATE community_comments SET likes = likes + 1 WHERE id = ${comment_id}`).catch(() => {});
        }
        return res.json({ success: true });
      }

      // ── 게시글 삭제 ───────────────────────────────────────────
      if (action === 'delete') {
        const { id, type, password } = body;
        if (!id || !type || !password) {
          return res.status(400).json({ success: false, message: '필수 항목 누락' });
        }
        const table = type === 'post' ? 'community_posts' : 'community_comments';
        const result = await db.execute(
          type === 'post'
            ? sql`SELECT password_hash FROM community_posts WHERE id = ${id}`
            : sql`SELECT password_hash FROM community_comments WHERE id = ${id}`
        );
        if (!result.rows?.length) {
          return res.status(404).json({ success: false, message: '게시글 없음' });
        }
        
        const stored = result.rows[0].password_hash as string;
        const hashedInput = require('crypto').createHash('sha256').update(String(password)).digest('hex');
        const valid = hashedInput === stored || password === stored;
        if (!valid) return res.status(403).json({ success: false, message: '비밀번호 오류' });
        if (type === 'post') {
          await db.execute(sql`DELETE FROM community_posts WHERE id = ${id}`);
        } else {
          await db.execute(sql`DELETE FROM community_comments WHERE id = ${id}`).catch(() => {});
        }
        return res.json({ success: true });
      }

      // ── 게시글 등록 (신규 글 작성) ────────────────────────────
      if (action === 'post' || !action) {
        const { nickname, password, title, content, category, tags } = body;
        if (!nickname || !password || !title || !content || !category) {
          return res.status(400).json({ success: false, message: '필수 항목 누락' });
        }
        const id = `post_user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        
        const passwordHash = require('crypto').createHash('sha256').update(String(password)).digest('hex');
        const tagJson = Array.isArray(tags) ? JSON.stringify(tags) : (tags || '[]');
        await db.execute(sql`
          INSERT INTO community_posts (id, nickname, password_hash, title, content, category, tags, views, likes, comment_count, is_pinned, created_at, updated_at, city)
          VALUES (${id}, ${nickname}, ${passwordHash}, ${title}, ${content}, ${category}, ${tagJson}, 0, 0, 0, false, NOW(), NOW(), 'dallas')
        `);
        return res.json({ success: true, id });
      }

      return res.json({ success: true });
    } catch (e: any) {
      console.error('Community POST error:', e.message);
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // /api/search - search across businesses, news, listings
  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ businesses: [], news: [], listings: [] });
    try {
      const term = `%${q}%`;
      const biz = await db.execute(sql`
        SELECT id, name_en as name, name_ko, category, address, city, rating, cover_url
        FROM businesses
        WHERE name_en ILIKE ${term}
           OR COALESCE(name_ko,'') ILIKE ${term}
           OR category ILIKE ${term}
           OR COALESCE(description,'') ILIKE ${term}
        LIMIT 8
      `).catch(() => ({ rows: [] }));

      const news = await db.execute(
        sql`SELECT id, title, category, source, published_at FROM news WHERE title ILIKE ${term} LIMIT 5`
      ).catch(() => ({ rows: [] }));

      const listings = await db.execute(
        sql`SELECT id, title, category, price, location FROM listings WHERE title ILIKE ${term} AND status = 'active' LIMIT 5`
      ).catch(() => ({ rows: [] }));

      return res.json({
        businesses: biz.rows || [],
        news: news.rows || [],
        listings: listings.rows || [],
      });
    } catch (e) {
      return res.json({ businesses: [], news: [], listings: [] });
    }
  });

  // 업체 등록 신청 (관리자 검토 후 등록)
  app.post("/api/businesses/register", async (req, res) => {
    try {
      const { name_en, name_ko, category, address, city, phone, email, website, description } = req.body || {};
      if (!name_en || !category || !address) {
        return res.status(400).json({ success: false, message: '업체명, 카테고리, 주소는 필수입니다' });
      }
      // pending_businesses 테이블 없으면 생성
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS pending_businesses (
          id SERIAL PRIMARY KEY,
          name_en TEXT NOT NULL,
          name_ko TEXT,
          category TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT DEFAULT 'dallas',
          phone TEXT,
          email TEXT,
          website TEXT,
          description TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `).catch(() => {});
      await db.execute(sql`
        INSERT INTO pending_businesses (name_en, name_ko, category, address, city, phone, email, website, description)
        VALUES (${name_en}, ${name_ko || null}, ${category}, ${address}, ${city || 'dallas'}, ${phone || null}, ${email || null}, ${website || null}, ${description || null})
      `);
      return res.json({ success: true, message: '등록 신청이 접수되었습니다. 검토 후 등록됩니다.' });
    } catch (e: any) {
      console.error('Business register error:', e.message);
      return res.status(500).json({ success: false, message: '등록 신청 중 오류가 발생했습니다' });
    }
  });

  // 업체 문의 이메일 (stub — 실제 메일 발송은 SendGrid 연동 시)
  app.post("/api/businesses/:id/contact", async (req, res) => {
    const { name, email, message, phone } = req.body || {};
    if (!name || !message) return res.status(400).json({ success: false, message: '이름과 문의내용은 필수입니다' });
    // TODO: SendGrid 연동 시 실제 메일 발송
    console.log(`[업체문의] 업체ID:${req.params.id} | ${name}(${email}): ${message?.slice(0,50)}`);
    return res.json({ success: true, message: '문의가 접수되었습니다. 업체에 전달됩니다.' });
  });

  // /api/deals
  app.get("/api/deals", async (req, res) => {
    try {
      const { limit = "50", category } = req.query as Record<string, string>;
      let query = `SELECT id, title, description, discount, category, expires_at, store,
        original_price, deal_price, coupon_code, deal_url, image_url, is_verified,
        likes, views, source, created_at FROM deals ORDER BY created_at DESC LIMIT $1`;
      const params: any[] = [parseInt(limit)];
      
      if (category) {
        query = `SELECT id, title, description, discount, category, expires_at, store,
          original_price, deal_price, coupon_code, deal_url, image_url, is_verified,
          likes, views, source, created_at FROM deals WHERE category = $2 ORDER BY created_at DESC LIMIT $1`;
        params.push(category);
      }
      
      const result = await db.execute(sql.raw(query.replace(/\$1/g, params[0].toString()).replace(/\$2/g, `'${params[1] || ''}'`)));
      res.json(result.rows || []);
    } catch (e) {
      console.error("Deals error:", e);
      res.json([]);
    }
  });

  // /api/place-photo — Google Places Photo proxy (avoids API key domain restrictions)
  app.get("/api/place-photo", async (req, res) => {
    try {
      const { ref, maxWidth, maxHeight } = req.query as Record<string, string>;
      if (!ref || !ref.startsWith('places/') || !ref.includes('/photos/')) {
        return res.status(400).json({ error: 'Invalid ref' });
      }
      const API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE';
      const w = parseInt(maxWidth) || 800;
      const h = parseInt(maxHeight) || 800;
      const googleUrl = `https://places.googleapis.com/v1/${ref}?maxHeightPx=${h}&maxWidthPx=${w}&key=${API_KEY}`;
      const response = await fetch(googleUrl, { headers: { 'Accept': 'image/*' }, redirect: 'follow' });
      if (!response.ok && response.status !== 302) {
        return res.status(response.status).json({ error: `Google API ${response.status}` });
      }
      // Handle redirect manually if needed
      if (response.status === 302) {
        const location = response.headers.get('location');
        if (location) {
          const imgResponse = await fetch(location);
          const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
          const buffer = Buffer.from(await imgResponse.arrayBuffer());
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=604800');
          return res.status(200).send(buffer);
        }
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.status(200).send(buffer);
    } catch (error: any) {
      console.error("place-photo proxy error:", error.message);
      return res.status(500).json({ error: 'Failed to fetch photo' });
    }
  });

  // /api/charts
  app.get("/api/charts", async (req, res) => {
    try {
      const { type, limit = "20" } = req.query as Record<string, string>;
      const lim = parseInt(limit);
      let result;
      
      if (type) {
        result = await db.execute(
          sql`SELECT id, chart_type, rank, title_ko, title_en, artist, platform,
            youtube_url, thumbnail_url, description, score, chart_date, created_at
            FROM charts WHERE chart_type = ${type} ORDER BY rank ASC LIMIT ${lim}`
        );
      } else {
        result = await db.execute(
          sql`SELECT id, chart_type, rank, title_ko, title_en, artist, platform,
            youtube_url, thumbnail_url, description, score, chart_date, created_at
            FROM charts ORDER BY chart_date DESC, rank ASC LIMIT ${lim}`
        );
      }
      
      res.json(result.rows || []);
    } catch (e) {
      console.error("Charts error:", e);
      res.json([]);
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
      // 방문 기록 + 통계 반환
      try {
        const today = new Date().toISOString().split('T')[0];
        await db.execute(sql`
          INSERT INTO page_views (date, views, unique_views)
          VALUES (${today}, 1, 1)
          ON CONFLICT (date) DO UPDATE SET views = page_views.views + 1
        `).catch(() => {}); // 테이블 없으면 skip
        const totalRes = await db.execute(sql`SELECT COALESCE(SUM(views),0) as total FROM page_views`).catch(() => ({ rows: [{ total: 0 }] }));
        const todayRes = await db.execute(sql`SELECT COALESCE(SUM(views),0) as today FROM page_views WHERE date = ${today}`).catch(() => ({ rows: [{ today: 0 }] }));
        return res.json({
          success: true,
          totalViews: Number(totalRes.rows[0]?.total ?? 0),
          todayUnique: Number(todayRes.rows[0]?.today ?? 0),
          todayViews: Number(todayRes.rows[0]?.today ?? 0),
        });
      } catch {
        return res.json({ success: true, totalViews: 0, todayUnique: 0, todayViews: 0 });
      }
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

  // ─── 사이트 통계 (네브바용) ───────────────────────────────────────
  app.get("/api/stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [bizRes, newsRes, blogRes, totalRes, todayRes] = await Promise.all([
        db.execute(sql`SELECT COUNT(*) as count FROM businesses`),
        db.execute(sql`SELECT COUNT(*) as count FROM news WHERE content IS NOT NULL AND length(content) > 50`).catch(() => ({ rows: [{ count: 0 }] })),
        db.execute(sql`SELECT COUNT(*) as count FROM blogs`).catch(() => ({ rows: [{ count: 0 }] })),
        db.execute(sql`SELECT COALESCE(SUM(views),0) as total FROM page_views`).catch(() => ({ rows: [{ total: 0 }] })),
        db.execute(sql`SELECT COALESCE(SUM(views),0) as today FROM page_views WHERE date = ${today}`).catch(() => ({ rows: [{ today: 0 }] })),
      ]);
      return res.json({
        totalBusinesses: Number(bizRes.rows[0]?.count ?? 0),
        totalPosts: Number(newsRes.rows[0]?.count ?? 0) + Number(blogRes.rows[0]?.count ?? 0),
        totalViews: Number(totalRes.rows[0]?.total ?? 0),
        todayViews: Number(todayRes.rows[0]?.today ?? 0),
      });
    } catch (e) {
      return res.json({ totalBusinesses: 0, totalPosts: 0, totalViews: 0, todayViews: 0 });
    }
  });

  // ─── SEO: 동적 Sitemap ───────────────────────────────────────────
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const BASE = "https://dalkonnect.com";
      const now = new Date().toISOString().split("T")[0];

      // 정적 페이지
      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/businesses", priority: "0.9", changefreq: "weekly" },
        { url: "/news", priority: "0.9", changefreq: "hourly" },
        { url: "/blog", priority: "0.8", changefreq: "daily" },
        { url: "/marketplace", priority: "0.7", changefreq: "daily" },
        { url: "/community", priority: "0.7", changefreq: "daily" },
        { url: "/charts", priority: "0.6", changefreq: "weekly" },
        { url: "/about", priority: "0.5", changefreq: "monthly" },
      ];

      // 뉴스 개별 URL
      const newsRows = await db.execute(
        sql`SELECT id, published_at FROM news WHERE content IS NOT NULL AND length(content) > 50 ORDER BY published_at DESC LIMIT 1000`
      );

      // 블로그 개별 URL
      const blogRows = await db.execute(
        sql`SELECT slug, published_at FROM blogs WHERE slug IS NOT NULL ORDER BY published_at DESC`
      );

      const urls: string[] = [];

      // 정적
      for (const p of staticPages) {
        urls.push(`  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
      }

      // 뉴스
      for (const row of (newsRows.rows || [])) {
        const d = row.published_at ? new Date(row.published_at as string).toISOString().split("T")[0] : now;
        urls.push(`  <url>
    <loc>${BASE}/news/${row.id}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }

      // 블로그
      for (const row of (blogRows.rows || [])) {
        const d = row.published_at ? new Date(row.published_at as string).toISOString().split("T")[0] : now;
        urls.push(`  <url>
    <loc>${BASE}/blog/${row.slug}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Sitemap error");
    }
  });

  // ─── SEO: robots.txt ─────────────────────────────────────────────
  app.get("/robots.txt", (req, res) => {
    res.set("Content-Type", "text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://dalkonnect.com/sitemap.xml`);
  });

  // ─── SEO: 뉴스 상세 메타태그 SSR ──────────────────────────────────
  app.get("/news/:id", async (req, res, next) => {
    const ua = req.headers["user-agent"] || "";
    // 봇 또는 소셜 크롤러에게만 SSR 메타 주입
    const isBot = /googlebot|bingbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discordbot|applebot|yandex/i.test(ua);
    if (!isBot) return next();

    try {
      const newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem) return next();

      const title = `${(newsItem as any).title || "달라스 한인 뉴스"} | DalKonnect`;
      const desc = ((newsItem as any).content || "").slice(0, 160).replace(/"/g, "&quot;");
      const thumb = (newsItem as any).thumbnail_url || "https://dalkonnect.com/og-image.png";
      const url = `https://dalkonnect.com/news/${req.params.id}`;

      res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${thumb}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ko_KR">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
</head>
<body><p>${desc}</p></body>
</html>`);
    } catch (e) {
      next();
    }
  });

  // ─── SEO: 블로그 상세 메타태그 SSR ──────────────────────────────────
  app.get("/blog/:slug", async (req, res, next) => {
    const ua = req.headers["user-agent"] || "";
    const isBot = /googlebot|bingbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discordbot|applebot|yandex/i.test(ua);
    if (!isBot) return next();

    try {
      const blogItem = await db.execute(
        sql`SELECT title, content, slug, published_at FROM blogs WHERE slug = ${req.params.slug} LIMIT 1`
      );
      const row = blogItem.rows?.[0];
      if (!row) return next();

      const title = `${row.title || "달라스 한인 블로그"} | DalKonnect`;
      const desc = ((row.content as string) || "").replace(/<[^>]+>/g, "").slice(0, 160).replace(/"/g, "&quot;");
      const url = `https://dalkonnect.com/blog/${req.params.slug}`;

      res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ko_KR">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
</head>
<body><p>${desc}</p></body>
</html>`);
    } catch (e) {
      next();
    }
  });

  // ─── Mart Videos API ──────────────────────────────────────────────
  app.get('/api/mart-videos', async (req: any, res: any) => {
    try {
      const store = (req.query.store as string) || 'costco';
      const limit = parseInt(req.query.limit as string) || 6;
      const result = await (db as any).execute(
        sql.raw(`SELECT id, video_id, title, title_clean, store, channel_name, thumbnail_url, published_at::date as date, youtube_url
                 FROM mart_videos
                 WHERE store = '${store.replace(/'/g, "''")}'
                 ORDER BY published_at DESC
                 LIMIT ${limit}`)
      );
      res.json(result.rows || result);
    } catch (err: any) {
      // 테이블 없으면 빈 배열 반환 (첫 배포 시)
      res.json([]);
    }
  });

  return httpServer;
}
