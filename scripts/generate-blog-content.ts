import { db } from "../server/db";
import { businesses, blogs } from "../shared/schema";
import { sql, desc } from "drizzle-orm";

/**
 * Auto-generate blog content based on top-rated businesses
 */
async function generateBlogContent() {
  console.log('✍️  Generating blog content from top-rated businesses...\n');

  try {
    // Get top restaurants
    const topRestaurants = await db
      .select()
      .from(businesses)
      .where(sql`${businesses.category} LIKE '%Restaurant%' OR ${businesses.category} LIKE '%식당%'`)
      .orderBy(desc(businesses.rating))
      .limit(10);

    // Get top beauty salons
    const topSalons = await db
      .select()
      .from(businesses)
      .where(sql`${businesses.category} LIKE '%미용%' OR ${businesses.category} LIKE '%Beauty%'`)
      .orderBy(desc(businesses.rating))
      .limit(10);

    // Get top medical
    const topMedical = await db
      .select()
      .from(businesses)
      .where(sql`${businesses.category} LIKE '%병원%' OR ${businesses.category} LIKE '%Medical%'`)
      .orderBy(desc(businesses.rating))
      .limit(10);

    const blogPosts = [
      {
        title: '달라스 최고의 한식당 TOP 10 - 맛집 완전 정복',
        slug: 'top-10-korean-restaurants-dallas',
        category: '맛집',
        excerpt: 'DFW 지역에서 꼭 가봐야 할 한식당 베스트 10을 소개합니다. 실제 고객 평점과 리뷰를 바탕으로 선정했습니다.',
        content: generateRestaurantPost(topRestaurants)
      },
      {
        title: 'DFW 한인 미용실 가이드 - 스타일별 추천',
        slug: 'dfw-korean-beauty-salons-guide',
        category: '미용',
        excerpt: '달라스-포트워스 지역 최고의 한인 미용실을 스타일별로 정리했습니다. 커트, 펌, 염색 전문 미용실을 찾아보세요.',
        content: generateBeautyPost(topSalons)
      },
      {
        title: '달라스 한인 병원 & 치과 완벽 가이드',
        slug: 'dallas-korean-medical-guide',
        category: '의료',
        excerpt: 'DFW 지역에서 한국어로 진료받을 수 있는 병원과 치과를 소개합니다. 응급상황부터 정기검진까지 모두 대비하세요.',
        content: generateMedicalPost(topMedical)
      },
      {
        title: '달라스 생활 초보 가이드 - 정착 첫 달 체크리스트',
        slug: 'dallas-newcomer-guide',
        category: '생활',
        excerpt: '달라스에 처음 오셨나요? 정착 초기 꼭 필요한 정보와 체크리스트를 정리했습니다.',
        content: generateNewcomerGuide()
      },
      {
        title: 'DFW 한인 커뮤니티 완전 정복 - 교회, 학원, 마트까지',
        slug: 'dfw-korean-community-guide',
        category: '커뮤니티',
        excerpt: 'DFW 한인 커뮤니티의 모든 것! 교회, 한글학교, 한인마트 등 한인 생활에 필요한 정보를 한눈에.',
        content: generateCommunityGuide()
      }
    ];

    // Insert blog posts
    for (const post of blogPosts) {
      try {
        await db.insert(blogs).values(post).onConflictDoNothing();
        console.log(`✅ Created: ${post.title}`);
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          console.log(`⚠️  Skipped (already exists): ${post.title}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✨ Blog content generation complete!');
    console.log(`📝 Generated ${blogPosts.length} blog posts`);

  } catch (error) {
    console.error('❌ Error generating blog content:', error);
    throw error;
  }
}

function generateRestaurantPost(restaurants: any[]): string {
  let content = `# 달라스 최고의 한식당 TOP 10\n\n`;
  content += `달라스-포트워스 지역에는 훌륭한 한식당들이 많습니다. DalConnect 사용자들의 평점과 리뷰를 바탕으로 선정한 TOP 10 맛집을 소개합니다!\n\n`;
  
  restaurants.forEach((restaurant, index) => {
    content += `## ${index + 1}. ${restaurant.name_ko || restaurant.name_en}\n`;
    content += `**평점**: ⭐ ${restaurant.rating || 'N/A'} (${restaurant.review_count || 0}개 리뷰)\n`;
    content += `**주소**: ${restaurant.address || '정보 없음'}\n`;
    content += `**전화**: ${restaurant.phone || '정보 없음'}\n\n`;
    if (restaurant.description) {
      content += `${restaurant.description}\n\n`;
    }
    content += `---\n\n`;
  });

  content += `## 마치며\n\n`;
  content += `위에 소개한 한식당들은 모두 DalConnect 커뮤니티에서 높은 평가를 받은 곳들입니다. 각 식당마다 특색이 있으니 취향에 맞는 곳을 찾아보세요!\n\n`;
  content += `더 많은 맛집 정보는 [DalConnect 업체 목록](/businesses?category=Korean+Restaurant)에서 확인하실 수 있습니다.`;
  
  return content;
}

function generateBeautyPost(salons: any[]): string {
  let content = `# DFW 한인 미용실 완벽 가이드\n\n`;
  content += `달라스-포트워스 지역의 최고 평점 한인 미용실을 소개합니다. 커트, 펌, 염색 전문가들이 있는 곳!\n\n`;
  
  salons.forEach((salon, index) => {
    content += `## ${index + 1}. ${salon.name_ko || salon.name_en}\n`;
    content += `**평점**: ⭐ ${salon.rating || 'N/A'}\n`;
    content += `**위치**: ${salon.city || 'Dallas'}\n`;
    content += `**주소**: ${salon.address || '정보 없음'}\n`;
    content += `**연락처**: ${salon.phone || '정보 없음'}\n\n`;
    content += `---\n\n`;
  });

  content += `## 미용실 예약 팁\n\n`;
  content += `1. **사전 예약 필수**: 인기 미용실은 1-2주 전에 예약하세요\n`;
  content += `2. **스타일 사진 준비**: 원하는 스타일 사진을 미리 준비하면 소통이 쉬워요\n`;
  content += `3. **첫 방문 상담**: 처음 가는 곳이라면 스타일 상담 시간을 충분히 가지세요\n\n`;
  content += `더 많은 미용실 정보는 [DalConnect에서 확인](/businesses?category=미용실)하세요!`;
  
  return content;
}

function generateMedicalPost(medical: any[]): string {
  let content = `# 달라스 한인 병원 & 치과 가이드\n\n`;
  content += `DFW 지역에서 한국어로 진료받을 수 있는 병원과 치과를 정리했습니다.\n\n`;
  
  content += `## 추천 의료기관\n\n`;
  medical.forEach((place, index) => {
    content += `### ${index + 1}. ${place.name_ko || place.name_en}\n`;
    content += `- **평점**: ⭐ ${place.rating || 'N/A'}\n`;
    content += `- **주소**: ${place.address || '정보 없음'}\n`;
    content += `- **전화**: ${place.phone || '정보 없음'}\n\n`;
  });

  content += `## 의료보험 준비사항\n\n`;
  content += `1. **보험카드 지참**: 진료 전 보험카드를 꼭 가져가세요\n`;
  content += `2. **ID 필수**: 신분증 (운전면허증, 여권 등) 지참\n`;
  content += `3. **예약 확인**: 초진은 예약 필수인 경우가 많습니다\n\n`;
  content += `더 자세한 정보는 [DalConnect 병원 목록](/businesses?category=병원)에서 확인하세요.`;
  
  return content;
}

function generateNewcomerGuide(): string {
  return `# 달라스 생활 초보 가이드

달라스에 처음 오셨나요? 정착 초기 꼭 필요한 정보를 정리했습니다!

## 첫 주 체크리스트

### 1. 주거 관련
- 아파트/집 렌트 계약 확인
- 전기/가스/인터넷 개통
- 우편물 주소 변경

### 2. 교통 관련
- 텍사스 운전면허증 취득 (90일 이내)
- 차량 등록 및 보험 가입
- 톨태그 (TollTag) 신청

### 3. 금융
- 은행 계좌 개설
- 신용카드 신청
- SSN 신청 (해당자)

### 4. 생활 필수
- 한인마트 찾기 (H Mart, 99 Ranch 등)
- 병원/치과 등록
- 휴대폰 개통

## 달라스 생활 팁

### 날씨
- 여름 (6-9월): 매우 덥고 건조 (35-40°C)
- 겨울 (12-2월): 온화하나 가끔 한파
- 봄/가을: 쾌적하고 좋음

### 교통
- 차량 필수 (대중교통 불편)
- 고속도로 톨비 주의
- 러시아워 피하기 (7-9시, 5-7시)

### 쇼핑
- **한인마트**: H Mart (Carrollton), 99 Ranch
- **마트**: Kroger, Tom Thumb, Costco, Target
- **아웃렛**: Allen Premium Outlets

## 한인 커뮤니티

Dallas-Fort Worth 지역에는 약 15만명의 한인이 거주합니다.
- 주요 한인 타운: Carrollton, Plano, Irving
- 한인교회 100개 이상
- 한글학교 20개 이상

더 자세한 정보는 [DalConnect](/businesses)에서 확인하세요!`;
}

function generateCommunityGuide(): string {
  return `# DFW 한인 커뮤니티 완전 정복

Dallas-Fort Worth 한인 커뮤니티의 모든 것을 소개합니다!

## 주요 한인 타운

### Carrollton (캐롤턴)
- **특징**: 최대 한인 밀집 지역
- **한인마트**: H Mart, 99 Ranch Market
- **식당가**: Old Denton Rd 주변
- **교통**: I-35E, 190번 고속도로 인근

### Plano (플라노)
- **특징**: 좋은 학군, 안전한 주거지역
- **한인마트**: H Mart (K Avenue)
- **학원**: 다수의 한글학교 및 학원

### Irving (어빙)
- **특징**: Las Colinas 비즈니스 구역
- **DFW 공항**: 공항 인근, 교통 편리

## 카테고리별 커뮤니티

### 🙏 교회
- Dallas 지역 100개 이상 한인교회
- 다양한 교단 (장로교, 침례교, 감리교 등)
- 영어권 2세 예배 병행

### 📚 교육
- **한글학교**: 20개 이상
- **학원**: 수학, 영어, 음악, 미술
- **대학**: UT Dallas, SMU 한인학생회

### 🛒 쇼핑
- **한인마트**: H Mart, 99 Ranch, Great Wall
- **한인식품점**: 다수
- **아시아 슈퍼마켓**: 체인점 다수

### 🍜 식당
- 한식당 150개 이상
- 분식, 카페, 베이커리 다수
- 프랜차이즈: 본죽, 설빙 등

### 💇 뷰티
- 미용실 60개 이상
- 네일샵, 스킨케어
- 한인 피부과, 성형외과

### 🏥 의료
- 한국어 가능 병원/치과 다수
- 한의원
- 약국

## 한인 이벤트

### 정기 행사
- **DFW Korean Festival** (9월)
- **설날/추석 행사** (각 교회/단체)
- **광복절/개천절 기념식**

### 스포츠
- 한인 축구리그
- 골프 동호회
- 테니스 클럽

## 유용한 정보

### 한인 미디어
- Korea Daily Dallas (중앙일보 달라스)
- The Korea Times Texas
- 각종 카카오톡 커뮤니티

### 온라인 커뮤니티
- **DalConnect** - 업체 정보 및 리뷰
- 카카오톡 오픈채팅
- Facebook 한인 그룹

더 많은 업체 정보는 [DalConnect 업체 목록](/businesses)에서 확인하세요!

## 신규 이민자 팁

1. **한인교회 방문**: 커뮤니티 정보의 보고
2. **한인마트 게시판**: 구인구직, 물품거래 정보
3. **한인 부동산**: 주거 정보, 렌트 팁
4. **맘카페/학부모 모임**: 육아, 교육 정보

DalConnect가 여러분의 DFW 생활을 응원합니다! 🎉`;
}

generateBlogContent().then(() => process.exit(0)).catch(() => process.exit(1));
