delete process.env.DATABASE_URL;

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 실제 달라스 한인 중고장터 샘플 데이터
const listingsData = [
  {
    title: '한국 밥솥 (쿠쿠 6인용) 판매',
    description: '쿠쿠 6인용 전기압력밥솥입니다. 작년에 $320에 구매했고, 이사 관계로 급매합니다. 거의 새것처럼 깨끗합니다. Plano에서 직거래 가능합니다.',
    category: '가전제품',
    price: 150.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Plano, TX',
    contact_method: 'text',
    contact_info: '972-555-0101',
    author_name: '김미선',
    author_phone: '972-555-0101',
    photo_url: 'https://images.unsplash.com/photo-1585515320310-259814833265?w=400',
    views: 45
  },
  {
    title: 'IKEA 책상 + 의자 세트',
    description: 'IKEA 책상과 회전 의자 세트입니다. 재택근무용으로 1년 사용했고, 상태 양호합니다. 조립된 상태로 드립니다. Richardson 픽업.',
    category: '가구',
    price: 80.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Richardson, TX',
    contact_method: 'phone',
    contact_info: '469-555-0202',
    author_name: '박준호',
    author_phone: '469-555-0202',
    photo_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
    views: 62
  },
  {
    title: '유아용 카시트 (Graco 4ever)',
    description: 'Graco 4ever 카시트 판매합니다. 신생아부터 10살까지 사용 가능한 제품이고, 사고 이력 없습니다. 청소해서 드립니다. Carrollton 직거래.',
    category: '유아용품',
    price: 120.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Carrollton, TX',
    contact_method: 'kakaotalk',
    contact_info: 'dallas_mom',
    author_name: '이지현',
    author_phone: '214-555-0303',
    photo_url: 'https://images.unsplash.com/photo-1617220379542-a2a3e48e3cdb?w=400',
    views: 38
  },
  {
    title: '김치냉장고 (딤채 소형)',
    description: '딤채 소형 김치냉장고 판매합니다. 한국에서 가져온 제품이고, 110V 변압기 포함입니다. 3년 사용, 상태 좋습니다. Irving 픽업만 가능.',
    category: '가전제품',
    price: 280.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Irving, TX',
    contact_method: 'phone',
    contact_info: '214-555-0404',
    author_name: '최영수',
    author_phone: '214-555-0404',
    photo_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400',
    views: 89
  },
  {
    title: 'Nintendo Switch + 게임 5개',
    description: 'Nintendo Switch 본체 + 마리오카트, 젤다, 동물의숲 등 게임 5개 포함. 1년 반 사용, 스크린 보호필름 부착되어 있습니다. Frisco 직거래.',
    category: '전자제품',
    price: 220.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Frisco, TX',
    contact_method: 'text',
    contact_info: '972-555-0505',
    author_name: '정태윤',
    author_phone: '972-555-0505',
    photo_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400',
    views: 102
  },
  {
    title: '한복 (여아 7세용)',
    description: '여자아이 7세용 한복입니다. 설날에 한 번 입었고, 거의 새것입니다. 분홍색 저고리에 보라색 치마. McKinney 픽업 가능합니다.',
    category: '의류',
    price: 45.00,
    price_type: 'fixed',
    condition: 'like_new',
    location: 'McKinney, TX',
    contact_method: 'kakaotalk',
    contact_info: 'hanbok_mom',
    author_name: '송미라',
    author_phone: '469-555-0606',
    photo_url: 'https://images.unsplash.com/photo-1583486831272-e5b9c9bbd6d0?w=400',
    views: 28
  },
  {
    title: '공기청정기 (Coway Airmega)',
    description: 'Coway Airmega 공기청정기 판매합니다. 작년에 구매했고, 필터 교체 완료했습니다. 30평형 아파트에서 사용했습니다. Allen 직거래.',
    category: '가전제품',
    price: 180.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Allen, TX',
    contact_method: 'phone',
    contact_info: '469-555-0707',
    author_name: '강민석',
    author_phone: '469-555-0707',
    photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
    views: 67
  },
  {
    title: '한국 교과서 세트 (초등 3학년)',
    description: '한국 초등 3학년 국어, 수학, 사회, 과학 교과서 + 익힘책 전부입니다. 자녀 한국어 교육용으로 좋습니다. 거의 사용 안 했습니다. Plano 직거래.',
    category: '도서',
    price: 30.00,
    price_type: 'fixed',
    condition: 'like_new',
    location: 'Plano, TX',
    contact_method: 'text',
    contact_info: '972-555-0808',
    author_name: '윤지영',
    author_phone: '972-555-0808',
    photo_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    views: 41
  },
  {
    title: '바비큐 그릴 (Weber)',
    description: 'Weber 가스 그릴 판매합니다. 3년 사용했고, 청소 잘 해서 사용했습니다. 가스통 포함. Richardson 픽업만 가능합니다.',
    category: '기타',
    price: 150.00,
    price_type: 'negotiable',
    condition: 'used',
    location: 'Richardson, TX',
    contact_method: 'phone',
    contact_info: '214-555-0909',
    author_name: '한동훈',
    author_phone: '214-555-0909',
    photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    views: 53
  },
  {
    title: '아기 침대 + 매트리스',
    description: '아기 침대(crib)와 매트리스 세트입니다. 화이트 색상, IKEA 제품. 2년 사용했고, 사고 이력 없습니다. Carrollton 직거래만 가능.',
    category: '유아용품',
    price: 90.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Carrollton, TX',
    contact_method: 'kakaotalk',
    contact_info: 'baby_stuff',
    author_name: '오수진',
    author_phone: '972-555-1010',
    photo_url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400',
    views: 56
  },
  {
    title: '전자렌지 (삼성 1.1 cu ft)',
    description: '삼성 전자렌지 판매합니다. 1년 반 사용, 작은 크기라서 원룸/스튜디오에 좋습니다. Irving 픽업 가능.',
    category: '가전제품',
    price: 50.00,
    price_type: 'fixed',
    condition: 'used',
    location: 'Irving, TX',
    contact_method: 'phone',
    contact_info: '469-555-1111',
    author_name: '임재현',
    author_phone: '469-555-1111',
    photo_url: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400',
    views: 34
  },
  {
    title: '자전거 (성인용 로드바이크)',
    description: '성인용 로드바이크 판매합니다. Giant 브랜드, 21단 기어, 헬멧 + 자물쇠 포함. Frisco 직거래 가능합니다.',
    category: '스포츠/레저',
    price: 200.00,
    price_type: 'negotiable',
    condition: 'used',
    location: 'Frisco, TX',
    contact_method: 'text',
    contact_info: '972-555-1212',
    author_name: '서준혁',
    author_phone: '972-555-1212',
    photo_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    views: 71
  },
  {
    title: '한국 라면 박스 판매 (20개입)',
    description: '신라면, 짜파게티, 진라면 믹스 20개입 박스 판매합니다. 한국 방문 후 많이 가져와서 팝니다. Plano 직거래.',
    category: '식품',
    price: 25.00,
    price_type: 'fixed',
    condition: 'new',
    location: 'Plano, TX',
    contact_method: 'kakaotalk',
    contact_info: 'ramen_seller',
    author_name: '배서연',
    author_phone: '214-555-1313',
    photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    views: 95
  },
  {
    title: 'MacBook Air 2020 (M1)',
    description: 'MacBook Air M1 2020, 8GB RAM, 256GB SSD. 화면 보호필름 + 케이스 포함. 배터리 상태 92%. Allen 직거래 선호.',
    category: '전자제품',
    price: 650.00,
    price_type: 'negotiable',
    condition: 'used',
    location: 'Allen, TX',
    contact_method: 'phone',
    contact_info: '214-555-1414',
    author_name: '유진우',
    author_phone: '214-555-1414',
    photo_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    views: 128
  },
  {
    title: '피아노 (디지털 키보드 88건반)',
    description: 'Yamaha 디지털 피아노 88건반. 스탠드 + 페달 + 헤드폰 포함. 자녀 레슨용으로 2년 사용. McKinney 픽업만 가능.',
    category: '악기',
    price: 350.00,
    price_type: 'negotiable',
    condition: 'used',
    location: 'McKinney, TX',
    contact_method: 'text',
    contact_info: '469-555-1515',
    author_name: '홍예지',
    author_phone: '469-555-1515',
    photo_url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400',
    views: 82
  }
];

async function addListings() {
  console.log('🛒 중고장터 데이터 추가 중...\n');
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
  
  for (let i = 0; i < listingsData.length; i++) {
    const listing = listingsData[i];
    const id = `listing_${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // photos를 JSON 형식으로 변환
    const photos = JSON.stringify([listing.photo_url]);
    
    await sql`
      INSERT INTO listings (
        id, title, description, price, price_type, category, condition,
        photos, contact_method, contact_info, author_name, author_phone,
        location, status, views, created_at, updated_at, expires_at, city
      ) VALUES (
        ${id}, ${listing.title}, ${listing.description}, ${listing.price}, ${listing.price_type}, ${listing.category}, ${listing.condition},
        ${photos}::json, ${listing.contact_method}, ${listing.contact_info}, ${listing.author_name}, ${listing.author_phone},
        ${listing.location}, 'active', ${listing.views}, ${now.toISOString()}, ${now.toISOString()}, ${expiresAt.toISOString()}, 'Dallas'
      )
    `;
    
    console.log(`✅ ${i + 1}. ${listing.title} ($${listing.price})`);
  }
  
  console.log(`\n✅ 총 ${listingsData.length}개 중고장터 아이템 추가 완료!`);
}

addListings().catch(console.error);
