#!/usr/bin/env node
/**
 * DalKonnect 블로그 자동 큐레이션 스크립트
 * 
 * DFW 로컬 블로거/매거진에서 인기 콘텐츠 수집 →
 * Gemini Flash로 한글 요약/재작성 → 블로그 포스트 자동 생성
 * 
 * 소스:
 * - Eater Dallas (맛집)
 * - Secret Dallas (놀거리/이벤트)
 * - Dallas Culture (문화/이벤트)
 * - 네이버 DFW 한인 블로거 (부동산/생활)
 * 
 * 크론: 매일 오전 10시 CST
 */

const pg = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';

console.log(`\n📝 블로그 큐레이션 시작: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);

// ==================== 소스 정의 ====================

const SOURCES = [
  // English DFW blogs (번역 필요)
  {
    name: 'Eater Dallas',
    url: 'https://dallas.eater.com/rss/index.xml',
    category: '맛집',
    format: 'atom',
    translate: true,
    maxItems: 3,
  },
  {
    name: 'Secret Dallas',
    url: 'https://secretdallas.com/feed/',
    category: '놀거리',
    format: 'rss',
    translate: true,
    maxItems: 3,
  },
  {
    name: 'Dallas Culture',
    url: 'https://dallasculture.org/feed/',
    category: '문화/이벤트',
    format: 'rss',
    translate: true,
    maxItems: 2,
  },
  // 네이버 한인 블로거 (한국어 — 번역 불필요)
  {
    name: '달라스 지은부동산',
    url: 'https://rss.blog.naver.com/jieunrealty.xml',
    category: '부동산',
    format: 'rss',
    translate: false,
    maxItems: 2,
    filterKeywords: ['달라스', '텍사스', 'Dallas', 'Texas', 'DFW', '플레이노', '캐롤턴', '프리스코'],
  },
  {
    name: '미국에선 이렇게 공부해요',
    url: 'https://rss.blog.naver.com/grantfamily.xml',
    category: '교육/생활',
    format: 'rss',
    translate: false,
    maxItems: 2,
    filterKeywords: ['달라스', '텍사스', 'Dallas', 'Texas', 'DFW', '플레이노', '트레이더조스', '미국'],
  },
  {
    name: '단단하지 않고 물렁물렁',
    url: 'https://rss.blog.naver.com/sarahsfield.xml',
    category: '여행/일상',
    format: 'rss',
    translate: false,
    maxItems: 2,
    filterKeywords: ['텍사스', 'Texas', '달라스', 'DFW'],
  },
  // 건강/웰빙
  {
    name: 'Healthline',
    url: 'https://www.healthline.com/rss/health-news',
    category: '건강/웰빙',
    format: 'rss',
    translate: true,
    maxItems: 2,
  },
  // 스포츠 (DFW)
  {
    name: '달라스 카우보이스 뉴스',
    url: 'https://www.dallascowboys.com/rss/news',
    category: '스포츠',
    format: 'rss',
    translate: true,
    maxItems: 2,
  },
  // 뷰티/패션
  {
    name: 'Soompi 뷰티',
    url: 'https://www.soompi.com/feed',
    category: '뷰티/패션',
    format: 'rss',
    translate: true,
    maxItems: 2,
    filterKeywords: ['beauty', 'fashion', 'style', 'makeup', 'skin'],
  },
  // 이민/비자
  {
    name: 'Murthy Law',
    url: 'https://www.murthy.com/feed/',
    category: '이민/비자',
    format: 'rss',
    translate: true,
    maxItems: 2,
  },
];

// ==================== RSS 파싱 ====================

async function fetchFeed(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'DalKonnect/1.0 (blog curator)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.log(`  ⚠️ ${source.name}: HTTP ${res.status}`); return []; }
    
    const text = await res.text();
    const items = [];
    
    if (source.format === 'atom') {
      // Atom feed
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      let match;
      while ((match = entryRegex.exec(text)) && items.length < source.maxItems) {
        const entry = match[1];
        const title = extractTag(entry, 'title');
        const link = entry.match(/href="([^"]+)"/)?.[1] || '';
        const summary = extractTag(entry, 'summary') || extractTag(entry, 'content');
        const pubDate = extractTag(entry, 'updated') || extractTag(entry, 'published');
        if (title) items.push({ title, link, summary: cleanHtml(summary), pubDate, source: source.name });
      }
    } else {
      // RSS feed
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(text)) && items.length < (source.maxItems * 2)) {
        const item = match[1];
        const title = extractTag(item, 'title');
        const link = extractTag(item, 'link');
        const desc = extractTag(item, 'description');
        const content = extractTag(item, 'content:encoded') || desc;
        const pubDate = extractTag(item, 'pubDate');
        
        // Filter by keywords if specified
        if (source.filterKeywords) {
          const combined = (title + ' ' + (desc || '')).toLowerCase();
          const hasKeyword = source.filterKeywords.some(kw => combined.toLowerCase().includes(kw.toLowerCase()));
          if (!hasKeyword) continue;
        }
        
        if (title && items.length < source.maxItems) {
          items.push({ title: cleanHtml(title), link, summary: cleanHtml(content || desc), pubDate, source: source.name });
        }
      }
    }
    
    return items;
  } catch(e) {
    console.log(`  ⚠️ ${source.name}: ${e.message}`);
    return [];
  }
}

function extractTag(text, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

// ==================== Gemini 번역/재작성 ====================

async function rewriteAsKoreanBlog(item, category) {
  if (!GOOGLE_AI_KEY) return null;
  
  const prompt = item.source.includes('네이버') || !item.translate
    ? `이 블로그 글을 DalKonnect(달라스 한인 커뮤니티 포털) 블로그용으로 재작성해주세요.
원문 제목: ${item.title}
원문 요약: ${item.summary?.substring(0, 300) || ''}
출처: ${item.source}

JSON으로 응답:
{"title": "한글 제목 (SEO 최적화, 달라스/DFW 키워드 포함)", "content": "블로그 본문 (500-800자, 정보 위주, 마크다운)", "excerpt": "요약 2-3줄", "tags": ["태그1", "태그2"]}`
    : `Rewrite this DFW local content as a Korean blog post for DalKonnect (달라스 한인 커뮤니티 포털).
The audience is Korean families living in Dallas-Fort Worth.

Original title: ${item.title}
Original summary: ${item.summary?.substring(0, 300) || ''}
Source: ${item.source}

Respond in JSON:
{"title": "한글 제목 (SEO 최적화, 달라스/DFW 키워드 포함)", "content": "블로그 본문 500-800자 한국어, 정보 위주, 마크다운 형식", "excerpt": "요약 2-3줄 한국어", "tags": ["태그1", "태그2"]}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    
    if (!res.ok) { console.log(`  ⚠️ Gemini: HTTP ${res.status}`); return null; }
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title,
      content: parsed.content,
      excerpt: parsed.excerpt,
      tags: parsed.tags || [],
      category,
      sourceUrl: item.link,
      sourceName: item.source,
    };
  } catch(e) {
    console.log(`  ⚠️ 재작성 실패: ${e.message}`);
    return null;
  }
}

