#!/usr/bin/env node
/**
 * DalConnect 소셜 미디어 자동 포스팅 스크립트
 * 
 * 매일 뉴스/딜/블로그에서 콘텐츠 선별 → Instagram + Facebook 자동 게시
 * 
 * Instagram: Graph API (Business Account)
 * Facebook: Graph API (Page)
 * 
 * 환경변수 필요:
 * - FACEBOOK_PAGE_ID
 * - FACEBOOK_PAGE_ACCESS_TOKEN (long-lived)
 * - INSTAGRAM_BUSINESS_ACCOUNT_ID
 * 
 * 사용법:
 *   node scripts/social-auto-post.cjs           # 자동 선별 + 포스팅
 *   node scripts/social-auto-post.cjs --preview  # 미리보기만
 *   node scripts/social-auto-post.cjs --type news  # 뉴스만
 */

const pg = require('pg');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const SITE_URL = 'https://dalconnect.buildkind.tech';

const isPreview = process.argv.includes('--preview');
const typeFilter = process.argv.find(a => a.startsWith('--type='))?.split('=')[1] 
  || (process.argv.includes('--type') ? process.argv[process.argv.indexOf('--type') + 1] : null);

// ==================== 콘텐츠 선별 ====================

async function selectContent() {
  const posts = [];
  
  // 1. 오늘의 로컬 뉴스 (최대 2개)
  if (!typeFilter || typeFilter === 'news') {
    const localNews = await pool.query(`
      SELECT id, title, content, category, thumbnail_url, url 
      FROM news 
      WHERE category = '로컬뉴스' 
        AND published_date > NOW() - INTERVAL '24 hours'
        AND thumbnail_url IS NOT NULL AND thumbnail_url != ''
      ORDER BY published_date DESC 
      LIMIT 2
    `);
    
    for (const news of localNews.rows) {
      posts.push({
        type: 'news',
        title: news.title,
        content: news.content,
        image: news.thumbnail_url,
        link: `${SITE_URL}/news`,
        category: news.category,
        hashtags: '#달커넥트 #DFW한인 #달라스뉴스 #DalConnect #DFWKorean #DallasNews',
      });
    }
    
    // 한국뉴스 (1개)
    const krNews = await pool.query(`
      SELECT id, title, content, category, thumbnail_url, url 
      FROM news 
      WHERE category IN ('한국뉴스', 'K-POP')
        AND published_date > NOW() - INTERVAL '24 hours'
        AND thumbnail_url IS NOT NULL AND thumbnail_url != ''
      ORDER BY published_date DESC 
      LIMIT 1
    `);
    
    for (const news of krNews.rows) {
      posts.push({
        type: 'news',
        title: news.title,
        content: news.content,
        image: news.thumbnail_url,
        link: `${SITE_URL}/news`,
        category: news.category,
        hashtags: '#달커넥트 #한국뉴스 #KPOP #DalConnect #KoreanNews',
      });
    }
  }
  
  // 2. 핫딜 (최대 1개)
  if (!typeFilter || typeFilter === 'deal') {
    const deals = await pool.query(`
      SELECT id, title, description, store, discount, deal_url, image_url
      FROM deals 
      WHERE (expires_at IS NULL OR expires_at > NOW())
        AND image_url IS NOT NULL AND image_url != ''
      ORDER BY likes DESC, created_at DESC 
      LIMIT 1
    `);
    
    for (const deal of deals.rows) {
      posts.push({
        type: 'deal',
        title: `🔥 ${deal.title}`,
        content: `${deal.store} — ${deal.discount || ''}\n${deal.description || ''}`,
        image: deal.image_url,
        link: deal.deal_url || `${SITE_URL}/deals`,
        hashtags: '#달커넥트 #DFW할인 #달라스딜 #DalConnect #DFWDeals #KoreanDeals',
      });
    }
  }
  
  // 3. 블로그 (최대 1개 — 주 2-3회)
  if (!typeFilter || typeFilter === 'blog') {
    const blog = await pool.query(`
      SELECT id, title, content, cover_image, cover_url, slug
      FROM blogs
      WHERE (cover_image IS NOT NULL AND cover_image != '') OR (cover_url IS NOT NULL AND cover_url != '')
      ORDER BY RANDOM()
      LIMIT 1
    `);
    
    for (const b of blog.rows) {
      posts.push({
        type: 'blog',
        title: `📝 ${b.title}`,
        content: (b.content || '').substring(0, 200) + '...',
        image: b.cover_url || b.cover_image,
        link: `${SITE_URL}/blog/${b.slug || b.id}`,
        hashtags: '#달커넥트 #DFW한인생활 #달라스정보 #DalConnect #DFWKoreanLife',
      });
    }
  }
  
  return posts;
}

