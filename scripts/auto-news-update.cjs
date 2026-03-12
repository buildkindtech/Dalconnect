#!/usr/bin/env node
/**
 * DalConnect 자동 뉴스 수집 스크립트 v2
 * RSS 피드 + 웹 스크래이핑으로 DFW 로컬 + 한인 커뮤니티 뉴스 수집
 * 
 * 소스:
 * - DFW 로컬: Dallas Morning News, NBC DFW, CBS DFW, Fox 4
 * - 한인 뉴스: Korea Daily (중앙일보 미주), Korea Times Dallas, 미주 한국일보
 * - 한국 뉴스: 연합뉴스, 한겨레 (간추린)
 * - 커뮤니티: K-POP, 스포츠, 이민/비자
 */

const pg = require('pg');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

// Gemini Flash API for translation (English → Korean) — cheapest option
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';

async function translateToKorean(title, content) {
  if (!GOOGLE_AI_KEY) return { title, content };
  // Skip if already Korean
  if (/[\uAC00-\uD7AF]/.test(title)) return { title, content };
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `뉴스 제목과 내용을 자연스러운 한국어로 번역하세요. 반드시 JSON만 반환: {"title":"번역된제목","content":"번역된내용"}\n\n제목: ${title}\n내용: ${(content || '').substring(0, 300)}`
          }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      }),
    });
    if (!res.ok) return { title, content };
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { title, content };
    const parsed = JSON.parse(jsonMatch[0]);
    return { title: parsed.title || title, content: parsed.content || parsed.summary || content };
  } catch (e) {
    return { title, content };
  }
}

// RSS 피드 소스 — 한국어 + 영어 (번역)
const RSS_FEEDS = [
  // 한국 뉴스 (메인)
  { url: 'https://www.yonhapnewstv.co.kr/browse/feed/', category: '한국뉴스', source: '연합뉴스TV', city: null },
  { url: 'https://www.hani.co.kr/rss/', category: '한국뉴스', source: '한겨레', city: null },
  { url: 'https://rss.donga.com/total.xml', category: '한국뉴스', source: '동아일보', city: null },
  { url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml', category: '한국뉴스', source: '경향신문', city: null },
  { url: 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml', category: '한국뉴스', source: '조선일보', city: null },

  // 미주 한인 뉴스
  { url: 'https://www.koreadaily.com/RSS/news.xml', category: '미주뉴스', source: '중앙일보 미주', city: null },

  // DFW 로컬 뉴스 (영어 → 번역)
  { url: 'https://www.wfaa.com/feeds/syndication/rss/news', category: '로컬뉴스', source: 'WFAA', city: 'dallas', translate: true },
  { url: 'https://www.nbcdfw.com/news/feed/', category: '로컬뉴스', source: 'NBC DFW', city: 'dallas', translate: true },

  // 이민/비자
  { url: 'https://www.uscis.gov/rss/news', category: '이민/비자', source: 'USCIS', city: null, translate: true },

  // K-POP / 연예
  { url: 'https://www.soompi.com/feed', category: 'K-POP', source: 'Soompi', city: null, translate: true },

  // 스포츠
  { url: 'https://rss.donga.com/sports.xml', category: '스포츠', source: '동아 스포츠', city: null },
  { url: 'https://www.espn.com/espn/rss/nfl/news', category: '스포츠', source: 'ESPN', city: null, translate: true },

  // 건강
  { url: 'https://health.chosun.com/rss/all.xml', category: '건강', source: '헬스조선', city: null },
  { url: 'https://www.medicalnewstoday.com/rss/nutrition.xml', category: '건강', source: 'Medical News Today', city: null, translate: true },

  // 부동산
  { url: 'https://www.realtor.com/news/feed/', category: '부동산/숙소', source: 'Realtor.com', city: null, translate: true },

  // 월드뉴스
  { url: 'https://www.yna.co.kr/rss/international.xml', category: '월드뉴스', source: '연합뉴스 국제', city: null },
  { url: 'https://rss.donga.com/international.xml', category: '월드뉴스', source: '동아 국제', city: null },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: '월드뉴스', source: 'BBC World', city: null, translate: true },

  // 육아
  { url: 'https://www.parents.com/feed/', category: '육아', source: 'Parents.com', city: null, translate: true },

  // 취업/사업
  { url: 'https://www.entrepreneur.com/latest/feed', category: '취업/사업', source: 'Entrepreneur', city: null, translate: true },

  // 패션/뷰티
  { url: 'https://www.wkorea.com/feed/', category: '패션/뷰티', source: 'W Korea', city: null },
  { url: 'https://www.allurekorea.com/feed/', category: '패션/뷰티', source: 'Allure Korea', city: null },
  { url: 'https://www.elle.com/rss/all.xml/', category: '패션/뷰티', source: 'Elle', city: null, translate: true },

  // 세금/재정
  { url: 'https://www.nerdwallet.com/blog/feed/', category: '세금/재정', source: 'NerdWallet', city: null, translate: true },

  // 테크
  { url: 'https://www.etnews.com/rss', category: '테크', source: '전자신문', city: null },
];

// Simple XML parser for RSS (no dependency needed)
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractTag(itemXml, 'guid');
    const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded');
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date');
    
    // Extract thumbnail from media:content, media:thumbnail, or enclosure
    let thumbnail = null;
    const mediaMatch = itemXml.match(/(?:media:content|media:thumbnail|enclosure)[^>]*url=["']([^"']+)["']/i);
    if (mediaMatch) thumbnail = mediaMatch[1];
    
    // Or from <image> in description
    if (!thumbnail) {
      const imgMatch = (description || '').match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) thumbnail = imgMatch[1];
    }
    
    if (title && link) {
      items.push({
        title: cleanHtml(title),
        url: link.trim(),
        content: cleanHtml(description || title).substring(0, 500),
        pubDate: pubDate ? new Date(pubDate) : new Date(),
        thumbnail,
      });
    }
  }
  
  return items.slice(0, 10); // Max 10 per feed
}

