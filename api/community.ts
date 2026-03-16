import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit as dbCheckRateLimit, getClientIP, hashIP } from './_rateLimit';

function getPool() {
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
}

function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','https://dalkonnect.com','https://www.dalkonnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

function sanitizeContent(content: string): string {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { action } = req.query;
  const clientIP = getClientIP(req);
  const ipHash = hashIP(clientIP);
  const pool = getPool();

  try {
    switch (action) {
      case 'posts':
        return await handleGetPosts(pool, req, res);
      case 'post':
        return await handleGetPost(pool, req, res);
      case 'create':
        return await handleCreatePost(pool, req, res, ipHash);
      case 'comment':
        return await handleCreateComment(pool, req, res, ipHash);
      case 'like':
        return await handleLike(pool, req, res);
      case 'delete':
        return await handleDelete(pool, req, res);
      case 'trending':
        return await handleGetTrending(res);
      case 'search':
        return await handleSearch(pool, req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Community API error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await pool.end().catch(() => {});
  }
}

// ─── GET POSTS ────────────────────────────────────────────────────
async function handleGetPosts(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { category, city, page = '1', limit = '20', sort = 'latest' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const targetCity = (Array.isArray(city) ? city[0] : city as string) || 'dallas';

  const params: any[] = [targetCity, Number(limit), offset];
  let where = 'WHERE city = $1';

  if (category && category !== 'all') {
    where += ` AND category = $${params.length + 1}`;
    params.push(category);
  }

  let orderBy = 'ORDER BY is_pinned DESC, created_at DESC';
  if (sort === 'popular') orderBy = 'ORDER BY likes DESC, views DESC';
  else if (sort === 'comments') orderBy = 'ORDER BY comment_count DESC';

  const { rows: posts } = await pool.query(
    `SELECT id, title, nickname, category, views, likes, comment_count, is_pinned, created_at
     FROM community_posts ${where} ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({ success: true, data: posts });
}

// ─── GET SINGLE POST ──────────────────────────────────────────────
async function handleGetPost(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Post ID required' });

  const { rows } = await pool.query('SELECT * FROM community_posts WHERE id = $1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Post not found' });

  // Increment views
  await pool.query('UPDATE community_posts SET views = views + 1 WHERE id = $1', [id]).catch(() => {});

  // Get comments
  const { rows: comments } = await pool.query(
    'SELECT * FROM community_comments WHERE post_id = $1 ORDER BY created_at ASC', [id]
  );

  // Tree structure
  const map = new Map<string, any>();
  const top: any[] = [];
  comments.forEach(c => { c.replies = []; map.set(c.id, c); });
  comments.forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id).replies.push(c);
    else top.push(c);
  });

  return res.json({ post: { ...rows[0], views: rows[0].views + 1 }, comments: top });
}

// ─── CREATE POST ─────────────────────────────────────────────────
async function handleCreatePost(pool: pg.Pool, req: VercelRequest, res: VercelResponse, ipHash: string) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = await dbCheckRateLimit(req, 'community_post', 5, 3600);
  if (!rl.allowed) return res.status(429).json({ error: rl.message });

  const { nickname, password, title, content, category = '자유게시판', tags = [], city = 'dallas' } = req.body;
  if (!nickname || !password || !title || !content) return res.status(400).json({ error: 'Required fields missing' });

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO community_posts (id, nickname, password_hash, title, content, category, tags, city, ip_hash, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
    [nickname.slice(0,50), passwordHash, title.slice(0,200), sanitizeContent(content),
     category, JSON.stringify(tags), city, ipHash]
  );
  return res.json({ post: rows[0] });
}

// ─── CREATE COMMENT ───────────────────────────────────────────────
async function handleCreateComment(pool: pg.Pool, req: VercelRequest, res: VercelResponse, ipHash: string) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rlc = await dbCheckRateLimit(req, 'community_comment', 20, 3600);
  if (!rlc.allowed) return res.status(429).json({ error: rlc.message });

  const { post_id, parent_id, nickname, password, content } = req.body;
  if (!post_id || !nickname || !password || !content) return res.status(400).json({ error: 'Required fields missing' });

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO community_comments (id, post_id, parent_id, nickname, password_hash, content, ip_hash, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
    [post_id, parent_id || null, nickname.slice(0,50), passwordHash, sanitizeContent(content), ipHash]
  );

  await pool.query('UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = $1', [post_id]).catch(() => {});
  return res.json({ comment: rows[0] });
}

// ─── LIKE ─────────────────────────────────────────────────────────
async function handleLike(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { post_id, comment_id } = req.body;

  if (post_id) {
    await pool.query('UPDATE community_posts SET likes = likes + 1 WHERE id = $1', [post_id]);
  } else if (comment_id) {
    await pool.query('UPDATE community_comments SET likes = likes + 1 WHERE id = $1', [comment_id]);
  } else {
    return res.status(400).json({ error: 'post_id or comment_id required' });
  }
  return res.json({ success: true });
}

// ─── DELETE ───────────────────────────────────────────────────────
async function handleDelete(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id, password, type } = req.body;
  if (!id || !password || !type) return res.status(400).json({ error: 'Required fields missing' });

  if (type === 'post') {
    const { rows } = await pool.query('SELECT password_hash FROM community_posts WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    if (!await bcrypt.compare(password, rows[0].password_hash)) return res.status(403).json({ error: 'Invalid password' });
    await pool.query('DELETE FROM community_posts WHERE id = $1', [id]);
  } else if (type === 'comment') {
    const { rows } = await pool.query('SELECT password_hash, post_id FROM community_comments WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Comment not found' });
    if (!await bcrypt.compare(password, rows[0].password_hash)) return res.status(403).json({ error: 'Invalid password' });
    await pool.query('DELETE FROM community_comments WHERE id = $1', [id]);
    await pool.query('UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1', [rows[0].post_id]).catch(() => {});
  }
  return res.json({ success: true });
}

// ─── TRENDING ────────────────────────────────────────────────────
async function handleGetTrending(res: VercelResponse) {
  return res.json({
    trending_topics: [
      { topic: '맛집 추천', count: 15, sentiment: 'positive' },
      { topic: '육아', count: 12, sentiment: 'neutral' },
      { topic: '운전면허', count: 8, sentiment: 'neutral' },
    ],
    popular_keywords: [
      { keyword: '달라스', count: 25 },
      { keyword: '한식당', count: 18 },
      { keyword: '학교', count: 15 },
    ],
  });
}

// ─── SEARCH ──────────────────────────────────────────────────────
async function handleSearch(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { q, category, city, page = '1', limit = '20' } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query required' });

  const offset = (Number(page) - 1) * Number(limit);
  const targetCity = (Array.isArray(city) ? city[0] : city as string) || 'dallas';
  const params: any[] = [`%${q}%`, `%${q}%`, targetCity, Number(limit), offset];

  let where = 'WHERE (title ILIKE $1 OR content ILIKE $2) AND city = $3';
  if (category && category !== 'all') {
    where += ` AND category = $${params.length + 1}`;
    params.push(category);
  }

  const { rows } = await pool.query(
    `SELECT id, title, nickname, category, views, likes, comment_count, created_at
     FROM community_posts ${where}
     ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({ posts: rows, total: rows.length });
}
