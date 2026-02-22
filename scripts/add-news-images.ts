/**
 * 뉴스 이미지 추가 스크립트
 * Unsplash API로 카테고리별 관련 이미지 자동 선택
 */

// 카테고리별 Unsplash 이미지 (고정, 고품질)
const CATEGORY_IMAGES: Record<string, string[]> = {
  "한인커뮤니티": [
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=400&fit=crop", // Korean BBQ
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop", // Korean food
    "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=400&fit=crop", // Community
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop", // Korean culture
    "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&h=400&fit=crop"  // K-culture
  ],
  "스포츠": [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop", // Sports stadium
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop", // Football
    "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&h=400&fit=crop", // Basketball
    "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&h=400&fit=crop", // Golf
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=400&fit=crop"  // Sports action
  ],
  "비즈니스": [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop", // Business meeting
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop", // Office building
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=400&fit=crop", // Business person
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop", // Analytics
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop"  // Team work
  ],
  "지역소식": [
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=400&fit=crop", // Dallas skyline
    "https://images.unsplash.com/photo-1583241800698-c5e4d6f5a2c1?w=800&h=400&fit=crop", // City street
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop", // City hall
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=400&fit=crop", // Urban
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=400&fit=crop"  // Buildings
  ]
};

function getRandomImage(category: string): string {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["지역소식"];
  return images[Math.floor(Math.random() * images.length)];
}

// 키워드 기반 매칭 (더 정확한 이미지 선택)
function getSmartImage(title: string, category: string): string {
  const titleLower = title.toLowerCase();
  
  // 스포츠 세부 매칭
  if (category === "스포츠") {
    if (titleLower.includes('cowboys') || titleLower.includes('football') || titleLower.includes('카우보이')) {
      return "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop"; // Football
    }
    if (titleLower.includes('basketball') || titleLower.includes('농구')) {
      return "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&h=400&fit=crop"; // Basketball
    }
    if (titleLower.includes('golf') || titleLower.includes('골프')) {
      return "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&h=400&fit=crop"; // Golf
    }
  }
  
  // 한인커뮤니티 세부 매칭
  if (category === "한인커뮤니티") {
    if (titleLower.includes('bbq') || titleLower.includes('바비큐') || titleLower.includes('고기')) {
      return "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=400&fit=crop"; // Korean BBQ
    }
    if (titleLower.includes('k-pop') || titleLower.includes('케이팝')) {
      return "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&h=400&fit=crop"; // K-culture
    }
  }
  
  // 비즈니스 세부 매칭
  if (category === "비즈니스") {
    if (titleLower.includes('forbes') || titleLower.includes('employer') || titleLower.includes('고용')) {
      return "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=400&fit=crop"; // Business person
    }
  }
  
  // 지역소식 세부 매칭
  if (category === "지역소식") {
    if (titleLower.includes('city hall') || titleLower.includes('시청')) {
      return "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop"; // City hall
    }
    if (titleLower.includes('dallas')) {
      return "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=400&fit=crop"; // Dallas skyline
    }
  }
  
  // 기본: 랜덤
  return getRandomImage(category);
}

console.log("📸 뉴스 이미지 매핑:");
console.log("\n카테고리별 이미지 풀:");

Object.entries(CATEGORY_IMAGES).forEach(([category, images]) => {
  console.log(`\n${category}: ${images.length}개 이미지`);
});

console.log("\n\n✅ 이미지 매핑 완료!");
console.log("\n사용법:");
console.log("  import { getSmartImage } from './add-news-images'");
console.log("  const imageUrl = getSmartImage(newsTitle, newsCategory)");

export { getSmartImage, getRandomImage, CATEGORY_IMAGES };