function extractTag(xml, tag) {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];
  
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeed(feedConfig) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DalConnect/2.0 (News Aggregator; https://dalconnect.buildkind.tech)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.log(`  ⚠️ ${feedConfig.source}: HTTP ${res.status}`);
      return [];
    }
    
    const xml = await res.text();
    const items = parseRSS(xml);
    
    return items.map(item => ({
      ...item,
      category: feedConfig.category,
      source: feedConfig.source,
      city: feedConfig.city,
      translate: feedConfig.translate || false,
    }));
  } catch (e) {
    console.log(`  ⚠️ ${feedConfig.source}: ${e.message}`);
    return [];
  }
}

async function insertIfNew(article) {
  try {
    const existing = await pool.query('SELECT id FROM news WHERE url = $1', [article.url]);
    if (existing.rows.length > 0) return false;

    let { title, content } = article;
    
    // Translate English articles to Korean
    if (article.translate) {
      const translated = await translateToKorean(title, content);
      title = translated.title;
      content = translated.content;
    }

    await pool.query(
      'INSERT INTO news (title, content, category, source, url, thumbnail_url, published_date, city) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        title,
        content || title,
        article.category,
        article.source,
        article.url,
        article.thumbnail || null,
        article.pubDate || new Date(),
        article.city || 'dallas',
      ]
    );
    return true;
  } catch (e) {
    if (!e.message.includes('duplicate')) console.error('Insert error:', e.message);
    return false;
  }
}

async function run() {
  console.log(`[${new Date().toISOString()}] DalConnect 뉴스 수집 v2 시작...`);
  let total = 0;
  let errors = 0;

  for (const feed of RSS_FEEDS) {
    console.log(`\n📰 ${feed.source} (${feed.category})...`);
    const items = await fetchFeed(feed);
    
    if (items.length === 0) {
      errors++;
      continue;
    }
    
    let feedCount = 0;
    for (const item of items) {
      const inserted = await insertIfNew(item);
      if (inserted) {
        console.log(`  ✅ ${item.title.substring(0, 60)}`);
        feedCount++;
        total++;
      }
    }
    
    if (feedCount === 0) console.log(`  (새 기사 없음)`);
    
    // Rate limit between feeds
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n[완료] ${total}개 새 기사 추가 (${errors}개 소스 실패)`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
