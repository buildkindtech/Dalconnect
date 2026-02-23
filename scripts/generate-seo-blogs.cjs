/**
 * Auto-generate SEO-optimized blog posts from business database
 * Creates "Top N [Category] in [City]" style guides
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Category mapping: DB category -> Korean name
const CATEGORY_NAMES = {
  restaurants: { ko: '한식당', en: 'Korean Restaurants' },
  'korean-restaurant': { ko: '한식당', en: 'Korean Restaurants' },
  'chinese-restaurant': { ko: '중식당', en: 'Chinese Restaurants' },
  'japanese-restaurant': { ko: '일식당', en: 'Japanese Restaurants' },
  markets: { ko: '마켓', en: 'Korean Markets' },
  'korean-market': { ko: '한인마켓', en: 'Korean Grocery Stores' },
  beauty: { ko: '미용실', en: 'Hair Salons' },
  'hair-salon': { ko: '미용실', en: 'Hair Salons' },
  'nail-salon': { ko: '네일샵', en: 'Nail Salons' },
  health: { ko: '병원', en: 'Medical Clinics' },
  'medical-clinic': { ko: '병원', en: 'Korean Doctors' },
  dentist: { ko: '치과', en: 'Dentists' },
  'oriental-medicine': { ko: '한의원', en: 'Korean Medicine Clinics' },
  professional: { ko: '전문서비스', en: 'Professional Services' },
  'real-estate': { ko: '부동산', en: 'Real Estate Agents' },
  insurance: { ko: '보험', en: 'Insurance Agents' },
  lawyer: { ko: '변호사', en: 'Lawyers' },
  accountant: { ko: '회계사', en: 'Accountants' },
  education: { ko: '학원', en: 'Academies' },
  'korean-school': { ko: '한글학교', en: 'Korean Language Schools' },
  academy: { ko: '학원', en: 'Learning Centers' },
  religion: { ko: '교회', en: 'Churches' },
  church: { ko: '교회', en: 'Korean Churches' },
  temple: { ko: '절', en: 'Buddhist Temples' },
  automotive: { ko: '정비소', en: 'Auto Repair Shops' },
  'auto-repair': { ko: '정비소', en: 'Mechanics' },
  'used-car': { ko: '중고차', en: 'Used Car Dealers' },
  shopping: { ko: '쇼핑', en: 'Shopping' },
  bakery: { ko: '베이커리', en: 'Bakeries' },
  cafe: { ko: '카페', en: 'Cafes' },
  entertainment: { ko: '엔터테인먼트', en: 'Entertainment' },
  karaoke: { ko: '노래방', en: 'Karaoke' },
};

// City data
const CITIES = {
  'Dallas': { ko: '달라스', keywords: ['dallas', '달라스'], description: 'Dallas는 텍사스 북부의 대도시로, 활기찬 한인 커뮤니티가 있습니다.' },
  'Carrollton': { ko: '캐롤턴', keywords: ['carrollton', '캐롤턴'], description: 'Carrollton은 달라스 한인 커뮤니티의 중심지입니다.' },
  'Plano': { ko: '플레이노', keywords: ['plano', '플레이노'], description: 'Plano는 우수한 학군과 안전한 환경으로 한인 가족들에게 인기가 많습니다.' },
  'Irving': { ko: '어빙', keywords: ['irving', '어빙'], description: 'Irving은 DFW 공항 근처에 위치한 편리한 도시입니다.' },
  'Richardson': { ko: '리처드슨', keywords: ['richardson', '리처드슨'], description: 'Richardson은 IT 기업과 한인 전문직 종사자들이 많이 거주합니다.' },
  'Frisco': { ko: '프리스코', keywords: ['frisco', '프리스코'], description: 'Frisco는 빠르게 성장하는 신흥 도시입니다.' },
  'McKinney': { ko: '맥키니', keywords: ['mckinney', '맥키니'], description: 'McKinney는 역사적인 다운타운과 가족 친화적인 환경을 자랑합니다.' },
  'Garland': { ko: '갈랜드', keywords: ['garland', '갈랜드'], description: 'Garland는 다양한 한인 비즈니스가 위치한 도시입니다.' },
};

async function generateBlogs() {
  console.log('📝 Starting SEO blog generation...\n');
  
  try {
    // Get all categories and cities with business counts
    const categoriesQuery = `
      SELECT category, city, COUNT(*) as count
      FROM businesses
      WHERE category IS NOT NULL AND city IS NOT NULL AND city != ''
      GROUP BY category, city
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
    `;
    
    const result = await pool.query(categoriesQuery);
    console.log(`✅ Found ${result.rows.length} category+city combinations\n`);
    
    // Generate blogs for top combinations
    const blogsToGenerate = result.rows.slice(0, 20); // Top 20 combinations
    
    for (const row of blogsToGenerate) {
      const { category, city, count } = row;
      
      // Skip if we don't have metadata for this category/city
      if (!CATEGORY_NAMES[category] || !CITIES[city]) {
        console.log(`⏭️  Skipping ${category} in ${city} (no metadata)`);
        continue;
      }
      
      await generateBlogForCategoryCity(category, city, count);
      
      // Wait a bit to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Blog generation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function generateBlogForCategoryCity(category, city, businessCount) {
  const categoryMeta = CATEGORY_NAMES[category];
  const cityMeta = CITIES[city];
  
  console.log(`📄 Generating blog: ${city} ${categoryMeta.en}...`);
  
  // Check if blog already exists
  const slug = `${city.toLowerCase()}-${category.toLowerCase()}-guide-2026`;
  const existingBlog = await pool.query('SELECT id FROM blogs WHERE slug = $1', [slug]);
  
  if (existingBlog.rows.length > 0) {
    console.log(`   ⏭️  Blog already exists (slug: ${slug})`);
    return;
  }
  
  // Fetch businesses for this category+city
  const topCount = Math.min(15, businessCount);
  const businessesResult = await pool.query(`
    SELECT id, name_en, name_ko, address, phone, description, website, rating, review_count
    FROM businesses
    WHERE category = $1 AND city = $2
    ORDER BY 
      CASE WHEN featured = true THEN 0 ELSE 1 END,
      rating DESC NULLS LAST,
      review_count DESC NULLS LAST
    LIMIT $3
  `, [category, city, topCount]);
  
  const businesses = businessesResult.rows;
  
  // Generate blog content
  const title = `2026년 ${city} ${categoryMeta.ko} 추천 TOP ${businesses.length}`;
  const titleEn = `${city} ${categoryMeta.en} Guide: Top ${businesses.length} in 2026`;
  
  const excerpt = `${city}에서 최고의 ${categoryMeta.ko}을/를 찾고 계신가요? 2026년 현재 ${city} 지역 ${categoryMeta.ko} TOP ${businesses.length}곳을 소개합니다. 주소, 전화번호, 리뷰 등 자세한 정보를 확인하세요.`;
  
  let content = `# ${title}\n\n`;
  content += `*${titleEn}*\n\n`;
  
  // Introduction
  content += `${cityMeta.description} `;
  content += `이 가이드에서는 2026년 현재 ${city}에서 가장 인기 있고 신뢰할 수 있는 ${categoryMeta.ko} ${businesses.length}곳을 소개합니다.\n\n`;
  content += `## ${city} ${categoryMeta.ko} 선택 가이드\n\n`;
  content += generateSelectionTips(category);
  content += `\n\n## TOP ${businesses.length} ${city} ${categoryMeta.ko}\n\n`;
  
  // List businesses
  businesses.forEach((business, index) => {
    content += `### ${index + 1}. ${business.name_ko || business.name_en}\n\n`;
    
    if (business.name_ko && business.name_en) {
      content += `**영문명:** ${business.name_en}\n\n`;
    }
    
    content += `**📍 주소:** ${business.address || 'N/A'}\n\n`;
    content += `**📞 전화:** ${business.phone || 'N/A'}\n\n`;
    
    if (business.rating) {
      content += `**⭐ 평점:** ${business.rating}/5.0`;
      if (business.review_count) {
        content += ` (${business.review_count} reviews)`;
      }
      content += `\n\n`;
    }
    
    if (business.description) {
      content += `${business.description}\n\n`;
    } else {
      content += `${business.name_ko || business.name_en}은/는 ${city} 지역에서 운영 중인 ${categoryMeta.ko}입니다.\n\n`;
    }
    
    if (business.website) {
      content += `**🔗 웹사이트:** [${business.website}](${business.website})\n\n`;
    }
    
    content += `👉 [DalConnect에서 자세히 보기](https://dalconnect.buildkind.tech/business/${business.id})\n\n`;
    content += `---\n\n`;
  });
  
  // Conclusion
  content += `## 결론\n\n`;
  content += `${city}의 ${categoryMeta.ko}들은 각각 독특한 장점과 서비스를 제공합니다. `;
  content += `위에 소개된 업체들은 모두 지역 한인 커뮤니티에서 검증된 곳들입니다.\n\n`;
  content += `더 많은 ${city} 지역 ${categoryMeta.ko} 정보와 리뷰는 [DalConnect](https://dalconnect.buildkind.tech/businesses?category=${category}&city=${encodeURIComponent(city)})에서 확인하세요!\n\n`;
  content += `### 다른 도시의 ${categoryMeta.ko}도 찾아보세요\n\n`;
  content += `- [Dallas ${categoryMeta.ko}](https://dalconnect.buildkind.tech/businesses?category=${category}&city=Dallas)\n`;
  content += `- [Carrollton ${categoryMeta.ko}](https://dalconnect.buildkind.tech/businesses?category=${category}&city=Carrollton)\n`;
  content += `- [Plano ${categoryMeta.ko}](https://dalconnect.buildkind.tech/businesses?category=${category}&city=Plano)\n\n`;
  content += `---\n\n`;
  content += `*이 가이드는 2026년 2월 기준으로 작성되었습니다. 최신 정보는 각 업체에 직접 문의하시기 바랍니다.*\n`;
  
  // Insert into database
  const insertQuery = `
    INSERT INTO blogs (title, slug, content, excerpt, category, tags, published_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING id
  `;
  
  const tags = [
    city.toLowerCase(),
    cityMeta.ko,
    category,
    categoryMeta.ko,
    '2026',
    'guide',
    '추천',
    'top'
  ];
  
  const result = await pool.query(insertQuery, [
    title,
    slug,
    content,
    excerpt,
    category,
    JSON.stringify(tags)
  ]);
  
  console.log(`   ✅ Blog created! ID: ${result.rows[0].id} | Slug: ${slug}`);
}

function generateSelectionTips(category) {
  const tips = {
    'restaurants': `좋은 한식당을 선택할 때는 다음을 고려하세요:
- **메뉴 다양성:** 다양한 한식 메뉴를 제공하는지
- **신선도:** 재료의 신선도와 음식의 맛
- **서비스:** 친절한 서비스와 깨끗한 환경
- **가격:** 가성비가 좋은지
- **위치:** 접근성과 주차 편의`,

    'korean-restaurant': `좋은 한식당을 선택할 때는 다음을 고려하세요:
- **메뉴 다양성:** 다양한 한식 메뉴를 제공하는지
- **신선도:** 재료의 신선도와 음식의 맛
- **서비스:** 친절한 서비스와 깨끗한 환경
- **가격:** 가성비가 좋은지
- **위치:** 접근성과 주차 편의`,

    'markets': `한인 마켓을 선택할 때는:
- **제품 다양성:** 한국 식재료와 생필품의 다양성
- **신선도:** 야채, 고기, 생선의 신선도
- **가격:** 합리적인 가격
- **위치:** 집에서의 거리
- **부가 서비스:** 푸드코트, 베이커리 등`,

    'hair-salon': `미용실을 선택할 때 고려사항:
- **전문성:** 한국식 스타일 전문성
- **경력:** 미용사의 경력과 실력
- **가격:** 합리적인 가격대
- **위생:** 깨끗한 시설
- **예약:** 예약의 편리성`,

    'church': `교회를 선택할 때:
- **교단:** 자신의 신앙관과 맞는 교단인지
- **목회:** 목사님의 설교와 목회 철학
- **프로그램:** 주일학교, 청년부, 장년부 등 프로그램
- **커뮤니티:** 친교와 교제의 분위기
- **위치:** 집에서의 거리`,

    'real-estate': `부동산 에이전트를 선택할 때:
- **경험:** 해당 지역의 시장 이해도
- **실적:** 과거 거래 실적
- **커뮤니케이션:** 한국어 소통 가능 여부
- **평판:** 다른 고객들의 후기
- **전문성:** 매매/렌트 전문 분야`,

    'default': `업체를 선택할 때는:
- **평판:** 커뮤니티 내 평판과 리뷰
- **경험:** 업체의 경력과 전문성
- **가격:** 합리적인 가격
- **서비스:** 고객 서비스 품질
- **위치:** 접근성`
  };
  
  return tips[category] || tips['default'];
}

// Run if called directly
if (require.main === module) {
  generateBlogs();
}

module.exports = { generateBlogs };
