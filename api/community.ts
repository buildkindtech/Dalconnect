import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { communityPosts, communityComments, communityTrends } from '../shared/schema';
import { eq, desc, sql, and, like, or, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit as dbCheckRateLimit, getClientIP, hashIP } from './_rateLimit';
function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin) || '';
  const allowed = ['https://dalconnect.vercel.app','https://dalconnect.buildkind.tech','https://dalconnect.com','https://www.dalconnect.com','https://dalkonnect.com','https://www.dalkonnect.com','http://localhost:5000','http://localhost:5173'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// Rate limiting storage (in-memory for simplicity)
// Rate limiting — DB 기반으로 교체 (인메모리는 Vercel 서버리스에서 무효)

// Helper function to sanitize HTML content
function sanitizeContent(content: string): string {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// Helper function to extract keywords from content
function extractKeywords(content: string): string[] {
  const text = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const words = text.match(/[가-힣a-z]+/g) || [];
  const stopWords = new Set(['의', '가', '이', '은', '는', '을', '를', '에', '와', '과', '으로', '로', 'and', 'the', 'to', 'of', 'in', 'for', 'is', 'it', 'on', 'with']);
  return words.filter(word => word.length > 1 && !stopWords.has(word)).slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const db = getDb();
  const { action } = req.query;
  const clientIP = getClientIP(req);
  const ipHash = hashIP(clientIP);

  try {
    switch (action) {
      case 'posts':
        return await handleGetPosts(db, req, res);
      
      case 'post':
        return await handleGetPost(db, req, res);
      
      case 'create':
        return await handleCreatePost(db, req, res, ipHash);
      
      case 'comment':
        return await handleCreateComment(db, req, res, ipHash);
      
      case 'like':
        return await handleLike(db, req, res);
      
      case 'delete':
        return await handleDelete(db, req, res);
      
      case 'trending':
        return await handleGetTrending(db, req, res);
      
      case 'search':
        return await handleSearch(db, req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Community API error:', error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
}

// Get posts list
async function handleGetPosts(db: any, req: VercelRequest, res: VercelResponse) {
  const { category, city, page = 1, limit = 20, sort = 'latest' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = db.select({
    id: communityPosts.id,
    title: communityPosts.title,
    nickname: communityPosts.nickname,
    category: communityPosts.category,
    views: communityPosts.views,
    likes: communityPosts.likes,
    comment_count: communityPosts.comment_count,
    is_pinned: communityPosts.is_pinned,
    created_at: communityPosts.created_at,
  }).from(communityPosts);

  // Default to dallas if no city specified (backward compatibility)
  const targetCity: string = (Array.isArray(city) ? city[0] : String(city)) || 'dallas';
  const filters = [eq(communityPosts.city, targetCity)];

  if (category && category !== 'all') {
    filters.push(eq(communityPosts.category, category as string));
  }

  if (filters.length > 0) {
    query = query.where(and(...filters));
  }

  // Sorting
  if (sort === 'popular') {
    query = query.orderBy(desc(communityPosts.likes), desc(communityPosts.views));
  } else if (sort === 'comments') {
    query = query.orderBy(desc(communityPosts.comment_count));
  } else {
    query = query.orderBy(desc(communityPosts.is_pinned), desc(communityPosts.created_at));
  }

  const posts = await query.limit(Number(limit)).offset(offset);
  
  return res.json({ posts });
}

// Get single post with comments
async function handleGetPost(db: any, req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Post ID required' });
  }

  // Get post and increment view count
  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id as string));
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Increment view count
  await db.update(communityPosts)
    .set({ views: sql`${communityPosts.views} + 1` })
    .where(eq(communityPosts.id, id as string));

  // Get comments (with nested structure)
  const comments = await db.select().from(communityComments)
    .where(eq(communityComments.post_id, id as string))
    .orderBy(communityComments.created_at);

  // Organize comments into tree structure
  const commentMap = new Map();
  const topLevelComments: any[] = [];

  comments.forEach((comment: any) => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  comments.forEach((comment: any) => {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      topLevelComments.push(comment);
    }
  });

  return res.json({ 
    post: { ...post, views: post.views + 1 }, 
    comments: topLevelComments 
  });
}

// Create new post
async function handleCreatePost(db: any, req: VercelRequest, res: VercelResponse, ipHash: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // DB 기반 rate limit — 시간당 5회
  const rl = await dbCheckRateLimit(req, 'community_post', 5, 3600);
  if (!rl.allowed) return res.status(429).json({ error: rl.message || 'Rate limit exceeded.' });

  const { nickname, password, title, content, category = '자유게시판', tags = [] } = req.body;

  if (!nickname || !password || !title || !content) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const sanitizedContent = sanitizeContent(content);

  const [newPost] = await db.insert(communityPosts).values({
    nickname: nickname.substring(0, 50),
    password_hash: passwordHash,
    title: title.substring(0, 200),
    content: sanitizedContent,
    category,
    tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    ip_hash: ipHash,
  }).returning();

  return res.json({ post: newPost });
}

// Create comment
async function handleCreateComment(db: any, req: VercelRequest, res: VercelResponse, ipHash: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // DB 기반 rate limit — 시간당 20회
  const rlc = await dbCheckRateLimit(req, 'community_comment', 20, 3600);
  if (!rlc.allowed) return res.status(429).json({ error: rlc.message || 'Rate limit exceeded.' });

  const { post_id, parent_id, nickname, password, content } = req.body;

  if (!post_id || !nickname || !password || !content) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const sanitizedContent = sanitizeContent(content);

  const [newComment] = await db.insert(communityComments).values({
    post_id,
    parent_id: parent_id || null,
    nickname: nickname.substring(0, 50),
    password_hash: passwordHash,
    content: sanitizedContent,
    ip_hash: ipHash,
  }).returning();

  // Update comment count
  await db.update(communityPosts)
    .set({ comment_count: sql`${communityPosts.comment_count} + 1` })
    .where(eq(communityPosts.id, post_id));

  return res.json({ comment: newComment });
}

// Handle likes
async function handleLike(db: any, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { post_id, comment_id } = req.body;

  if (post_id) {
    await db.update(communityPosts)
      .set({ likes: sql`${communityPosts.likes} + 1` })
      .where(eq(communityPosts.id, post_id));
  } else if (comment_id) {
    await db.update(communityComments)
      .set({ likes: sql`${communityComments.likes} + 1` })
      .where(eq(communityComments.id, comment_id));
  } else {
    return res.status(400).json({ error: 'post_id or comment_id required' });
  }

  return res.json({ success: true });
}

// Handle deletion
async function handleDelete(db: any, req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, password, type } = req.body;

  if (!id || !password || !type) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  if (type === 'post') {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isValid = await bcrypt.compare(password, post.password_hash);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    await db.delete(communityPosts).where(eq(communityPosts.id, id));
  } else if (type === 'comment') {
    const [comment] = await db.select().from(communityComments).where(eq(communityComments.id, id));
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isValid = await bcrypt.compare(password, comment.password_hash);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    await db.delete(communityComments).where(eq(communityComments.id, id));
    
    // Update comment count
    await db.update(communityPosts)
      .set({ comment_count: sql`${communityPosts.comment_count} - 1` })
      .where(eq(communityPosts.id, comment.post_id));
  }

  return res.json({ success: true });
}

// Get trending topics and keywords
async function handleGetTrending(db: any, req: VercelRequest, res: VercelResponse) {
  // For now, return some mock trending data
  // In the future, this would be populated by a background job
  const mockTrending = {
    trending_topics: [
      { topic: '맛집 추천', count: 15, sentiment: 'positive' },
      { topic: '육아', count: 12, sentiment: 'neutral' },
      { topic: '운전면허', count: 8, sentiment: 'neutral' },
    ],
    popular_keywords: [
      { keyword: '달라스', count: 25 },
      { keyword: '한식당', count: 18 },
      { keyword: '학교', count: 15 },
      { keyword: '병원', count: 12 },
    ],
    recommended_content: [],
  };

  return res.json(mockTrending);
}

// Search posts
async function handleSearch(db: any, req: VercelRequest, res: VercelResponse) {
  const { q: query, category, city, page = 1, limit = 20 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  let searchQuery = db.select({
    id: communityPosts.id,
    title: communityPosts.title,
    nickname: communityPosts.nickname,
    category: communityPosts.category,
    views: communityPosts.views,
    likes: communityPosts.likes,
    comment_count: communityPosts.comment_count,
    created_at: communityPosts.created_at,
  }).from(communityPosts);

  // Search in title and content
  const searchCondition = or(
    ilike(communityPosts.title, `%${query}%`),
    ilike(communityPosts.content, `%${query}%`)
  );

  // Default to dallas if no city specified (backward compatibility)
  const targetCity2: string = (Array.isArray(city) ? city[0] : String(city)) || 'dallas';
  const filters = [searchCondition, eq(communityPosts.city, targetCity2)];

  if (category && category !== 'all') {
    filters.push(eq(communityPosts.category, category as string));
  }

  searchQuery = searchQuery.where(and(...filters));

  const posts = await searchQuery
    .orderBy(desc(communityPosts.created_at))
    .limit(Number(limit))
    .offset(offset);

  return res.json({ posts });
}