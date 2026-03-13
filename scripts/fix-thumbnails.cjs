const pg = require('pg');
const https = require('https');
const http = require('http');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

function fetchUrl(url, redirects = 3) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return resolve(fetchUrl(loc, redirects - 1));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => { data += c; if (data.length > 50000) res.destroy(); });
      res.on('end', () => resolve(data));
      res.on('error', () => resolve(''));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

async function run() {
  const { rows } = await pool.query("SELECT id, url FROM news WHERE thumbnail_url IS NULL LIMIT 200");
  console.log(`썸네일 없는 기사: ${rows.length}개`);
  let fixed = 0, failed = 0;
  
  for (const row of rows) {
    try {
      const html = await fetchUrl(row.url);
      if (!html) { failed++; continue; }
      // Try og:image first, then twitter:image
      const ogMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
        || html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      
      if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) {
        await pool.query("UPDATE news SET thumbnail_url = $1 WHERE id = $2", [ogMatch[1], row.id]);
        fixed++;
        process.stdout.write(`✅ `);
      } else {
        failed++;
        process.stdout.write(`❌ `);
      }
    } catch(e) { failed++; }
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n\n완료: ${fixed}개 수정, ${failed}개 실패`);
  await pool.end();
}
run();