// ==================== Facebook 포스팅 ====================

async function postToFacebook(post) {
  if (!FACEBOOK_PAGE_ID || !FB_TOKEN) {
    console.log('  ⚠️ Facebook 토큰 미설정 — 스킵');
    return false;
  }
  
  try {
    const message = `${post.title}\n\n${post.content.substring(0, 300)}\n\n🔗 ${post.link}\n\n${post.hashtags}`;
    
    const body = { message, access_token: FB_TOKEN };
    if (post.image) body.link = post.link;
    
    const res = await fetch(`https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    if (data.id) {
      console.log(`  ✅ Facebook: ${data.id}`);
      return true;
    } else {
      console.log(`  ❌ Facebook: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (e) {
    console.log(`  ❌ Facebook error: ${e.message}`);
    return false;
  }
}

// ==================== Instagram 포스팅 ====================

async function postToInstagram(post) {
  if (!IG_ACCOUNT_ID || !FB_TOKEN) {
    console.log('  ⚠️ Instagram 토큰 미설정 — 스킵');
    return false;
  }
  
  if (!post.image) {
    console.log('  ⚠️ Instagram: 이미지 없음 — 스킵');
    return false;
  }
  
  try {
    const caption = `${post.title}\n\n${post.content.substring(0, 200)}\n\n🔗 Link in bio\n\n${post.hashtags}`;
    
    // Step 1: Create media container
    const createRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ACCOUNT_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: post.image,
        caption,
        access_token: FB_TOKEN,
      }),
    });
    
    const createData = await createRes.json();
    if (!createData.id) {
      console.log(`  ❌ Instagram create: ${JSON.stringify(createData)}`);
      return false;
    }
    
    // Step 2: Publish
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ACCOUNT_ID}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: FB_TOKEN,
      }),
    });
    
    const publishData = await publishRes.json();
    if (publishData.id) {
      console.log(`  ✅ Instagram: ${publishData.id}`);
      return true;
    } else {
      console.log(`  ❌ Instagram publish: ${JSON.stringify(publishData)}`);
      return false;
    }
  } catch (e) {
    console.log(`  ❌ Instagram error: ${e.message}`);
    return false;
  }
}

// ==================== 메인 ====================

async function run() {
  console.log(`[${new Date().toISOString()}] DalConnect 소셜 자동 포스팅 ${isPreview ? '(미리보기)' : ''}`);
  
  const posts = await selectContent();
  
  if (posts.length === 0) {
    console.log('포스팅할 콘텐츠 없음');
    await pool.end();
    return;
  }
  
  console.log(`\n${posts.length}개 포스트 준비:`);
  
  for (const post of posts) {
    console.log(`\n--- [${post.type.toUpperCase()}] ${post.title} ---`);
    console.log(`  내용: ${post.content.substring(0, 100)}...`);
    console.log(`  이미지: ${post.image ? '✅' : '❌'}`);
    console.log(`  링크: ${post.link}`);
    
    if (!isPreview) {
      await postToFacebook(post);
      await postToInstagram(post);
      // Rate limit between posts
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('\n[완료]');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
