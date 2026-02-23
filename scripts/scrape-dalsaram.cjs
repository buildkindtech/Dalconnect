const puppeteer = require('/tmp/node_modules/puppeteer');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

// Map dalsaram categories to our categories
const categoryMap = {
  '한식당': '식당', '떡집': '식당', '반찬(캐더링)': '식당', '베트남식당': '식당',
  '분식/야식/치킨': '식당', '양식당': '식당', '일식당': '식당', '주점/호프': '식당',
  '중식당': '식당', '카페/베이커리': '식당',
  '건강식품/용품': '한인마트', '식품/상가': '한인마트',
  '네일&래쉬': '미용실', '미용/이발': '미용실', '미용재료': '미용실',
  '반영구/두피문신': '미용실', '스킨케어': '미용실', '화장품': '미용실',
  '스파/마사지': '미용실', '쥬얼리': '기타',
  '공인회계사': '법률/회계', '세무사': '법률/회계', '변호사': '법률/회계',
  '보험': '기타', '은행': '기타', '융자/금융/컨설팅': '기타',
  '부동산': '부동산', '아파트임대': '부동산',
  '건축/건설': '기타', '홈인스펙션': '기타',
  '가맹점모집': '기타', '리스/렌트': '자동차', '신차딜러': '자동차',
  '정비/바디샵': '자동차', '중고차딜러': '자동차', '카워시': '자동차',
  '여행사': '기타', '택시': '기타', '호텔/모텔': '기타',
  '가정의학과': '병원', '내과': '병원', '동물병원': '병원', '비만클리닉': '병원',
  '산부인과': '병원', '성형외과': '병원', '소아과': '병원', '심리클리닉': '병원',
  '안경': '병원', '안과/검안과': '병원', '약국': '병원', '언어치료': '병원',
  '이비인후과': '병원', '정형외과': '병원', '종합병원': '병원',
  '치과': '치과', '치과기공소': '치과',
  '카이로프랙틱/물리치료': '병원', '피부과': '병원', '한약방': '병원',
  '한의원': '병원', '홈케어': '병원',
  '개인레슨': '학원', '골프교실/연습장/골프장': '학원', '대학교/ESL': '학원',
  '신학교': '학원', '악기/조율/수리': '학원', '유치원/어린이집/애프터스쿨': '학원',
  '유학원': '학원', '자동차학원': '학원', '태권도/검도': '학원', '튜터': '학원',
  '학교': '학원', '학원(기타)': '학원', '학원(예체능)': '학원',
  '학원(외국어/수학)': '학원', '학원(코딩)': '학원',
  '공공기관': '기타', '언론사': '기타', '주간지/서점': '기타',
  '한국기업 지상사': '기타', '한인교회': '교회', '한인단체': '기타', '한인사찰': '교회',
  'PC방': '기타', 'TV/인터넷': '기타', '극장': '기타',
  '노래방/당구장/탁구장': '기타', '피트니스/헬스장': '기타',
  '이사/운송/택배': '기타', '플러밍': '기타', '에어컨/히터': '기타',
  '페스트컨트롤': '기타', '핸디맨': '기타', '인테리어': '기타',
  '디자인/인쇄/광고': '기타', '디지털마케팅/웹사이트': '기타',
  '전화/핸드폰': '기타', '정수기/비데': '기타', '컴퓨터/IT/Solution': '기타',
};

