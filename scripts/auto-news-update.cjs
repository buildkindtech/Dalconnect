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

// RSS 피드 소스
const RSS_FEEDS = [
  // DFW 로컬 뉴스
  { url: 'https://www.fox4news.com/rss.xml', category: '로컬뉴스', source: 'Fox 4 DFW', city: 'dallas' },
  { url: 'https://www.wfaa.com/feeds/syndication/rss/news', category: '로컬뉴스', source: 'WFAA', city: 'dallas' },
  { url: 'https://dfw.cbslocal.com/feed/', category: '로컬뉴스', source: 'CBS DFW', city: 'dallas' },
  { url: 'https://www.nbcdfw.com/news/feed/', category: '로컬뉴스', source: 'NBC DFW', city: 'dallas' },
  { url: 'https://starlocalmedia.com/dallasnews/feed/', category: '로컬뉴스', source: 'Star Local Media', city: 'dallas' },
  { url: 'https://www.dallasobserver.com/dallas/Rss.xml', category: '로컬뉴스', source: 'Dallas Observer', city: 'dallas' },

  // 한국 뉴스 (간추린 — 한인 관심사)
  { url: 'https://www.yonhapnewstv.co.kr/browse/feed/', category: '한국뉴스', source: '연합뉴스TV', city: null },
  { url: 'https://www.hani.co.kr/rss/', category: '한국뉴스', source: '한겨레', city: null },
  { url: 'https://rss.donga.com/total.xml', category: '한국뉴스', source: '동아일보', city: null },

  // 미국 뉴스
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml', category: '미국뉴스', source: 'New York Times', city: null },

  // 이민/비자
  { url: 'https://www.uscis.gov/rss/news', category: '이민/비자', source: 'USCIS', city: null },

  // K-POP / 엔터
  { url: 'https://www.soompi.com/feed', category: 'K-POP', source: 'Soompi', city: null },

  // 스포츠
  { url: 'https://www.espn.com/espn/rss/nfl/news', category: '스포츠', source: 'ESPN', city: null },

  // 건강
  { url: 'https://www.medicalnewstoday.com/rss/nutrition.xml', category: '건강', source: 'Medical News Today', city: null },
  { url: 'https://rss.webmd.com/rss/rss.aspx/rss/rss.aspx?RSSSource=RSS_PUBLIC', category: '건강', source: 'WebMD', city: null },
  { url: 'https://www.health.com/rss/all.xml', category: '건강', source: 'Health.com', city: null },
  { url: 'https://www.hidoc.co.kr/rss/news', category: '건강', source: '하이닥', city: null },

  // 부동산/숙소
  { url: 'https://www.dallasnews.com/real-estate/feed/', category: '부동산/숙소', source: 'Dallas Morning News RE', city: 'dallas' },
  { url: 'https://www.housingwire.com/feed/', category: '부동산/숙소', source: 'HousingWire', city: null },
  { url: 'https://www.realtor.com/news/feed/', category: '부동산/숙소', source: 'Realtor.com', city: null },

  // 생활정보
  { url: 'https://lifehacker.com/feed/rss', category: '생활정보', source: 'Lifehacker', city: null },
  { url: 'https://www.consumerreports.org/feeds/topic/money.xml', category: '생활정보', source: 'Consumer Reports', city: null },

  // 세금/재정
  { url: 'https://www.irs.gov/newsroom/rss.xml', category: '세금/재정', source: 'IRS News', city: null },
  { url: 'https://www.nerdwallet.com/blog/feed/', category: '세금/재정', source: 'NerdWallet', city: null },
  { url: 'https://feeds.feedburner.com/TheFinancialDiet', category: '세금/재정', source: 'Financial Diet', city: null },

  // 연예/드라마
  { url: 'https://www.allkpop.com/rss', category: '연예/드라마', source: 'allkpop', city: null },
  { url: 'https://www.soompi.com/feed', category: '연예/드라마', source: 'Soompi Drama', city: null },
  { url: 'https://mydramalist.com/rss/news', category: '연예/드라마', source: 'MyDramaList', city: null },

  // 월드뉴스
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: '월드뉴스', source: 'BBC World', city: null },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: '월드뉴스', source: 'NYT World', city: null },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', category: '월드뉴스', source: 'Al Jazeera', city: null },

  // 육아
  { url: 'https://www.parents.com/feed/', category: '육아', source: 'Parents.com', city: null },
  { url: 'https://www.scarymommy.com/feed', category: '육아', source: 'Scary Mommy', city: null },

  // 취업/사업
  { url: 'https://www.entrepreneur.com/latest/feed', category: '취업/사업', source: 'Entrepreneur', city: null },
  { url: 'https://www.sba.gov/rss.xml', category: '취업/사업', source: 'SBA', city: null },
  { url: 'https://feeds.feedburner.com/TheSmallBusinessBlog', category: '취업/사업', source: 'Small Biz Blog', city: null },

  // 패션/뷰티
  { url: 'https://www.allure.com/feed/rss', category: '패션/뷰티', source: 'Allure', city: null },
  { url: 'https://fashionista.com/.rss/full/', category: '패션/뷰티', source: 'Fashionista', city: null },
  { url: 'https://www.elle.com/rss/all.xml/', category: '패션/뷰티', source: 'Elle', city: null },
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

    await pool.query(
      'INSERT INTO news (title, content, category, source, url, thumbnail_url, published_date, city) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        article.title,
        article.content || article.title,
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