// ==================== DB 저장 ====================

function generateSlug(title) {
  return title
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 80) + '-' + Date.now().toString(36);
}

async function insertBlog(blog) {
  try {
    // ① source_url 기반 중복 체크 (Gemini 재작성으로 제목이 달라져도 막음)
    if (blog.source_url) {
      const byUrl = await pool.query(
        "SELECT id FROM blogs WHERE source_url = $1 LIMIT 1",
        [blog.source_url]
      );
      if (byUrl.rows.length > 0) return 'skip';
    }

    // ② 제목 기반 중복 체크 (source_url 없는 기존 데이터 대비)
    const existing = await pool.query(
      "SELECT id FROM blogs WHERE title = $1 LIMIT 1",
      [blog.title]
    );
    if (existing.rows.length > 0) return 'skip';
    
    const id = crypto.randomUUID();
    const slug = generateSlug(blog.title);
    
    // 이미지 없이 — 카테고리 이모지로 대체 (AI 이미지/불일치 이미지 방지)
    const coverImage = null;

    await pool.query(
      `INSERT INTO blogs (id, title, slug, content, excerpt, category, author,
       tags, cover_image, published_at, created_at, city, source_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW(),'dallas',$10)`,
      [
        id, blog.title, slug, blog.content, blog.excerpt, blog.category,
        'DalKonnect 에디터',
        JSON.stringify(blog.tags),
        coverImage,
        blog.source_url || null
      ]
    );
    
    return 'inserted';
  } catch(e) {
    console.log(`  ❌ DB: ${e.message}`);
    return 'error';
  }
}

// ==================== 메인 ====================

