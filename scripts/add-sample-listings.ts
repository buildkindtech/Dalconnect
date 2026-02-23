import { db } from '../server/db';
import { listings } from '../shared/schema';

const sampleListings = [
  {
    title: "삼성 냉장고 팝니다",
    description: "2년 사용한 삼성 프렌치도어 냉장고입니다. 상태 아주 좋고 얼음정수기 포함. 이사 가면서 급하게 판매합니다.",
    price: "300.00",
    price_type: "negotiable",
    category: "가전/가구",
    condition: "good",
    photos: [],
    contact_method: "phone",
    contact_info: "469-555-0123",
    author_name: "김민수",
    author_phone: "469-555-0123",
    location: "Plano",
    status: "active"
  },
  {
    title: "Toyota Camry 2020 저렴하게 팝니다",
    description: "주행거리 35,000 마일. 사고 없음. 정기적으로 정비했고 상태 최상입니다. 새 차 구입으로 판매합니다.",
    price: "15000.00",
    price_type: "fixed",
    category: "자동차",
    condition: "like_new",
    photos: [],
    contact_method: "phone",
    contact_info: "214-555-0198",
    author_name: "이준영",
    author_phone: "214-555-0198",
    location: "Frisco",
    status: "active"
  },
  {
    title: "Plano 원베드 렌트 구함",
    description: "Legacy West 근처 원베드룸 아파트 렌트합니다. $1,200/월. 수영장, 헬스장 포함. 즉시 입주 가능.",
    price: "1200.00",
    price_type: "fixed",
    category: "부동산/렌트",
    condition: null,
    photos: [],
    contact_method: "email",
    contact_info: "rental@example.com",
    author_name: "박지훈",
    author_phone: "972-555-0145",
    location: "Plano",
    status: "active"
  },
  {
    title: "한국어 과외 합니다 (초중고)",
    description: "서울대 국문과 졸업, 미국 거주 10년. 한국어 읽기, 쓰기, 문법 지도합니다. 온라인/방문 수업 가능.",
    price: "40.00",
    price_type: "fixed",
    category: "레슨/과외",
    condition: null,
    photos: [],
    contact_method: "kakao",
    contact_info: "koreantutor2026",
    author_name: "최서연",
    location: "Dallas",
    status: "active"
  },
  {
    title: "무료나눔: 아기옷/장난감",
    description: "생후 0-12개월 아기옷, 장난감 무료로 나눕니다. 상태 좋은 것들만 모았어요. 픽업만 가능합니다.",
    price: null,
    price_type: "free",
    category: "무료나눔",
    condition: "good",
    photos: [],
    contact_method: "message",
    contact_info: "469-555-0167",
    author_name: "정유진",
    location: "Allen",
    status: "active"
  },
  {
    title: "맥북 프로 2022 M2 팝니다",
    description: "맥북 프로 14인치 M2 칩, 16GB RAM, 512GB SSD. 거의 새것이고 AppleCare+ 2025년까지 있습니다.",
    price: "1400.00",
    price_type: "negotiable",
    category: "전자기기",
    condition: "like_new",
    photos: [],
    contact_method: "phone",
    contact_info: "469-555-0189",
    author_name: "한지민",
    location: "Frisco",
    status: "active"
  },
  {
    title: "Ikea 소파 세트 ($800→$250)",
    description: "Ikea 3인용 소파 + 1인용 의자 세트. 회색 패브릭. 깨끗하고 편안합니다. 이사 가면서 급매합니다.",
    price: "250.00",
    price_type: "firm",
    category: "가전/가구",
    condition: "good",
    photos: [],
    contact_method: "phone",
    contact_info: "972-555-0134",
    author_name: "송민호",
    location: "Carrollton",
    status: "active"
  },
  {
    title: "주말 청소 도우미 구합니다",
    description: "주말에 집 청소 도와주실 분 구합니다. 2-3시간, 시간당 $25. Frisco 지역.",
    price: "25.00",
    price_type: "contact",
    category: "서비스",
    condition: null,
    photos: [],
    contact_method: "phone",
    contact_info: "469-555-0178",
    author_name: "강민지",
    location: "Frisco",
    status: "active"
  },
  {
    title: "한인 식당 서버 구인",
    description: "McKinney 한인 식당에서 서버를 구합니다. 주 5일, 저녁 시간대. 영어 소통 가능하신 분 환영. 팁 좋습니다.",
    price: null,
    price_type: "contact",
    category: "구인/구직",
    condition: null,
    photos: [],
    contact_method: "phone",
    contact_info: "214-555-0156",
    author_name: "김철수",
    location: "McKinney",
    status: "active"
  },
  {
    title: "아이폰 15 Pro 128GB",
    description: "티타늄 블루, 완전 새것입니다. 선물 받았는데 다른 폰 쓰고 있어서 판매합니다. 박스 포함.",
    price: "900.00",
    price_type: "negotiable",
    category: "전자기기",
    condition: "new",
    photos: [],
    contact_method: "kakao",
    contact_info: "dallasphone",
    author_name: "이서준",
    location: "Dallas",
    status: "active"
  },
  {
    title: "피아노 레슨 - 초급부터 고급까지",
    description: "줄리어드 음대 졸업. 20년 경력. 어린이부터 성인까지 레벨별 맞춤 레슨. 발표회 기회 제공.",
    price: "60.00",
    price_type: "fixed",
    category: "레슨/과외",
    condition: null,
    photos: [],
    contact_method: "email",
    contact_info: "piano.teacher@email.com",
    author_name: "박예진",
    location: "Plano",
    status: "active"
  },
  {
    title: "무료나눔: 책장 & 스탠딩 책상",
    description: "IKEA 책장 (흰색) 과 스탠딩 책상 무료로 드립니다. 픽업만 가능. Carrollton.",
    price: null,
    price_type: "free",
    category: "무료나눔",
    condition: "fair",
    photos: [],
    contact_method: "message",
    contact_info: "469-555-0101",
    author_name: "윤서현",
    location: "Carrollton",
    status: "active"
  },
  {
    title: "Honda Accord 2019 판매",
    description: "주행 42,000마일. 정기 점검 완료. 클린 타이틀. 가격 협상 가능합니다.",
    price: "13500.00",
    price_type: "negotiable",
    category: "자동차",
    condition: "good",
    photos: [],
    contact_method: "phone",
    contact_info: "972-555-0199",
    author_name: "최동현",
    location: "Irving",
    status: "active"
  },
  {
    title: "정리정돈 & 청소 서비스",
    description: "집 정리정돈과 청소 전문적으로 도와드립니다. 10년 경력. 신뢰할 수 있는 서비스.",
    price: "30.00",
    price_type: "contact",
    category: "서비스",
    condition: null,
    photos: [],
    contact_method: "phone",
    contact_info: "469-555-0188",
    author_name: "김영희",
    location: "Plano",
    status: "active"
  },
  {
    title: "다이슨 무선청소기 V15",
    description: "1년 사용. 배터리 수명 좋음. 모든 악세서리 포함. 정가 $750에서 크게 할인합니다.",
    price: "350.00",
    price_type: "firm",
    category: "가전/가구",
    condition: "like_new",
    photos: [],
    contact_method: "phone",
    contact_info: "214-555-0177",
    author_name: "오지훈",
    location: "Allen",
    status: "active"
  }
];

async function addSampleListings() {
  try {
    console.log('Adding sample listings...');
    
    for (const listing of sampleListings) {
      await db.insert(listings).values(listing);
      console.log(`✓ Added: ${listing.title}`);
    }
    
    console.log(`\n✅ Successfully added ${sampleListings.length} sample listings`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample listings:', error);
    process.exit(1);
  }
}

addSampleListings();
