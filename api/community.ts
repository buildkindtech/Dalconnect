import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import crypto from 'crypto';

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

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'dalkonnect_salt').digest('hex').substring(0, 32);
}

function getClientIP(req: any): string {
  return req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '0.0.0.0';
}

function sanitizeContent(content: string): string {
  return content.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/javascript:/gi, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const { action } = req.query;
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      if (action === 'posts' || !action) return await handleGetPosts(pool, req, res);
      if (action === 'post') return await handleGetPost(pool, req, res);
      if (action === 'trending') return res.json({ trending_topics: [], popular_keywords: [] });
      if (action === 'search') return await handleSearch(pool, req, res);
    }

    if (req.method === 'POST') {
      const ipHash = hashIP(getClientIP(req));
      if (action === 'create') return await handleCreatePost(pool, req, res, ipHash);
      if (action === 'comment') return await handleCreateComment(pool, req, res, ipHash);
      if (action === 'like') return await handleLike(pool, req, res);
      if (action === 'delete') return await handleDelete(pool, req, res);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    console.error('Community API error:', error?.message);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await pool.end().catch(() => {});
  }
}

async function handleGetPosts(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { category, city, page = '1', limit = '20', sort = 'latest' } = req.query;
  const pg_limit = Math.min(Number(limit) || 20, 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * pg_limit;
  const targetCity = (Array.isArray(city) ? city[0] : city as string) || 'dallas';

  let where = 'WHERE city = $1';
  const params: any[] = [targetCity];

  if (category && category !== 'all') {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }

  let orderBy = 'ORDER BY is_pinned DESC, created_at DESC';
  if (sort === 'popular') {
    // 최신성 + 인기 혼합: 7일 이내 글은 likes*3 보너스, 30일 이내는 likes*1.5
    orderBy = `ORDER BY is_pinned DESC,
      (likes * CASE
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 3
        WHEN created_at > NOW() - INTERVAL '30 days' THEN 1.5
        ELSE 1
      END + views * 0.1) DESC,
      created_at DESC`;
  }
  if (sort === 'comments') orderBy = 'ORDER BY comment_count DESC';

  params.push(pg_limit, offset);
  const { rows } = await pool.query(
    `SELECT id, title, nickname, category, views, likes, comment_count, is_pinned, created_at
     FROM community_posts ${where} ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({ success: true, data: rows });
}

async function handleGetPost(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Post ID required' });

  const { rows } = await pool.query('SELECT * FROM community_posts WHERE id = $1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Post not found' });

  await pool.query('UPDATE community_posts SET views = views + 1 WHERE id = $1', [id]).catch(() => {});

  const { rows: comments } = await pool.query(
    'SELECT * FROM community_comments WHERE post_id = $1 ORDER BY created_at ASC', [id]
  );

  const map = new Map<string, any>();
  const top: any[] = [];
  comments.forEach((c: any) => { c.replies = []; map.set(c.id, c); });
  comments.forEach((c: any) => {
    if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id).replies.push(c);
    else top.push(c);
  });

  return res.json({ post: { ...rows[0], views: rows[0].views + 1 }, comments: top });
}

async function handleCreatePost(pool: pg.Pool, req: VercelRequest, res: VercelResponse, ipHash: string) {
  const { nickname, password, title, content, category = '자유게시판', tags = [], city = 'dallas' } = req.body || {};
  if (!nickname || !password || !title || !content) return res.status(400).json({ error: 'Required fields missing' });

  const pwHash = crypto.createHash('sha256').update(password).digest('hex');
  const { rows } = await pool.query(
    `INSERT INTO community_posts (id, nickname, password_hash, title, content, category, tags, city, ip_hash, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
    [nickname.slice(0,50), pwHash, title.slice(0,200), sanitizeContent(content), category, JSON.stringify(tags), city, ipHash]
  );
  return res.json({ post: rows[0] });
}

async function handleCreateComment(pool: pg.Pool, req: VercelRequest, res: VercelResponse, ipHash: string) {
  const { post_id, parent_id, nickname, password, content } = req.body || {};
  if (!post_id || !nickname || !password || !content) return res.status(400).json({ error: 'Required fields missing' });

  const pwHash = crypto.createHash('sha256').update(password).digest('hex');
  const { rows } = await pool.query(
    `INSERT INTO community_comments (id, post_id, parent_id, nickname, password_hash, content, ip_hash, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
    [post_id, parent_id || null, nickname.slice(0,50), pwHash, sanitizeContent(content), ipHash]
  );
  await pool.query('UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = $1', [post_id]).catch(() => {});
  return res.json({ comment: rows[0] });
}

async function handleLike(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { post_id, comment_id } = req.body || {};
  if (post_id) await pool.query('UPDATE community_posts SET likes = likes + 1 WHERE id = $1', [post_id]);
  else if (comment_id) await pool.query('UPDATE community_comments SET likes = likes + 1 WHERE id = $1', [comment_id]);
  else return res.status(400).json({ error: 'post_id or comment_id required' });
  return res.json({ success: true });
}

async function handleDelete(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { id, password, type } = req.body || {};
  if (!id || !password || !type) return res.status(400).json({ error: 'Required fields missing' });

  const pwHash = crypto.createHash('sha256').update(password).digest('hex');

  if (type === 'post') {
    const { rows } = await pool.query('SELECT password_hash, id FROM community_posts WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    if (rows[0].password_hash !== pwHash) return res.status(403).json({ error: 'Invalid password' });
    await pool.query('DELETE FROM community_posts WHERE id = $1', [id]);
  } else if (type === 'comment') {
    const { rows } = await pool.query('SELECT password_hash, post_id FROM community_comments WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    if (rows[0].password_hash !== pwHash) return res.status(403).json({ error: 'Invalid password' });
    await pool.query('DELETE FROM community_comments WHERE id = $1', [id]);
    await pool.query('UPDATE community_posts SET comment_count = GREATEST(comment_count-1,0) WHERE id = $1', [rows[0].post_id]).catch(() => {});
  }
  return res.json({ success: true });
}

async function handleSearch(pool: pg.Pool, req: VercelRequest, res: VercelResponse) {
  const { q, category, city, page = '1', limit = '20' } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query required' });

  const pg_limit = Math.min(Number(limit) || 20, 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * pg_limit;
  const targetCity = (Array.isArray(city) ? city[0] : city as string) || 'dallas';

  let where = 'WHERE (title ILIKE $1 OR content ILIKE $2) AND city = $3';
  const params: any[] = [`%${q}%`, `%${q}%`, targetCity];

  if (category && category !== 'all') {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }

  params.push(pg_limit, offset);
  const { rows } = await pool.query(
    `SELECT id, title, nickname, category, views, likes, comment_count, created_at
     FROM community_posts ${where} ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return res.json({ posts: rows });
}
