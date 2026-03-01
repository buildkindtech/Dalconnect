import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// Rate limiting (in-memory, simple IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REGISTRATIONS = 5;

// Telegram notification helper
async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || '7966628100'; // Hub-Projects
  
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN not configured, skipping notification');
    return;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: message, 
        parse_mode: 'HTML' 
      })
    });
    
    if (!response.ok) {
      console.error('Telegram notification failed:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_REGISTRATIONS) {
    return false;
  }
  
  record.count++;
  return true;
}

function sanitizeInput(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone: string): boolean {
  const re = /^[\d\s\-\+\(\)]{10,20}$/;
  return re.test(phone);
}

function validateOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowedOrigins = [
    'https://dalconnect.vercel.app',
    'https://dalconnect.com',
    'http://localhost:5000',
    'http://localhost:5173'
  ];
  return allowedOrigins.some(allowed => origin.includes(allowed));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: "DATABASE_URL not set" });
      }

      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      // Parse query parameters
      const { id, category, city, search, featured, page, limit } = req.query;

      // Single business by ID
      if (id && typeof id === 'string') {
        const r = await pool.query('SELECT * FROM businesses WHERE id = $1 LIMIT 1', [id]);
        await pool.end();
        if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        return res.json(r.rows[0]);
      }
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const offset = (pageNum - 1) * limitNum;

      let query = 'SELECT * FROM businesses WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      if (city) {
        paramCount++;
        query += ` AND city = $${paramCount}`;
        params.push(city);
      }

      if (search) {
        paramCount++;
        query += ` AND (name_en ILIKE $${paramCount} OR name_ko ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (featured === 'true') {
        query += ` AND featured = true`;
      }

      // Count total for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Add ordering and pagination
      query += ' ORDER BY (CASE WHEN name_ko IS NOT NULL AND name_ko != \'\' THEN 0 WHEN name_en ~ \'[가-힣]\' THEN 0 ELSE 1 END), rating DESC NULLS LAST, review_count DESC NULLS LAST';
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limitNum);
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await pool.query(query, params);
      
      // Log search query if present
      if (search) {
        const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
        const ipAddress = Array.isArray(clientIp) ? clientIp[0] : clientIp?.toString().split(',')[0] || 'unknown';
        
        try {
          await pool.query(
            'INSERT INTO search_logs (query, results_count, ip_address) VALUES ($1, $2, $3)',
            [search, total, ipAddress]
          );
        } catch (logError) {
          console.error('Failed to log search:', logError);
          // Don't fail the request if logging fails
        }
      }
      
      await pool.end();
      
      return res.status(200).json({
        businesses: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        no_results: total === 0 && !!search
      });
    } catch (error: any) {
      console.error('businesses GET error:', error);
      return res.status(500).json({
        error: "서버 오류가 발생했습니다"
      });
    }
  }

  if (req.method === 'POST') {
    try {
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: "DATABASE_URL not set" });
      }

      const pg = await import('pg');
      const pool = new pg.default.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });

      const { action } = req.body;

      // Get client IP for rate limiting
      const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
      const ipAddress = Array.isArray(clientIp) ? clientIp[0] : clientIp?.toString().split(',')[0] || 'unknown';

      // Origin check (CSRF protection)
      if (!validateOrigin(req)) {
        await pool.end();
        return res.status(403).json({ error: "Invalid origin" });
      }

      // Rate limiting
      if (!checkRateLimit(ipAddress)) {
        await pool.end();
        return res.status(429).json({ error: "Too many registration attempts. Please try again later." });
      }

      // Handle business registration
      if (action === 'register') {
        const {
          name_ko,
          name_en,
          category,
          address,
          city,
          phone,
          email,
          website,
          description,
          owner_name,
          owner_email,
          owner_phone,
          password
        } = req.body;

        // Validation
        if (!name_en || name_en.length > 200) {
          await pool.end();
          return res.status(400).json({ error: "Invalid business name (English)" });
        }
        if (name_ko && name_ko.length > 200) {
          await pool.end();
          return res.status(400).json({ error: "Invalid business name (Korean)" });
        }
        if (!category || category.length > 50) {
          await pool.end();
          return res.status(400).json({ error: "Invalid category" });
        }
        if (!address || address.length > 300) {
          await pool.end();
          return res.status(400).json({ error: "Invalid address" });
        }
        if (!owner_name || owner_name.length > 100) {
          await pool.end();
          return res.status(400).json({ error: "Invalid owner name" });
        }
        if (!owner_email || !validateEmail(owner_email) || owner_email.length > 200) {
          await pool.end();
          return res.status(400).json({ error: "Invalid owner email" });
        }
        if (!owner_phone || !validatePhone(owner_phone) || owner_phone.length > 20) {
          await pool.end();
          return res.status(400).json({ error: "Invalid owner phone" });
        }
        if (!password || password.length < 8 || password.length > 100) {
          await pool.end();
          return res.status(400).json({ error: "Password must be 8-100 characters" });
        }

        // Check if email already exists
        const emailCheck = await pool.query(
          'SELECT id FROM business_claims WHERE owner_email = $1',
          [owner_email]
        );
        if (emailCheck.rowCount && emailCheck.rowCount > 0) {
          await pool.end();
          return res.status(400).json({ error: "Email already registered" });
        }

        // Sanitize inputs
        const sanitized = {
          name_ko: name_ko ? sanitizeInput(name_ko) : null,
          name_en: sanitizeInput(name_en),
          category: sanitizeInput(category),
          address: sanitizeInput(address),
          city: city ? sanitizeInput(city) : null,
          phone: phone ? sanitizeInput(phone) : null,
          email: email ? sanitizeInput(email) : null,
          website: website ? sanitizeInput(website) : null,
          description: description ? sanitizeInput(description) : null,
          owner_name: sanitizeInput(owner_name),
          owner_email: sanitizeInput(owner_email),
          owner_phone: sanitizeInput(owner_phone),
        };

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Insert into business_submissions
        const submissionResult = await pool.query(
          `INSERT INTO business_submissions 
           (name_ko, name_en, category, address, city, phone, email, website, description, 
            owner_name, owner_email, owner_phone, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending') 
           RETURNING id`,
          [
            sanitized.name_ko,
            sanitized.name_en,
            sanitized.category,
            sanitized.address,
            sanitized.city,
            sanitized.phone,
            sanitized.email,
            sanitized.website,
            sanitized.description,
            sanitized.owner_name,
            sanitized.owner_email,
            sanitized.owner_phone,
          ]
        );

        // Insert into business_claims (will be linked to business after approval)
        await pool.query(
          `INSERT INTO business_claims 
           (owner_name, owner_email, owner_phone, password_hash, verified) 
           VALUES ($1, $2, $3, $4, false)`,
          [sanitized.owner_name, sanitized.owner_email, sanitized.owner_phone, passwordHash]
        );

        await pool.end();
        
        // Send Telegram notification
        await sendTelegramAlert(
          `📝 <b>새 업체 등록 요청</b>\n\n` +
          `업체: ${sanitized.name_ko || sanitized.name_en}\n` +
          `대표: ${sanitized.owner_name}\n` +
          `이메일: ${sanitized.owner_email}\n` +
          `전화: ${sanitized.owner_phone}\n` +
          `카테고리: ${sanitized.category}\n` +
          `주소: ${sanitized.address}\n\n` +
          `승인하려면 DB에서 status='approved'로 변경`
        );
        
        return res.status(201).json({
          success: true,
          message: "Registration submitted successfully. We'll review and approve within 24 hours.",
          submissionId: submissionResult.rows[0].id
        });
      }

      // Handle business claim
      if (action === 'claim') {
        const { business_id, owner_name, owner_email, owner_phone, password } = req.body;

        // Validation
        if (!business_id) {
          await pool.end();
          return res.status(400).json({ error: "Business ID required" });
        }
        if (!owner_name || owner_name.length > 100) {
          await pool.end();
          return res.status(400).json({ error: "Invalid owner name" });
        }
        if (!owner_email || !validateEmail(owner_email) || owner_email.length > 200) {
          await pool.end();
          return res.status(400).json({ error: "Invalid email" });
        }
        if (!owner_phone || !validatePhone(owner_phone) || owner_phone.length > 20) {
          await pool.end();
          return res.status(400).json({ error: "Invalid phone number" });
        }
        if (!password || password.length < 8 || password.length > 100) {
          await pool.end();
          return res.status(400).json({ error: "Password must be 8-100 characters" });
        }

        // Check if business exists
        const businessCheck = await pool.query(
          'SELECT id, claimed FROM businesses WHERE id = $1',
          [business_id]
        );
        if (!businessCheck.rowCount || businessCheck.rowCount === 0) {
          await pool.end();
          return res.status(404).json({ error: "Business not found" });
        }
        if (businessCheck.rows[0].claimed) {
          await pool.end();
          return res.status(400).json({ error: "This business has already been claimed" });
        }

        // Check if email already exists
        const emailCheck = await pool.query(
          'SELECT id FROM business_claims WHERE owner_email = $1',
          [owner_email]
        );
        if (emailCheck.rowCount && emailCheck.rowCount > 0) {
          await pool.end();
          return res.status(400).json({ error: "Email already registered" });
        }

        // Check if business already has a claim
        const claimCheck = await pool.query(
          'SELECT id FROM business_claims WHERE business_id = $1',
          [business_id]
        );
        if (claimCheck.rowCount && claimCheck.rowCount > 0) {
          await pool.end();
          return res.status(400).json({ error: "This business already has a pending claim" });
        }

        // Sanitize inputs
        const sanitized = {
          owner_name: sanitizeInput(owner_name),
          owner_email: sanitizeInput(owner_email),
          owner_phone: sanitizeInput(owner_phone),
        };

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Insert claim
        await pool.query(
          `INSERT INTO business_claims 
           (business_id, owner_name, owner_email, owner_phone, password_hash, verified) 
           VALUES ($1, $2, $3, $4, $5, false)`,
          [business_id, sanitized.owner_name, sanitized.owner_email, sanitized.owner_phone, passwordHash]
        );

        // Get business name for notification
        const businessInfo = await pool.query(
          'SELECT name_ko, name_en FROM businesses WHERE id = $1',
          [business_id]
        );
        const businessName = businessInfo.rows[0]?.name_ko || businessInfo.rows[0]?.name_en || 'Unknown Business';
        
        await pool.end();
        
        // Send Telegram notification
        await sendTelegramAlert(
          `🏢 <b>업체 클레임 요청</b>\n\n` +
          `업체: ${businessName}\n` +
          `업체 ID: ${business_id}\n` +
          `대표: ${sanitized.owner_name}\n` +
          `이메일: ${sanitized.owner_email}\n` +
          `전화: ${sanitized.owner_phone}\n\n` +
          `승인하려면 DB에서 verified=true로 변경`
        );
        
        return res.status(201).json({
          success: true,
          message: "Claim submitted successfully. We'll review and approve your request."
        });
      }

      await pool.end();
      return res.status(400).json({ error: "Invalid action" });

    } catch (error: any) {
      console.error('businesses POST error:', error);
      return res.status(500).json({
        error: "서버 오류가 발생했습니다"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
