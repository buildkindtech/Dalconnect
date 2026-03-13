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
      
      // If it looks like a UUID or news-* ID, fetch by ID
      if (param.match(/^[0-9a-f]{8}-/) || param.startsWith('news-')) {
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
      let comments = [];
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
