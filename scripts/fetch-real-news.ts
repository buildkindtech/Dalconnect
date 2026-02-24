import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { news } from "../shared/schema";
import { sql } from "drizzle-orm";
import * as xml2js from "xml2js";

// RSS Feed sources
const RSS_FEEDS = [
  // 한국 뉴스
  { url: 'https://www.hani.co.kr/rss/', source: '한겨레', category: '한국뉴스' },
  { url: 'https://rss.donga.com/total.xml', source: '동아일보', category: '한국뉴스' },
  { url: 'https://rss.joins.com/joins_news_list.xml', source: '중앙일보', category: '한국뉴스' },
  
  // 로컬 뉴스 (한인 커뮤니티) - Dallas/DFW 관련
  { url: 'https://www.dallasnews.com/feed/', source: 'Dallas Morning News', category: '로컬뉴스' },
  { url: 'https://www.nbcdfw.com/feed/', source: 'NBC DFW', category: '로컬뉴스' },
  
  // 미국 뉴스
  { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR', category: '미국뉴스' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'New York Times', category: '미국뉴스' },
  { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', source: 'Wall Street Journal', category: '미국뉴스' },
  
  // 월드 뉴스
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World', category: '월드뉴스' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', category: '월드뉴스' },
  { url: 'https://rss.cnn.com/rss/cnn_world.rss', source: 'CNN World', category: '월드뉴스' },
];

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.DATABASE_URL!;

const pool = new pg.Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool, { schema });

interface NewsItem {
  title: string;
  url: string;
  content: string;
  category: string;
  published_date: Date;
  source: string;
  thumbnail_url: string | null;
}

// Fetch RSS feed
async function fetchRSS(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DalConnect/1.0 (News Aggregator)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  
  return await response.text();
}

// Parse RSS feed
async function parseRSS(xmlContent: string): Promise<any> {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    trim: true,
  });
  
  return await parser.parseStringPromise(xmlContent);
}

// Extract thumbnail from RSS item
function extractThumbnail(item: any): string | null {
  // Try media:content
  if (item['media:content']) {
    const mediaContent = item['media:content'];
    if (mediaContent.url) return mediaContent.url;
  }
  
  // Try media:thumbnail
  if (item['media:thumbnail']) {
    const mediaThumbnail = item['media:thumbnail'];
    if (mediaThumbnail.url) return mediaThumbnail.url;
  }
  
  // Try enclosure
  if (item.enclosure) {
    const enclosure = item.enclosure;
    if (enclosure.url && enclosure.type?.startsWith('image/')) {
      return enclosure.url;
    }
  }
  
  // Try description for image tags
  if (item.description) {
    const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch) return imgMatch[1];
  }
  
  return null;
}

// Clean HTML tags from content
function cleanHTML(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Process RSS feed
async function processFeed(feedConfig: typeof RSS_FEEDS[0]): Promise<NewsItem[]> {
  console.log(`\n📡 Fetching ${feedConfig.source} (${feedConfig.category})...`);
  
  try {
    const xmlContent = await fetchRSS(feedConfig.url);
    const parsed = await parseRSS(xmlContent);
    
    const items = parsed.rss?.channel?.item || parsed.feed?.entry || [];
    const itemsArray = Array.isArray(items) ? items : [items];
    
    const newsItems: NewsItem[] = [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    for (const item of itemsArray) {
      try {
        // Extract basic fields
        const title = item.title || item['title'] || '';
        const link = item.link?.href || item.link || item.guid || '';
        const description = item.description || item.summary || item['content:encoded'] || '';
        const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
        
        // Skip if missing required fields
        if (!title || !link) continue;
        
        // Parse date
        const publishedDate = new Date(pubDate);
        
        // Skip old news (older than 3 days)
        if (publishedDate < threeDaysAgo) continue;
        
        // Extract thumbnail
        const thumbnail = extractThumbnail(item);
        
        // Clean content
        const content = cleanHTML(description).substring(0, 500);
        
        newsItems.push({
          title: cleanHTML(title),
          url: link,
          content: content || title,
          category: feedConfig.category,
          published_date: publishedDate,
          source: feedConfig.source,
          thumbnail_url: thumbnail,
        });
      } catch (err) {
        console.log(`⚠️  Skipped item due to error:`, err);
      }
    }
    
    console.log(`✅ Found ${newsItems.length} recent articles from ${feedConfig.source}`);
    return newsItems;
    
  } catch (error) {
    console.error(`❌ Error processing ${feedConfig.source}:`, error);
    return [];
  }
}

// Main function
async function main() {
  console.log('🗑️  Step 1: Deleting all fake news...');
  
  try {
    await db.delete(news);
    console.log('✅ All fake news deleted!\n');
  } catch (error) {
    console.error('❌ Error deleting news:', error);
    process.exit(1);
  }
  
  console.log('📰 Step 2: Fetching real news from RSS feeds...\n');
  
  const allNews: NewsItem[] = [];
  
  for (const feed of RSS_FEEDS) {
    const newsItems = await processFeed(feed);
    allNews.push(...newsItems);
    
    // Wait a bit between requests to be nice
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n💾 Step 3: Saving ${allNews.length} articles to database...`);
  
  let inserted = 0;
  let skipped = 0;
  
  for (const item of allNews) {
    try {
      await db.insert(news).values(item).onConflictDoNothing();
      inserted++;
    } catch (error: any) {
      if (error.code === '23505') { // Duplicate URL
        skipped++;
      } else {
        console.error('Error inserting:', item.title, error);
      }
    }
  }
  
  console.log(`\n✅ Complete!`);
  console.log(`   Inserted: ${inserted} articles`);
  console.log(`   Skipped (duplicates): ${skipped}`);
  
  // Show summary by category
  const summary = allNews.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📊 Summary by category:');
  Object.entries(summary).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} articles`);
  });
  
  await pool.end();
}

main().catch(console.error);
