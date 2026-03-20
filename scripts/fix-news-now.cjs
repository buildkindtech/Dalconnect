require('dotenv').config();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });

function extractTag(xml, tag) {
  const r = new RegExp('<' + tag + '[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/' + tag + '>', 'i');
  const m = xml.match(r); return m ? m[1].trim() : '';
}

async function fetchAndInsert(url, category, source) {
  const res = await fetch(url, { headers:{'User-Agent':'DalKonnect/1.0'}, signal: AbortSignal.timeout(12000) });
  const xml = await res.text();
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m, added = 0;
  while ((m = itemRegex.exec(xml)) !== null) {
    const title = extractTag(m[1], 'title');
    const link = extractTag(m[1], 'link') || extractTag(m[1], 'guid');
    const desc = extractTag(m[1], 'description');
    const imgMatch = m[1].match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png)/i);
    const img = imgMatch ? imgMatch[0] : null;
    if (!title || !link) continue;
    try {
      const ex = await pool.query('SELECT id FROM news WHERE source_url=$1 OR title=$2 LIMIT 1', [link, title]);
      if (ex.rows.length) continue;
      await pool.query(
        'INSERT INTO news (title, content, category, source, source_url, thumbnail_url, published_at, city) VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7)',
        [title, desc || title, category, source, link, img, category === '로컬뉴스' ? 'dallas' : null]
      );
      added++;
    } catch(e) {}
  }
  return added;
}

const SOURCES = [
  { url: 'https://www.wfaa.com/feeds/syndication/rss/news', category: '로컬뉴스', source: 'WFAA' },
  { url: 'https://www.nbcdfw.com/news/feed/', category: '로컬뉴스', source: 'NBC DFW' },
  { url: 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml', category: '한국뉴스', source: '조선일보' },
  { url: 'https://rss.donga.com/total.xml', category: '한국뉴스', source: '동아일보' },
  { url: 'https://www.koreadaily.com/RSS/news.xml', category: '미주뉴스', source: '중앙일보 미주' },
  { url: 'https://rss.joins.com/joins_news_list.xml', category: '한국뉴스', source: '중앙일보' },
];

async function main() {
  let total = 0;
  for (const s of SOURCES) {
    try {
      const n = await fetchAndInsert(s.url, s.category, s.source);
      console.log(s.source + ': +' + n + '개');
      total += n;
    } catch(e) { console.log(s.source + ': 실패 — ' + e.message); }
  }
  console.log('\n✅ 총 추가: ' + total + '개');
  pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
