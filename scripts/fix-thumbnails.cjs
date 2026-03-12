#!/usr/bin/env node
/**
 * 뉴스 썸네일 보충 스크립트
 * thumbnail_url 없는 뉴스 → OG image 추출 시도
 */

const pg = require('pg');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

async function fetchOGImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DalConnect/2.0)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    
    const html = await res.text();
    
    // Try og:image first
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) return ogMatch[1];
    
    // Try twitter:image
    const twMatch = html.match(/<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i);
    if (twMatch) return twMatch[1];
    
    return null;
  } catch (e) {
    return null;
  }
}

async function run() {
  const result = await pool.query(
    "SELECT id, url, title FROM news WHERE (thumbnail_url IS NULL OR thumbnail_url = '') ORDER BY published_date DESC LIMIT 100"
  );
  
  console.log(`[${new Date().toISOString()}] ${result.rows.length}개 뉴스 썸네일 보충 시작...`);
  let fixed = 0;
  let failed = 0;
  
  for (const row of result.rows) {
    const ogImage = await fetchOGImage(row.url);
    
    if (ogImage) {
      await pool.query('UPDATE news SET thumbnail_url = $1 WHERE id = $2', [ogImage, row.id]);
      console.log(`  ✅ ${row.title.substring(0, 50)}`);
      fixed++;
    } else {
      failed++;
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n[완료] ${fixed}개 썸네일 추가, ${failed}개 실패`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
