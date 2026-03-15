#!/usr/bin/env node
/**
 * 내용 없는 뉴스 백필 — OG description 긁어서 채우기
 * 실행: node scripts/backfill-news-content.cjs [--limit 100]
 */

const pg = require('pg');
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });

const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3, ssl: { rejectUnauthorized: false } });

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 200;

function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

async function fetchOgDescription(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const matchers = [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{50,})["']/i,
      /<meta[^>]+content=["']([^"']{50,})["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{50,})["']/i,
      /<meta[^>]+content=["']([^"']{50,})["'][^>]+name=["']description["']/i,
    ];
    
    for (const m of matchers) {
      const match = html.match(m);
      if (match && match[1]) return cleanHtml(match[1]).substring(0, 800);
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log(`[${new Date().toISOString()}] 뉴스 백필 시작 (최대 ${LIMIT}개)...`);
  
  // 내용이 없거나 제목과 동일하거나 50자 미만인 뉴스 찾기
  const { rows } = await pool.query(`
    SELECT id, title, url, source FROM news
    WHERE (content IS NULL OR content = '' OR content = title OR length(content) < 50)
    ORDER BY published_date DESC
    LIMIT $1
  `, [LIMIT]);
  
  console.log(`대상: ${rows.length}개`);
  
  let updated = 0, failed = 0;
  
  for (const row of rows) {
    process.stdout.write(`  [${updated + failed + 1}/${rows.length}] ${row.title.substring(0, 50)}... `);
    const desc = await fetchOgDescription(row.url);
    
    if (desc && desc.length >= 50) {
      await pool.query('UPDATE news SET content = $1 WHERE id = $2', [desc, row.id]);
      console.log(`✅ (${desc.length}자)`);
      updated++;
    } else {
      console.log(`❌ (내용 없음)`);
      failed++;
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n[완료] ${updated}개 업데이트, ${failed}개 실패`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
