#!/usr/bin/env node
/**
 * DalConnect 자동 뉴스 수집 스크립트
 * SearXNG (localhost:8080)로 최신 뉴스 수집 → DB 삽입
 * 
 * 소스: 한겨레, 동아일보, BBC Korea, Korea Herald, Korea JoongAng Daily
 * 카테고리 자동 분류
 */

const pg = require('pg');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

// 뉴스 소스별 검색 쿼리
const NEWS_QUERIES = [
  { q: '한국 뉴스 오늘', category: '한국뉴스' },
  { q: '미국 뉴스 오늘 한국어', category: '미국뉴스' },
  { q: '세계 뉴스 오늘 한국어', category: '월드뉴스' },
  { q: 'K-POP 케이팝 뉴스 오늘', category: 'K-POP' },
  { q: '한국 드라마 영화 뉴스', category: '연예/드라마' },
  { q: '한국 스포츠 뉴스 KBO MLB', category: '스포츠' },
  { q: 'K뷰티 한국 패션 뉴스', category: '패션/뷰티' },
  { q: '달라스 한인 텍사스 뉴스', category: '로컬뉴스' },
];

async function searchNews(query) {
  try {
    const url = `http://localhost:8080/search?q=${encodeURIComponent(query)}&format=json&time_range=day&categories=news`;
    const res = await fetch(url);
    const data = await res.json();
    // Filter results and extract content from available fields
    return (data.results || [])
      .filter(r => r.url && r.title)
      .map(r => ({
        ...r,
        // Use content or fallback to snippet or description
        content: r.content || r.snippet || r.description || r.title
      }))
      .slice(0, 5);
  } catch (e) {
    console.error('Search error:', query, e.message);
    return [];
  }
}

async function insertIfNew(article) {
  try {
    // URL 중복 체크
    const existing = await pool.query('SELECT id FROM news WHERE url = $1', [article.url]);
    if (existing.rows.length > 0) return false;

    await pool.query(
      'INSERT INTO news (title, content, category, source, url, published_date) VALUES ($1, $2, $3, $4, $5, NOW())',
      [article.title, article.content || article.title, article.category, article.source, article.url]
    );
    return true;
  } catch (e) {
    if (!e.message.includes('duplicate')) console.error('Insert error:', e.message);
    return false;
  }
}

function extractSource(url) {
  if (url.includes('hani.co.kr') || url.includes('hankyoreh')) return '한겨레';
  if (url.includes('donga.com')) return '동아일보';
  if (url.includes('chosun.com')) return '조선일보';
  if (url.includes('joongang') || url.includes('joins.com')) return '중앙일보';
  if (url.includes('bbc.com') || url.includes('bbc.co.uk')) return 'BBC';
  if (url.includes('koreaherald')) return 'Korea Herald';
  if (url.includes('yonhap')) return '연합뉴스';
  if (url.includes('kbs.co.kr')) return 'KBS';
  if (url.includes('sbs.co.kr')) return 'SBS';
  if (url.includes('mbc.co.kr')) return 'MBC';
  if (url.includes('nytimes')) return 'New York Times';
  if (url.includes('soompi')) return 'Soompi';
  if (url.includes('allkpop')) return 'allkpop';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'Unknown'; }
}

async function run() {
  console.log(`[${new Date().toISOString()}] 뉴스 자동 수집 시작...`);
  let total = 0;

  for (const nq of NEWS_QUERIES) {
    const results = await searchNews(nq.q);
    for (const r of results) {
      const inserted = await insertIfNew({
        title: r.title,
        content: r.content || r.title,
        category: nq.category,
        source: extractSource(r.url),
        url: r.url,
      });
      if (inserted) {
        console.log(`  ✅ [${nq.category}] ${r.title.substring(0, 50)}`);
        total++;
      }
    }
    await new Promise(r => setTimeout(r, 1000)); // rate limit
  }

  console.log(`[완료] ${total}개 새 기사 추가`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