async function scrapeCategory(page, catUrl, catName) {
  const businesses = [];
  let pageNum = 1;
  
  while (true) {
    const url = pageNum === 1 ? catUrl : `${catUrl}&page=${pageNum}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    } catch(e) {
      break;
    }
    
    const data = await page.evaluate((category) => {
      const results = [];
      const text = document.body.innerText;
      
      // Parse the table structure: 업종 | 업체명 | 주소 | 전화번호
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      let i = 0;
      while (i < lines.length) {
        // Look for lines with phone numbers (xxx-xxx-xxxx pattern)
        const phoneLine = lines[i];
        const phoneMatch = phoneLine.match(/(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/);
        
        if (phoneMatch) {
          // Work backwards to find business info
          // The business entry typically has: category, name, address, phone
          // But in the text they appear in sequence
          
          // Look for the address (contains TX or state abbreviation)  
          let address = null;
          let name = null;
          
          // Search backwards for address and name
          for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            const line = lines[j];
            if (!address && (line.includes('TX') || line.includes('Texas'))) {
              address = line.trim();
            }
          }
          
          results.push({
            phone: phoneMatch[1].replace(/[.()\s]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
            address: address,
            rawContext: lines.slice(Math.max(0, i-4), i+1).join(' | ')
          });
        }
        i++;
      }
      return results;
    }, catName);
    
    if (data.length === 0) break;
    
    // Now get business names more reliably using DOM
    const names = await page.evaluate(() => {
      const rows = [];
      // Look for table rows with business data
      const tds = Array.from(document.querySelectorAll('td'));
      for (const td of tds) {
        const text = td.innerText.trim();
        // Business names are usually in bold or specific styled elements
        const bold = td.querySelector('b, strong, .title');
        if (bold) {
          const name = bold.innerText.trim();
          if (name.length > 1 && name.length < 100 && !name.includes('업종') && !name.includes('전화')) {
            rows.push(name);
          }
        }
      }
      return rows;
    });
    
    // Better: parse full rows
    const fullData = await page.evaluate((catName) => {
      const results = [];
      const bodyText = document.body.innerText;
      
      // Split by the category name pattern that repeats for each entry
      const regex = new RegExp(`${catName}\\s+(.+?)\\s+(\\d+[^\\n]*(?:TX|Texas)[^\\n]*)\\s+([\\d(][-\\d().\\s]+)`, 'g');
      let match;
      while ((match = regex.exec(bodyText)) !== null) {
        results.push({
          name: match[1].trim(),
          address: match[2].trim(),
          phone: match[3].trim()
        });
      }
      
      // Fallback: simpler pattern
      if (results.length === 0) {
        // Parse rows between category labels
        const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);
        let currentName = null;
        let currentAddress = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Skip known non-business lines
          if (line.includes('업종') || line.includes('스폰서') || line.includes('평점') || 
              line.includes('Review') || line.includes('등록/수정') || line.length > 200) continue;
          
          // If line equals the category name, next line is likely business name
          if (line === catName && i + 1 < lines.length) {
            currentName = lines[i + 1];
          }
          
          // Address pattern
          if (line.match(/\d+.*(?:TX|Texas)\s*\d{5}/i) && currentName) {
            currentAddress = line;
          }
          
          // Phone pattern
          const phoneMatch = line.match(/^(\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4})/);
          if (phoneMatch && currentName) {
            results.push({
              name: currentName,
              address: currentAddress,
              phone: phoneMatch[1]
            });
            currentName = null;
            currentAddress = null;
          }
        }
      }
      
      return results;
    }, catName);
    
    businesses.push(...fullData);
    
    // Check if there's a next page
    const hasNext = await page.evaluate((pNum) => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(a => a.href.includes(`page=${pNum}`));
    }, pageNum + 1);
    
    if (!hasNext) break;
    pageNum++;
    await new Promise(r => setTimeout(r, 500));
  }
  
  return businesses;
}

(async () => {
  console.log('=== 달사람닷컴 한인업소록 크롤링 시작 ===\n');
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Get all categories
  await page.goto('https://www.dalsaram.com/shop/main_VER2.php', { waitUntil: 'networkidle2', timeout: 30000 });
  const categories = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="list_VER3.php"]')).map(a => ({
      url: a.href,
      name: a.innerText.trim()
    })).filter(c => c.name.length > 0);
  });
  
  console.log(`총 ${categories.length}개 카테고리 발견\n`);
  
  let allBusinesses = [];
  let totalInserted = 0;
  let totalSkipped = 0;
  
  for (const cat of categories) {
    const ourCategory = categoryMap[cat.name] || '기타';
    console.log(`[${cat.name}] → ${ourCategory} ...`);
    
    const businesses = await scrapeCategory(page, cat.url, cat.name);
    console.log(`  ${businesses.length}개 발견`);
    
    // Insert each business
    for (const biz of businesses) {
      if (!biz.name || biz.name.length < 2) continue;
      
      // Clean phone
      let phone = biz.phone || '';
      phone = phone.replace(/[.()\s]/g, '');
      if (phone.length === 10) phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      
      // Check duplicate
      try {
        const existing = await pool.query(
          "SELECT id FROM businesses WHERE name_ko = $1 OR name_en = $1",
          [biz.name]
        );
        
        if (existing.rowCount > 0) {
          totalSkipped++;
          continue;
        }
        
        await pool.query(`
          INSERT INTO businesses (name_en, name_ko, category, address, phone, rating, review_count, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NULL, 0, NOW(), NOW())
        `, [biz.name, biz.name, ourCategory, biz.address, phone || null]);
        totalInserted++;
      } catch(e) {
        // skip errors
      }
    }
    
    allBusinesses.push(...businesses);
    await new Promise(r => setTimeout(r, 800));
  }
  
  await browser.close();
  
  console.log(`\n=== 완료 ===`);
  console.log(`총 스크래핑: ${allBusinesses.length}`);
  console.log(`DB 추가: ${totalInserted}`);
  console.log(`중복 스킵: ${totalSkipped}`);
  
  // Final stats
  const r = await pool.query('SELECT category, count(*) as cnt FROM businesses GROUP BY category ORDER BY cnt DESC');
  console.log('\n카테고리별:');
  let total = 0;
  r.rows.forEach(b => { console.log(`  ${b.category}: ${b.cnt}`); total += parseInt(b.cnt); });
  console.log(`\n총: ${total}`);
  
  await pool.end();
})();
