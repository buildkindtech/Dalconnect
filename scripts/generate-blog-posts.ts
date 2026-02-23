/**
 * 블로그 자동 생성 스크립트
 * 
 * DB 데이터 기반으로 SEO 최적화된 블로그 콘텐츠 자동 생성
 * 예: "달라스 최고의 한식당 TOP 10", "DFW 한인 미용실 완전 가이드" 등
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { businesses, blogs } from '../shared/schema';
import { desc, eq, sql, and, gte } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

// 블로그 템플릿 정의
const BLOG_TEMPLATES = [
  {
    title: 'DFW 한식당 TOP 10 - 달라스에서 꼭 가봐야 할 맛집',
    slug: 'dfw-korean-restaurants-top-10',
    category: '식당',
    businessCategory: 'Korean Restaurant',
    limit: 10,
    excerpt: '달라스-포트워스 지역에서 가장 인기 있는 한식당 10곳을 소개합니다. 평점과 리뷰를 기반으로 선정했습니다.',
    intro: '달라스 한인 타운에서 정통 한식을 맛볼 수 있는 최고의 한식당들을 소개합니다. 모든 업체는 실제 방문자들의 평점과 리뷰를 바탕으로 선정되었습니다.',
  },
  {
    title: 'DFW 한인 미용실 완전 가이드 - 스타일별 추천',
    slug: 'dfw-korean-hair-salons-guide',
    category: '미용',
    businessCategory: '미용실',
    limit: 15,
    excerpt: '달라스 지역 한인 미용실 가이드. 펌, 염색, 커트 전문 미용실을 한눈에!',
    intro: '새로운 헤어스타일을 원하시나요? DFW 지역 최고의 한인 미용실들을 소개합니다. 각 미용실의 전문 분야와 가격대를 확인하세요.',
  },
  {
    title: 'DFW 한인 교회 총정리 - 지역별 교회 안내',
    slug: 'dfw-korean-churches-complete-guide',
    category: '종교',
    businessCategory: '교회',
    limit: 20,
    excerpt: '달라스-포트워스 지역 한인 교회 총정리. 도시별, 교단별 교회 정보를 한눈에!',
    intro: 'DFW 지역에 정착하신 한인 분들을 위한 교회 가이드입니다. 각 지역별로 위치한 한인 교회들을 소개합니다.',
  },
  {
    title: 'DFW 한인 병원 & 의료 서비스 가이드',
    slug: 'dfw-korean-medical-services-guide',
    category: '의료',
    businessCategory: '병원',
    limit: 10,
    excerpt: '한국어가 가능한 달라스 지역 병원과 의료 서비스를 소개합니다.',
    intro: '언어 장벽 없이 진료받을 수 있는 한인 의료 서비스를 찾고 계신가요? DFW 지역의 한인 병원과 한국어 가능 의료 기관들을 소개합니다.',
  },
  {
    title: 'DFW 한인 마트 총정리 - 한국 식재료 쇼핑 가이드',
    slug: 'dfw-korean-grocery-stores-guide',
    category: '쇼핑',
    businessCategory: '한인마트',
    limit: 10,
    excerpt: '달라스에서 한국 식재료를 구매할 수 있는 한인 마트를 소개합니다.',
    intro: '한국 음식이 그립거나 한국 식재료가 필요하신가요? DFW 지역의 한인 마트들을 지역별로 정리했습니다.',
  },
  {
    title: 'DFW 한인 자동차 정비소 & 딜러 가이드',
    slug: 'dfw-korean-auto-services-guide',
    category: '자동차',
    businessCategory: '자동차',
    limit: 10,
    excerpt: '한국어로 소통 가능한 달라스 지역 자동차 정비소와 딜러를 소개합니다.',
    intro: '차량 구매부터 정비까지, 한국어로 편하게 상담받을 수 있는 자동차 관련 업체들을 소개합니다.',
  },
  {
    title: 'DFW 한인 부동산 에이전트 추천 - 내 집 마련 가이드',
    slug: 'dfw-korean-real-estate-agents-guide',
    category: '부동산',
    businessCategory: '부동산',
    limit: 10,
    excerpt: '달라스 지역 한인 부동산 에이전트 추천 및 내 집 마련 팁',
    intro: 'DFW 지역에서 집을 사거나 팔 계획이신가요? 경험 많은 한인 부동산 에이전트들을 소개합니다.',
  },
  {
    title: 'DFW 한인 학원 & 교육 기관 총정리',
    slug: 'dfw-korean-education-centers-guide',
    category: '교육',
    businessCategory: '학원',
    limit: 15,
    excerpt: '자녀 교육을 위한 DFW 지역 한인 학원 정보',
    intro: '자녀의 학업 성취를 돕는 DFW 지역 한인 학원과 교육 기관들을 소개합니다. 영어, 수학, 과학부터 한글, 피아노, 미술까지!',
  },
];

async function generateBlogContent(
  template: typeof BLOG_TEMPLATES[0],
  businessList: any[]
): Promise<string> {
  let content = `# ${template.title}\n\n`;
  content += `${template.intro}\n\n`;
  
  // 통계 섹션
  content += `## 📊 통계 요약\n\n`;
  content += `- **총 ${businessList.length}개 업체**\n`;
  
  const avgRating = businessList
    .filter(b => b.rating && parseFloat(b.rating) > 0)
    .reduce((sum, b) => sum + parseFloat(b.rating || '0'), 0) / 
    businessList.filter(b => b.rating && parseFloat(b.rating) > 0).length;
  
  if (avgRating) {
    content += `- **평균 평점: ${avgRating.toFixed(1)}점**\n`;
  }
  
  const cities = [...new Set(businessList.map(b => b.city).filter(Boolean))];
  content += `- **서비스 지역: ${cities.join(', ')}**\n\n`;
  
  // TOP 업체 리스트
  content += `## 🏆 추천 업체 리스트\n\n`;
  
  businessList.forEach((business, index) => {
    content += `### ${index + 1}. ${business.name_ko || business.name_en}\n\n`;
    
    if (business.rating) {
      content += `⭐ **평점:** ${business.rating}/5.0`;
      if (business.review_count) {
        content += ` (${business.review_count}개 리뷰)`;
      }
      content += `\n\n`;
    }
    
    if (business.address) {
      content += `📍 **주소:** ${business.address}\n\n`;
    }
    
    if (business.phone) {
      content += `📞 **전화:** ${business.phone}\n\n`;
    }
    
    if (business.website) {
      content += `🌐 **웹사이트:** [방문하기](${business.website})\n\n`;
    }
    
    if (business.description) {
      content += `${business.description}\n\n`;
    }
    
    content += `[자세히 보기](/business/${business.id})\n\n`;
    content += `---\n\n`;
  });
  
  // 마무리 섹션
  content += `## 💡 이용 팁\n\n`;
  content += `1. **전화 예약:** 방문 전 전화로 영업 시간을 확인하세요.\n`;
  content += `2. **리뷰 확인:** 최근 리뷰를 읽어보고 선택하세요.\n`;
  content += `3. **주차 정보:** 주차 가능 여부를 미리 확인하시면 편리합니다.\n\n`;
  
  content += `## 📱 DalConnect에서 더 많은 정보 확인\n\n`;
  content += `DalConnect는 DFW 지역 한인 커뮤니티를 위한 종합 정보 플랫폼입니다. `;
  content += `더 많은 업체 정보와 최신 한인 뉴스를 확인하세요!\n\n`;
  content += `[모든 ${template.category} 업체 보기](/businesses?category=${encodeURIComponent(template.businessCategory)})\n`;
  
  return content;
}

async function generateAllBlogs() {
  console.log('🚀 블로그 자동 생성 시작...\n');
  
  let generatedCount = 0;
  let skippedCount = 0;
  
  for (const template of BLOG_TEMPLATES) {
    console.log(`📝 "${template.title}" 생성 중...`);
    
    // 이미 존재하는지 확인
    const existing = await db.select()
      .from(blogs)
      .where(eq(blogs.slug, template.slug))
      .limit(1);
    
    if (existing.length > 0) {
      console.log(`   ⏭️  이미 존재함 (SKIP)\n`);
      skippedCount++;
      continue;
    }
    
    // 해당 카테고리의 업체들 가져오기 (평점 높은 순)
    const businessList = await db.select()
      .from(businesses)
      .where(eq(businesses.category, template.businessCategory))
      .orderBy(desc(sql`CAST(${businesses.rating} AS DECIMAL)`), desc(businesses.review_count))
      .limit(template.limit);
    
    if (businessList.length === 0) {
      console.log(`   ⚠️  업체 데이터 없음 (SKIP)\n`);
      skippedCount++;
      continue;
    }
    
    // 콘텐츠 생성
    const content = await generateBlogContent(template, businessList);
    
    // DB에 저장
    await db.insert(blogs).values({
      title: template.title,
      slug: template.slug,
      content,
      excerpt: template.excerpt,
      category: template.category,
      tags: [template.category, 'DFW', '한인', '가이드'],
      target_age: 'all',
      author: 'DalConnect',
      published_at: new Date(),
    });
    
    console.log(`   ✅ 생성 완료! (${businessList.length}개 업체 포함)\n`);
    generatedCount++;
  }
  
  console.log(`\n🎉 완료!`);
  console.log(`   ✅ 생성: ${generatedCount}개`);
  console.log(`   ⏭️  스킵: ${skippedCount}개`);
  console.log(`   📚 총: ${BLOG_TEMPLATES.length}개 템플릿\n`);
}

// 실행
generateAllBlogs()
  .then(() => {
    console.log('✨ 모든 블로그 생성 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
