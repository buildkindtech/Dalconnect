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
const fs = require('fs');
const admin = require('firebase-admin');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

// Firebase 초기화 (뉴스 캐시용)
let firestore = null;
try {
  if (!admin.apps.length) {
    const sa = JSON.parse(fs.readFileSync('/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/konnect-firebase-key.json', 'utf-8'));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  firestore = admin.firestore();
} catch(e) { console.warn('Firebase 초기화 실패 (캐시 비활성화):', e.message); }

// Load GOOGLE_AI_KEY from env or workspace .env file
let GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';
if (!GOOGLE_AI_KEY) {
  try {
    const envFile = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env', 'utf8');
    const m = envFile.match(/GOOGLE_AI_KEY=(.+)/);
    if (m) GOOGLE_AI_KEY = m[1].trim();
  } catch(e) {}
}
console.log('Gemini API:', GOOGLE_AI_KEY ? 'loaded' : 'MISSING');

async function translateToKorean(title, content, retry = 0) {
  if (!GOOGLE_AI_KEY) return { title, content };
  const titleIsKorean = /[\uAC00-\uD7AF]{3,}/.test(title);
  const contentIsKorean = /[\uAC00-\uD7AF]{3,}/.test(content || '');
  // Skip if both already Korean
  if (titleIsKorean && contentIsKorean) return { title, content };
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `뉴스 제목과 내용을 자연스러운 한국어로 번역하세요. 반드시 JSON만 반환: {"title":"번역된제목","content":"번역된내용"}\n\n제목: ${title}\n내용: ${(content || '').substring(0, 1500)}`
          }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (retry < 2) { await new Promise(r => setTimeout(r, 1500)); return translateToKorean(title, content, retry + 1); }
      return { title, content: null };
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      if (retry < 2) { await new Promise(r => setTimeout(r, 1500)); return translateToKorean(title, content, retry + 1); }
      return { title, content: null };
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const translatedTitle = parsed.title || title;
    const translatedContent = parsed.content || parsed.summary || null;
    // 번역 결과가 여전히 영어인 경우 재시도
    if (translatedContent && !/[\uAC00-\uD7AF]{5,}/.test(translatedContent)) {
      if (retry < 2) { await new Promise(r => setTimeout(r, 1500)); return translateToKorean(title, content, retry + 1); }
      return { title, content: null };
    }
    // 제목도 한국어 검증
    if (translatedTitle && !/[\uAC00-\uD7AF]{2,}/.test(translatedTitle) && /[a-zA-Z]{5,}/.test(translatedTitle)) {
      if (retry < 2) { await new Promise(r => setTimeout(r, 1500)); return translateToKorean(title, content, retry + 1); }
    }
    return { title: translatedTitle, content: translatedContent };
  } catch (e) {
    if (retry < 2) { await new Promise(r => setTimeout(r, 2000)); return translateToKorean(title, content, retry + 1); }
    return { title, content: null };
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
  { url: 'https://www.murthy.com/feed/', category: '이민/비자', source: 'Murthy Law', city: null, translate: true },
  { url: 'https://feeds.feedburner.com/immigrationimpact', category: '이민/비자', source: 'American Immigration Council', city: null, translate: true },
  { url: 'https://www.visajourney.com/forums/forum/86-immigration-news/index.xml', category: '이민/비자', source: 'VisaJourney', city: null, translate: true },
  { url: 'https://immigrationforum.org/feed/', category: '이민/비자', source: 'National Immigration Forum', city: null, translate: true },
  { url: 'https://lawprofessors.typepad.com/immigration/rss.xml', category: '이민/비자', source: 'ImmigrationProf Blog', city: null, translate: true },

  // K-POP / 연예
  { url: 'https://www.soompi.com/feed', category: 'K-POP', source: 'Soompi', city: null, translate: true },

  // 스포츠
  { url: 'https://rss.donga.com/sports.xml', category: '스포츠', source: '동아 스포츠', city: null },
  { url: 'https://www.espn.com/espn/rss/nfl/news', category: '스포츠', source: 'ESPN', city: null, translate: true },

  // 건강
  { url: 'https://www.kormedi.com/rss/', category: '건강', source: '코메디닷컴', city: null },
  { url: 'https://rss.donga.com/health.xml', category: '건강', source: '동아일보 건강', city: null },
  { url: 'https://www.healthline.com/rss/health-news', category: '건강', source: 'Healthline', city: null, translate: true },
  { url: 'https://rss.donga.com/wellness.xml', category: '건강', source: '동아 웰니스', city: null },
  { url: 'https://www.yna.co.kr/rss/health.xml', category: '건강', source: '연합뉴스 건강', city: null },

  // 부동산
  { url: 'https://www.realtor.com/news/feed/', category: '부동산/숙소', source: 'Realtor.com', city: null, translate: true },
  { url: 'https://www.housingwire.com/feed/', category: '부동산/숙소', source: 'HousingWire', city: null, translate: true },
  { url: 'https://www.redfin.com/blog/feed/', category: '부동산/숙소', source: 'Redfin Blog', city: null, translate: true },
  { url: 'https://feeds.feedburner.com/TheMortgageReports', category: '부동산/숙소', source: 'The Mortgage Reports', city: null, translate: true },
  { url: 'https://feeds.feedburner.com/fortunebuilders', category: '부동산/숙소', source: 'Fortune Builders', city: null, translate: true },
  { url: 'https://rss.donga.com/economy.xml', category: '부동산/숙소', source: '동아 경제/부동산', city: null },

  // 월드뉴스
  { url: 'https://www.yna.co.kr/rss/international.xml', category: '월드뉴스', source: '연합뉴스 국제', city: null },
  { url: 'https://rss.donga.com/international.xml', category: '월드뉴스', source: '동아 국제', city: null },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: '월드뉴스', source: 'BBC World', city: null, translate: true },

  // 육아
  { url: 'https://www.ibabynews.com/rss/S1N4.xml', category: '육아', source: '베이비뉴스 육아교육', city: null },
  { url: 'https://www.ibabynews.com/rss/S1N3.xml', category: '육아', source: '베이비뉴스 생활건강', city: null },
  { url: 'https://www.ibabynews.com/rss/S1N2.xml', category: '육아', source: '베이비뉴스 임신출산', city: null },
  { url: 'https://www.mother.ly/feed/', category: '육아', source: 'Motherly', city: null, translate: true },

  // 취업/사업
  { url: 'https://www.entrepreneur.com/latest/feed', category: '취업/사업', source: 'Entrepreneur', city: null, translate: true },
  { url: 'https://www.inc.com/rss', category: '취업/사업', source: 'Inc.com', city: null, translate: true },
  { url: 'https://feeds.feedburner.com/SmallBusinessTrends', category: '취업/사업', source: 'Small Business Trends', city: null, translate: true },
  { url: 'https://www.fastcompany.com/latest/rss', category: '취업/사업', source: 'Fast Company', city: null, translate: true },
  { url: 'https://fortune.com/feed', category: '취업/사업', source: 'Fortune', city: null, translate: true },
  { url: 'https://rss.donga.com/economy.xml', category: '취업/사업', source: '동아 경제', city: null },
  { url: 'https://www.yna.co.kr/rss/economy.xml', category: '취업/사업', source: '연합뉴스 취업', city: null },

  // 패션/뷰티
  { url: 'https://www.wkorea.com/feed/', category: '패션/뷰티', source: 'W Korea', city: null },
  { url: 'https://www.allurekorea.com/feed/', category: '패션/뷰티', source: 'Allure Korea', city: null },
  { url: 'https://www.elle.com/rss/all.xml/', category: '패션/뷰티', source: 'Elle', city: null, translate: true },

  // 세금/재정
  { url: 'https://www.nerdwallet.com/blog/feed/', category: '세금/재정', source: 'NerdWallet', city: null, translate: true },
  { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', category: '세금/재정', source: 'CNBC 개인재정', city: null, translate: true },
  { url: 'https://www.yna.co.kr/rss/economy.xml', category: '세금/재정', source: '연합뉴스 경제', city: null },
  { url: 'https://rss.donga.com/money.xml', category: '세금/재정', source: '동아 경제', city: null },
  { url: 'https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml', category: '세금/재정', source: '조선일보 경제', city: null },

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
    
    // Or from <img> in description — supports both quoted and unquoted src (한겨레 등)
    if (!thumbnail) {
      const desc = description || '';
      // 1) quoted: src="..." or src='...'
      const imgQuoted = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgQuoted) thumbnail = imgQuoted[1];
      // 2) unquoted: src=https://... (한겨레 RSS 형식)
      if (!thumbnail) {
        const imgUnquoted = desc.match(/<img[^>]+src=(https?:\/\/[^\s>"']+)/i);
        if (imgUnquoted) thumbnail = imgUnquoted[1];
      }
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

function decodeHtmlEntities(text) {
  if (!text) return '';
  // Named entities
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#039;': "'", '&apos;': "'", '&nbsp;': ' ',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019',
    '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&laquo;': '«', '&raquo;': '»',
    '&middot;': '·', '&bull;': '•', '&hellip;': '…',
    '&ndash;': '–', '&mdash;': '—',
    '&copy;': '©', '&reg;': '®', '&trade;': '™',
    '&times;': '×', '&divide;': '÷',
    '&acute;': '´', '&grave;': '`',
    '&yen;': '¥', '&euro;': '€', '&pound;': '£',
  };
  let result = text.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    if (entities[match]) return entities[match];
    // Numeric entities
    if (match.startsWith('&#x')) {
      return String.fromCharCode(parseInt(match.slice(3, -1), 16));
    }
    if (match.startsWith('&#')) {
      return String.fromCharCode(parseInt(match.slice(2, -1), 10));
    }
    return match;
  });
  return result;
}

function cleanHtml(text) {
  if (!text) return '';
  let c = text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  c = decodeHtmlEntities(c);
  // 수집 즉시 junk 제거
  const ttsIdx = c.indexOf('기사를 읽어드립니다');
  if (ttsIdx >= 0) c = c.substring(ttsIdx + 9).replace(/^[^가-힣]*/, '');
  c = c.replace(/Your browser does not support\s*the?\s*audio element\.?/gi, '');
  c = c.replace(/\b\d{1,2}:\d{2}\b/g, '');
  c = c.replace(/픽사베이\s*광고?/g, '');
  c = c.replace(/게티이미지뱅크\s*/g, '');
  c = c.replace(/이미지투데이\s*/g, '');
  c = c.replace(/수정\s*\d{4}-\d{2}-\d{2}[^가-힣]{0,20}/g, '');
  c = c.replace(/등록\s*\d{4}-\d{2}-\d{2}[^가-힣]{0,20}/g, '');
  c = c.replace(/광고\s*(?=[가-힣])/g, '');
  // ─── 광고/JS 코드 완전 제거 ────────────────────────────────────
  c = c.replace(/if\s*\(typeof\s+is_mobile[\s\S]*?(?=[\uAC00-\uD7AF]|$)/g, ''); // is_mobile JS 블록
  c = c.replace(/createIframe\([^)]*\);?/g, '');                                  // createIframe 호출
  c = c.replace(/\$\(document\)\.ready[\s\S]*?\}\s*\)/g, '');                    // jQuery ready
  c = c.replace(/setTimeout\(function\(\)[\s\S]*?},\s*\d+\)/g, '');             // setTimeout 블록
  c = c.replace(/\/\/\s*애드블록[^\n]*/g, '');                                    // 광고 주석
  c = c.replace(/adv\.[a-z.]+[^\n]*/g, '');                                       // 광고 URL
  c = c.replace(/var\s+\w+\s*=\s*[^;]+;/g, '');                                  // var 선언
  c = c.replace(/function\s*\([^)]*\)\s*\{[^}]*\}/g, '');                        // 함수 리터럴
  c = c.replace(/\{\s*\}\s*,\s*\d+\s*\}\s*\}/g, '');                             // 잔여 괄호
  c = c.replace(/else\s*\{\s*\}/g, '');                                           // empty else
  c = c.replace(/\}\s*\}\s*\)\s*if\s*\(/g, '');                                  // 연결 괄호
  // ────────────────────────────────────────────────────────────────
  return c.replace(/\s{2,}/g, ' ').trim();
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

