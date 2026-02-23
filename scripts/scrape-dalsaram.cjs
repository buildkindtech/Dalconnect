const puppeteer = require('/tmp/node_modules/puppeteer');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function scrapePage(page, pageNum) {
  const url = `https://www.dalsaram.com/shop/main_VER2.php?boardgubun=list&code=&page=${pageNum}&i_key=&i_value=&ac=`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  const businesses = await page.evaluate(() => {
    const results = [];
    // Get all table rows that contain business data
    const rows = document.querySelectorAll('table.t_board tr');
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) continue;
      
      const text = row.innerText;
      if (!text || text.includes('업종') || text.includes('스폰서')) continue;
      
      // Extract data from the row text
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;
      
      results.push({ raw: text.substring(0, 500) });
    }
    return results;
  });
  
  return businesses;
}

async function scrapeAll(page) {
  const allBusinesses = [];
  
  // Parse the structured data differently
  for (let pageNum = 1; pageNum <= 20; pageNum++) {
    const url = `https://www.dalsaram.com/shop/main_VER2.php?boardgubun=list&code=&page=${pageNum}&i_key=&i_value=&ac=`;
    console.log(`\nScraping page ${pageNum}...`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const data = await page.evaluate(() => {
      const results = [];
      // Find all business entries - they follow pattern: category, name, address, phone
      const allText = document.body.innerText;
      
      // Look for the sponsor section and regular listings
      const entries = [];
      const tds = document.querySelectorAll('td');
      
      let currentEntry = {};
      for (const td of tds) {
        const text = td.innerText.trim();
        const className = td.className || '';
        
        // Category cells typically have specific class
        if (td.querySelector('a[href*="shop_view"]')) {
          // This is a business name cell
          const nameLink = td.querySelector('a[href*="shop_view"]');
          const name = nameLink ? nameLink.innerText.trim() : '';
          const href = nameLink ? nameLink.href : '';
          if (name && name.length > 1) {
            if (currentEntry.name) {
              entries.push({...currentEntry});
            }
            currentEntry = { name, href };
          }
        }
      }
      if (currentEntry.name) entries.push({...currentEntry});
      
      return entries;
    });
    
    if (data.length === 0) {
      console.log(`  Page ${pageNum}: no data, stopping.`);
      break;
    }
    
    console.log(`  Page ${pageNum}: found ${data.length} entries`);
    allBusinesses.push(...data);
  }
  
  return allBusinesses;
}

// Better approach: extract structured data from the page
async function scrapeStructured(browser) {
  const page = await browser.newPage();
  const allBusinesses = [];
  
  for (let pageNum = 1; pageNum <= 25; pageNum++) {
    const url = `https://www.dalsaram.com/shop/main_VER2.php?boardgubun=list&code=&page=${pageNum}&i_key=&i_value=&ac=`;
    console.log(`Scraping page ${pageNum}...`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch(e) {
      console.log(`  Timeout on page ${pageNum}, retrying...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    
    const businesses = await page.evaluate(() => {
      const results = [];
      // Get the full text and parse it
      const bodyText = document.body.innerText;
      
      // Find all links to shop_view (individual business pages)
      const links = Array.from(document.querySelectorAll('a[href*="shop_view"]'));
      
      for (const link of links) {
        const name = link.innerText.trim();
        if (!name || name.length < 2) continue;
        
        // Get the parent row/container
        let container = link.closest('tr') || link.parentElement?.parentElement;
        if (!container) continue;
        
        const containerText = container.innerText;
        
        // Extract phone - look for pattern like xxx-xxx-xxxx
        const phoneMatch = containerText.match(/(\d{3}[-.)]\s*\d{3}[-.)]\s*\d{4})/);
        const phone = phoneMatch ? phoneMatch[1].replace(/[.)]/g, '-').replace(/\s/g, '') : null;
        
        // Extract address - look for TX pattern
        const addressMatch = containerText.match(/(\d+[^,\n]*(?:TX|Texas)\s*\d{5})/i);
        const address = addressMatch ? addressMatch[1].trim() : null;
        
        // Extract category from sibling or parent
        const prevTd = link.closest('td')?.previousElementSibling;
        const category = prevTd ? prevTd.innerText.trim() : null;
        
        // Extract rating
        const ratingMatch = containerText.match(/평점:\s*([\d.]+)\s*점\s*\((\d+)\s*명\)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
        const reviewCount = ratingMatch ? parseInt(ratingMatch[2]) : 0;
        
        results.push({
          name,
          category: category && category.length < 30 ? category : null,
          address,
          phone,
          rating,
          reviewCount,
          source: 'dalsaram'
        });
      }
      
      return results;
    });
    
    if (businesses.length === 0) {
      console.log(`  No businesses found, stopping.`);
      break;
    }
    
    console.log(`  Found ${businesses.length} businesses`);
    allBusinesses.push(...businesses);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await page.close();
  return allBusinesses;
}

async function insertBusinesses(businesses) {
  let inserted = 0, skipped = 0;
  
  for (const biz of businesses) {
    if (!biz.name) continue;
    
    // Check for duplicate by name
    const existing = await pool.query(
      "SELECT id FROM businesses WHERE name_en = $1 OR name_ko = $1",
      [biz.name]
    );
    
    if (existing.rowCount > 0) {
      skipped++;
      continue;
    }
    
    // Map dalsaram categories to our categories
    const categoryMap = {
      '한식당': '식당', '식당': '식당', '카페/베이커리': '식당', '반찬(캐더링)': '식당',
      '미용/이발': '미용실', '네일': '미용실', '스킨케어': '미용실', '반영구/두피문신': '미용실',
      '한인교회': '교회', '교회': '교회',
      '정비/바디샵': '자동차', '자동차딜러': '자동차',
      '내과': '병원', '치과': '치과', '한의원': '병원', '피부과': '병원', '안과/검안과': '병원',
      '카이로프랙틱/물리치료': '병원', '가정의학과': '병원', '소아과': '병원',
      '부동산': '부동산',
      '변호사': '법률/회계', '공인회계사': '법률/회계', '세무사': '법률/회계',
      '한인마트': '한인마트', '마트': '한인마트',
      '학원(외국어/수학)': '학원', '학원(예체능)': '학원', '학원': '학원',
      '보험': '기타', '융자/금융/컨설팅': '기타', '이사/운송/택배': '기타',
      '플러밍': '기타', '에어컨/히터': '기타', '건축/건설': '기타',
      '피트니스/헬스장': '기타', '스파/마사지': '기타',
      '택시': '기타', '언론사': '기타', '안경': '기타',
      '페스트컨트롤': '기타', '크레딧카드': '기타', '홈인스펙션': '기타',
    };
    
    const category = categoryMap[biz.category] || '기타';
    
    try {
      await pool.query(`
        INSERT INTO businesses (name_en, name_ko, category, address, phone, rating, review_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [biz.name, biz.name, category, biz.address, biz.phone, biz.rating, biz.reviewCount || 0]);
      inserted++;
    } catch(e) {
      console.log(`  Error inserting ${biz.name}: ${e.message}`);
    }
  }
  
  return { inserted, skipped };
}

(async () => {
  console.log('Starting dalsaram.com scraping...\n');
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const businesses = await scrapeStructured(browser);
  await browser.close();
  
  console.log(`\nTotal scraped: ${businesses.length}`);
  console.log('\nSample:');
  businesses.slice(0, 5).forEach(b => console.log(JSON.stringify(b)));
  
  console.log('\nInserting into DB...');
  const { inserted, skipped } = await insertBusinesses(businesses);
  console.log(`\nDone! Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
  
  // Final count
  const r = await pool.query('SELECT category, count(*) as cnt FROM businesses GROUP BY category ORDER BY cnt DESC');
  console.log('\n카테고리별:');
  let total = 0;
  r.rows.forEach(b => { console.log(`  ${b.category}: ${b.cnt}`); total += parseInt(b.cnt); });
  console.log(`\n총: ${total}`);
  
  await pool.end();
})();