async function main() {
  let totalAdded = 0;
  
  for (const source of SOURCES) {
    console.log(`📰 ${source.name} (${source.category})...`);
    const items = await fetchFeed(source);
    
    if (items.length === 0) {
      console.log('  (새 글 없음)');
      continue;
    }
    
    for (const item of items) {
      // Gemini 호출 전에 source_url 중복 체크 (API 비용 절약)
      if (item.link) {
        const preCheck = await pool.query(
          "SELECT id FROM blogs WHERE source_url = $1 LIMIT 1",
          [item.link]
        );
        if (preCheck.rows.length > 0) {
          console.log(`  ⏭️ 이미 수집됨 (source_url): ${item.link.substring(0, 60)}`);
          continue;
        }
      }

      // Rewrite as Korean blog post
      const blog = await rewriteAsKoreanBlog(
        { ...item, translate: source.translate },
        source.category
      );
      
      if (!blog) continue;
      
      // source_url 전달
      blog.source_url = item.link || null;

      const result = await insertBlog(blog);
      if (result === 'inserted') {
        totalAdded++;
        console.log(`  ✅ ${blog.title.substring(0, 60)}`);
        console.log(`     출처: ${source.name} → ${item.link?.substring(0, 60) || 'N/A'}`);
      } else if (result === 'skip') {
        console.log(`  ⏭️ 중복: ${blog.title.substring(0, 50)}`);
      }
      
      // Rate limit for Gemini
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // RSS 수집이 적으면 Gemini 원본 글로 보충
  if (totalAdded < 2) {
    console.log(`\n📝 RSS 수집 ${totalAdded}개 → Gemini 원본 블로그 생성으로 보충...`);
    const aiAdded = await generateAIBlogs();
    totalAdded += aiAdded;
  }

  // Summary
  const total = await pool.query('SELECT count(*) FROM blogs');
  console.log(`\n📊 결과: ${totalAdded}개 새 블로그 추가 | 총 ${total.rows[0].count}개`);
  console.log(`✅ 큐레이션 완료: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);

  await pool.end();
}

// ==================== Gemini 원본 블로그 생성 ====================

async function generateAIBlogs() {
  if (!GOOGLE_AI_KEY) return 0;

  // 최근 뉴스 헤드라인 + 기존 블로그 제목 (중복 방지)
  let recentNews = '';
  let existingTitles = new Set();
  try {
    const nr = await pool.query("SELECT title FROM news WHERE created_at > NOW() - INTERVAL '72 hours' ORDER BY created_at DESC LIMIT 10");
    recentNews = nr.rows.map(r => r.title).join('\n');
    const br = await pool.query("SELECT title FROM blogs ORDER BY created_at DESC LIMIT 30");
    existingTitles = new Set(br.rows.map(r => r.title));
  } catch {}

  const BLOG_CATEGORIES = ['생활정보','맛집','육아/교육','부동산','건강','이민/비자','달라스 생활'];
  const prompt = `달라스(DFW) 한인 커뮤니티 포털 DalKonnect 블로그 글 2개를 작성해주세요.

최근 뉴스 (글 주제 영감용):
${recentNews}

조건:
- 달라스/DFW 한인 독자 대상
- 실용적인 정보 (생활, 맛집, 육아, 부동산, 건강, 이민 등)
- 자연스러운 한국어, 500-700자
- 카테고리: ${BLOG_CATEGORIES.join(', ')} 중 선택
- 뉴스 기반이면 달라스 한인 관점으로 로컬화

JSON 배열로만 응답:
[
  {
    "title": "SEO 최적화 한글 제목 (달라스/DFW 키워드 포함)",
    "content": "마크다운 본문 500-700자",
    "excerpt": "요약 2줄",
    "category": "카테고리",
    "tags": ["태그1","태그2","태그3"]
  }
]`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 3000, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) { console.log('  ⚠️ AI 블로그 JSON 파싱 실패'); return 0; }

    const posts = JSON.parse(jsonMatch[0]);
    let added = 0;
    for (const post of posts) {
      if (existingTitles.has(post.title)) { console.log(`  ⏭️ 중복: ${post.title}`); continue; }
      const result = await insertBlog({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags || [],
        source_url: null,
      });
      if (result === 'inserted') {
        console.log(`  ✅ [AI] ${post.title}`);
        added++;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    return added;
  } catch(e) {
    console.log('  ⚠️ AI 블로그 생성 실패:', e.message);
    return 0;
  }
}

main().catch(e => { console.error('❌', e); pool.end(); process.exit(1); });
