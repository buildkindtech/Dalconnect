const pg = require('pg');
const https = require('https');
const http = require('http');

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

function fetchOgImage(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000 
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchOgImage(res.headers.location).then(resolve);
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { 
        body += chunk;
        if (body.length > 50000) res.destroy(); // Only need head
      });
      res.on('end', () => {
        // Try og:image
        const ogMatch = body.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
          || body.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        if (ogMatch) return resolve(ogMatch[1]);
        
        // Try twitter:image
        const twMatch = body.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
          || body.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
        if (twMatch) return resolve(twMatch[1]);
        
        resolve(null);
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// Fallback images by source
const fallbacks = {
  '한겨레': 'https://www.hani.co.kr/resources/images/hanilogo_sns.png',
  '경향신문': 'https://www.khan.co.kr/static/img/khan_logo_og.jpg',
  'Soompi': 'https://cdn1.soompi.io/wp-content/uploads/2019/10/14070439/Soompi-logo-og.png',
  'ESPN': 'https://a.espncdn.com/combiner/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png&w=600',
  'W Korea': 'https://www.wkorea.com/wp-content/uploads/2023/01/wkorea-og.jpg',
  'Murthy Law': 'https://www.murthy.com/wp-content/uploads/murthy-law-og.png',
  'VisaJourney': 'https://www.visajourney.com/images/vj-og.png',
  'American Immigration Council': 'https://www.americanimmigrationcouncil.org/sites/default/files/aic-og.png',
  '조선일보': 'https://www.chosun.com/resizer/v2/OG_LOGO?auth=abc',
};

async function run() {
  const { rows } = await pool.query(
    "SELECT id, url, source FROM news WHERE thumbnail_url IS NULL OR thumbnail_url = '' ORDER BY published_date DESC"
  );
  console.log(`Found ${rows.length} articles without thumbnails`);
  
  let fixed = 0, fallback = 0, failed = 0;
  
  for (const row of rows) {
    let img = await fetchOgImage(row.url);
    
    if (img) {
      await pool.query('UPDATE news SET thumbnail_url = $1 WHERE id = $2', [img, row.id]);
      fixed++;
      process.stdout.write('✓');
    } else if (fallbacks[row.source]) {
      await pool.query('UPDATE news SET thumbnail_url = $1 WHERE id = $2', [fallbacks[row.source], row.id]);
      fallback++;
      process.stdout.write('◎');
    } else {
      failed++;
      process.stdout.write('✗');
    }
  }
  
  console.log(`\nDone: ${fixed} scraped, ${fallback} fallback, ${failed} failed`);
  pool.end();
}

run().catch(e => { console.error(e); pool.end(); });