// 로컬뉴스 소스에서 실제 DFW 로컬인지 판별 후 적절한 카테고리 반환
function smartCategory(defaultCategory, title) {
  if (defaultCategory !== '로컬뉴스') return defaultCategory;
  const t = (title || '').toLowerCase();
  const local = ['달라스','댈러스','dallas','포트워스','fort worth','텍사스','texas','dfw','알링턴','arlington','grand prairie','그랜드 프레이리','메스키트','mesquite','플레이노','plano','카롤톤','carrollton','프리스코','frisco','맥키니','mckinney','가랜드','garland','어빙','irving','리처드슨','richardson','grapevine','lewisville','grayson','north texas'];
  if (local.some(k => t.includes(k))) return '로컬뉴스';
  const world = ['북한','이란','이라크','쿠바','cuba','중국','러시아','우크라이나','이스라엘','팔레스타인','암스테르담','바그다드','걸프','하마스','iran','iraq','north korea','ukraine','russia','china','europe','middle east','gaza','hamas','gulf','tehran','beijing','moscow','바레인','bahrain'];
  if (world.some(k => t.includes(k))) return '월드뉴스';
  const sports = ['nfl','nba','mlb','nhl','march madness','ncaa','formula 1','f1','bracket','ravens','titans','jets','bills','falcons','seahawks','광란의'];
  if (sports.some(k => t.includes(k))) return '스포츠';
  // 나머지 로컬소스 전국 뉴스
  const national = ['미시간','michigan','애리조나','arizona','조지아','georgia','플로리다','florida','콜로라도','colorado','캘리포니아','california','오헤어','o\'hare','dulles','dolly','southwest airlines','gas price','포브스','forbes','oscar','emmy','senate','congress','federal'];
  if (national.some(k => t.includes(k))) return '미국뉴스';
  return '미국뉴스'; // WFAA 기본값: 로컬 아닌 건 미국뉴스
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
    
    // 번역 후 남아있는 HTML 엔티티 재디코딩 (번역 API가 엔티티를 유지하는 경우 대비)
    title = decodeHtmlEntities(title);
    if (content) content = decodeHtmlEntities(content);

    // Smart category for local sources
    article.category = smartCategory(article.category, title);

    // 기사 페이지에서 OG 이미지 + 본문 description fetch
    let thumbnail = article.thumbnail || null;
    try {
      const r = await fetch(article.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(6000)
      });
      const html = await r.text();

      // OG 이미지
      if (!thumbnail) {
        const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (m) thumbnail = m[1];
      }

      // 1) 기사 본문 직접 추출 시도
      if (!content || content.length < 200) {
        const bodyPatterns = [
          /<article[^>]*>([\s\S]{200,}?)<\/article>/i,
          /<div[^>]+class="[^"]*(?:article-body|article_body|articleBody|article-content|news-content|entry-content|cont_view|news_view|view_cont|article_txt)[^"]*"[^>]*>([\s\S]{200,}?)<\/div>/i,
          /<div[^>]+id="[^"]*(?:article-view-content-div|articleBody|newsct_article)[^"]*"[^>]*>([\s\S]{200,}?)<\/div>/i,
        ];
        for (const pat of bodyPatterns) {
          const bm = html.match(pat);
          if (bm) { const t = cleanHtml(bm[1]); if (t.length > 150) { content = t.substring(0, 2000); break; } }
        }
      }
      
      // 2) OG description fallback
      if (!content || content.length < 100) {
        const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
                       || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
                       || html.match(/<meta[^>]+content=["']([^"']{80,}?)["'][^>]+(?:property=["']og:description["']|name=["']description["'])/i);
        if (descMatch && descMatch[1].length > 50) {
          content = cleanHtml(descMatch[1]).substring(0, 800);
        }
      }
    } catch(e) {
      // fetch 실패해도 계속 진행
    }
    
    // 3) 그래도 내용 없으면 Gemini AI 요약 생성
    if ((!content || content.length < 100) && GOOGLE_AI_KEY) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `다음 뉴스 기사 제목을 보고 3문장으로 한국어 요약해주세요. JSON만 반환: {"summary":"요약"}\n\n제목: ${title}\n출처: ${article.source}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const m = text.match(/\{[\s\S]*\}/);
        if (m) { const parsed = JSON.parse(m[0]); if (parsed.summary) content = parsed.summary; }
      } catch(e) { /* AI 실패해도 계속 */ }
    }

    // ⚠️ 번역 필수 소스인데 제목이 완전히 영어만 → 재시도 1회 후 스킵 (빈 내용 방지)
    if (article.translate) {
      const titleHasKorean = /[\uAC00-\uD7AF]{3,}/.test(title);
      if (!titleHasKorean) {
        // 한번 더 번역 시도
        const retry = await translateToKorean(title, content);
        if (/[\uAC00-\uD7AF]{3,}/.test(retry.title)) {
          title = retry.title;
          content = retry.content || content;
        } else {
          console.warn(`⛔ 번역 최종 실패 — 저장 거부: "${title.substring(0,60)}"`);
          return false;
        }
      }
    }

    const result = await pool.query(
      'INSERT INTO news (title, content, category, source, url, thumbnail_url, published_date, city) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [
        title,
        content || title,
        article.category,
        article.source,
        article.url,
        thumbnail,
        article.pubDate && article.pubDate <= new Date() ? article.pubDate : new Date(), // 미래 날짜 방지
        article.city || 'dallas',
      ]
    );

    // Firebase Firestore 캐시 (뉴스 영속성 보장)
    if (firestore) {
      try {
        const newsId = result.rows[0]?.id;
        await firestore.collection('news_cache').doc(newsId).set({
          id: newsId, title, content: content || title,
          category: article.category, source: article.source,
          url: article.url, thumbnail_url: thumbnail,
          published_date: article.pubDate || new Date(),
          city: article.city || 'dallas',
          cached_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch(e) { /* 캐시 실패해도 DB 저장은 성공 */ }
    }

    return true;
  } catch (e) {
    if (!e.message.includes('duplicate')) console.error('Insert error:', e.message);
    return false;
  }
}

// ─── Reddit 엄마/육아/생활정보 수집 ─────────────────────────────
// 전략: ① 엄마/육아 전문 서브레딧 (hot) ② DFW 로컬 키워드 검색
const REDDIT_SOURCES = [
  // 엄마/육아 전문
  { type: 'hot',    subreddit: 'Mommit',       category: '육아',    label: 'r/Mommit',         minScore: 20 },
  { type: 'hot',    subreddit: 'beyondthebump', category: '육아',    label: 'r/beyondthebump',  minScore: 15 },
  { type: 'hot',    subreddit: 'Parenting',     category: '육아',    label: 'r/Parenting',      minScore: 20 },
  { type: 'hot',    subreddit: 'toddlers',      category: '육아',    label: 'r/toddlers',       minScore: 15 },
  // DFW 로컬 — 가족/아이 관련 키워드 검색
  { type: 'search', subreddit: 'Dallas',        category: '달라스',  label: 'r/Dallas 이벤트',   q: 'kids events activities toddler playground school', minScore: 10 },
  { type: 'search', subreddit: 'DFW',           category: '달라스',  label: 'r/DFW 가족',        q: 'family kids baby daycare school activities',       minScore: 5  },
];

// 필터 아웃: 정치/범죄/논쟁 글
const REDDIT_SKIP = /\b(trump|biden|maga|democrat|republican|election|ICE|arrest|murder|shooting|killed|victim|racist|fascist|nazi|abortion|gun|GOP|DNC|antifa|BLM|riot|protest|lawsuit|indicted|convicted|defund|hate speech|pedo|cruelty)\b/i;

async function fetchRedditPosts() {
  const allItems = [];
  for (const src of REDDIT_SOURCES) {
    try {
      console.log(`\n🤖 Reddit ${src.label}...`);
      const url = src.type === 'search'
        ? `https://www.reddit.com/r/${src.subreddit}/search.json?q=${encodeURIComponent(src.q)}&sort=new&restrict_sr=1&limit=20`
        : `https://www.reddit.com/r/${src.subreddit}/hot.json?limit=25`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'DalKonnect/1.0 (+https://dalkonnect.com)' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const posts = data.data?.children?.map(c => c.data) || [];

      let count = 0;
      for (const p of posts) {
        if (p.score < src.minScore) continue;
        if (REDDIT_SKIP.test(p.title) || REDDIT_SKIP.test(p.selftext || '')) continue;
        if (p.over_18) continue;

        const title = p.title.trim();
        const content = (p.selftext || '').trim().slice(0, 500) ||
          `${title} — ${src.label} 커뮤니티 게시글 (댓글 ${p.num_comments}개, 추천 ${p.score})`;
        const thumbnail = p.thumbnail?.startsWith('http') ? p.thumbnail : null;

        allItems.push({
          title,
          content,
          url: `https://www.reddit.com${p.permalink}`,
          thumbnail_url: thumbnail,
          source: src.label,
          category: src.category,
          city: src.subreddit === 'Dallas' || src.subreddit === 'DFW' ? 'dallas' : null,
          translate: !/[\uAC00-\uD7AF]/.test(title),
          published_at: new Date(p.created_utc * 1000).toISOString(),
        });
        if (++count >= 6) break;
      }
      console.log(`  ${count}개 수집`);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.log(`  ⚠️ ${src.label} 실패: ${e.message}`);
    }
  }
  return allItems;
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

  // ─── Reddit 달라스 생활정보 ───────────────────────────────────
  console.log('\n\n━━━ Reddit 달라스 생활정보 수집 ━━━');
  const redditPosts = await fetchRedditPosts();
  let redditCount = 0;
  for (const item of redditPosts) {
    // 번역 필요한 글은 Gemini로 번역
    if (item.translate && GOOGLE_AI_KEY) {
      const t = await translateToKorean(item.title, item.content);
      item.title = t.title || item.title;
      item.content = t.content || item.content;
      await new Promise(r => setTimeout(r, 300));
    }
    const inserted = await insertIfNew(item);
    if (inserted) {
      console.log(`  ✅ ${item.source}: ${item.title.substring(0, 55)}`);
      redditCount++;
      total++;
    }
  }
  console.log(`  Reddit: ${redditCount}개 신규 추가`);

  console.log(`\n[수집 완료] ${total}개 새 기사 추가 (${errors}개 소스 실패)`);
  
  // Post-collection: translate any remaining English articles
  if (GOOGLE_AI_KEY) {
    console.log('\n🌐 영어 기사 번역 시작...');
    const { rows } = await pool.query(`SELECT id, title, content FROM news WHERE (title ~ '[A-Za-z]{5,}' AND title !~ '[가-힣]') OR (content IS NOT NULL AND content !~ '[가-힣]' AND content ~ '[a-zA-Z]{5,}')`);
    if (rows.length > 0) {
      console.log(`  번역 대상: ${rows.length}개`);
      let translated = 0;
      for (const row of rows) {
        try {
          const t = await translateToKorean(row.title, row.content);
          if (t.title !== row.title) {
            await pool.query('UPDATE news SET title = $1, content = $2 WHERE id = $3', [t.title, t.content || '', row.id]);
            translated++;
          }
        } catch(e) {}
        await new Promise(r => setTimeout(r, 300));
      }
      console.log(`  ✅ ${translated}개 번역 완료`);
    } else {
      console.log('  영어 기사 없음 — 스킵');
    }
  }
  
  console.log(`\n[최종 완료] ${total}개 추가, 전부 한글`);
  await pool.end();

  // 업데이트 후 자동 헬스체크
  console.log('\n🔍 업데이트 후 헬스체크 실행...');
  try {
    const { execSync } = require('child_process');
    execSync('node scripts/health-check.cjs', { stdio: 'inherit', cwd: __dirname + '/..' });
  } catch (e) {
    console.error('⚠️ 헬스체크 실패 — 수동 확인 필요');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
