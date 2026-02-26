delete process.env.DATABASE_URL;

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

const communityData = [
  {
    nickname: '달라스 새내기',
    title: 'Plano 지역 한인 슈퍼 추천 부탁드립니다',
    content: '안녕하세요, 이번 달에 달라스로 이사 왔습니다. Plano 근처에 한국 식재료 살 수 있는 곳 추천해주시면 감사하겠습니다. H-Mart 말고 다른 곳도 있나요?',
    category: '일상',
    tags: ['슈퍼', 'Plano', '식재료', '추천'],
    views: 124,
    likes: 18,
    comment_count: 12
  },
  {
    nickname: '드럼맘',
    title: '어린이 태권도 학원 찾습니다 (Frisco)',
    content: '7살 아들 태권도 배우고 싶어하는데, Frisco 지역에 좋은 태권도장 아시는 분 계신가요? 한국어도 같이 배울 수 있으면 더 좋겠어요.',
    category: '육아',
    tags: ['태권도', 'Frisco', '어린이', '학원'],
    views: 89,
    likes: 15,
    comment_count: 8
  },
  {
    nickname: '맛집탐방러',
    title: 'Koreatown 새로 생긴 삼겹살집 가봤어요!',
    content: '어제 Royal Lane에 새로 생긴 삼겹살집 다녀왔는데 진짜 맛있더라구요. 고기도 두툼하고 밑반찬도 푸짐합니다. 가격은 1인분에 $22였어요. 추천합니다!',
    category: '맛집',
    tags: ['삼겹살', 'Koreatown', '맛집', '후기'],
    views: 256,
    likes: 42,
    comment_count: 23
  },
  {
    nickname: '신혼부부',
    title: 'Richardson 아파트 추천해주세요',
    content: '신혼이라 2베드룸 아파트 찾고 있습니다. Richardson이나 Plano 지역 괜찮은 아파트 커뮤니티 아시는 분 계신가요? 예산은 $1,500~1,800 정도입니다.',
    category: '부동산',
    tags: ['아파트', 'Richardson', 'Plano', '추천'],
    views: 167,
    likes: 14,
    comment_count: 19
  },
  {
    nickname: '자동차보험',
    title: '한인 자동차 보험 에이전트 추천',
    content: '자동차 보험 갱신 시기인데, 한국어로 상담 가능한 에이전트 찾고 있습니다. 가격 합리적인 곳 아시는 분 추천 부탁드려요.',
    category: '생활정보',
    tags: ['보험', '자동차', '에이전트', '추천'],
    views: 143,
    likes: 22,
    comment_count: 16
  },
  {
    nickname: '건강챙기자',
    title: 'Dallas 지역 한인 치과 추천해주세요',
    content: '이가 아파서 치과 가려고 하는데, 한국어 가능한 치과 아시는 분 계신가요? Carrollton이나 Plano 쪽이면 좋겠습니다.',
    category: '의료',
    tags: ['치과', '의료', '추천', 'Plano'],
    views: 98,
    likes: 11,
    comment_count: 7
  },
  {
    nickname: '직장인A',
    title: 'DFW 공항 근처 한식당 추천 부탁드립니다',
    content: '출장으로 DFW 공항 근처에서 식사해야 하는데, 공항에서 가까운 한식당 있나요? 시간이 별로 없어서 빨리 먹을 수 있는 곳이면 좋겠어요.',
    category: '맛집',
    tags: ['DFW', '공항', '한식당', '추천'],
    views: 72,
    likes: 9,
    comment_count: 5
  },
  {
    nickname: '운동러버',
    title: 'Plano 지역 헬스장 정보 공유해요',
    content: '요즘 24 Hour Fitness 다니고 있는데 괜찮은 것 같아요. 한인분들도 많이 보이고, 시설도 깨끗합니다. 혹시 다른 분들은 어디서 운동하시나요?',
    category: '취미',
    tags: ['헬스장', 'Plano', '운동', '정보'],
    views: 134,
    likes: 17,
    comment_count: 13
  },
  {
    nickname: '독서광',
    title: 'Dallas 한국 도서관 정보',
    content: 'Koreatown에 한국 책 빌릴 수 있는 도서관이 있다고 들었는데, 정확한 위치랑 이용 방법 아시는 분 계신가요?',
    category: '문화',
    tags: ['도서관', '한국책', 'Koreatown', '정보'],
    views: 81,
    likes: 13,
    comment_count: 6
  },
  {
    nickname: '이민1년차',
    title: 'SSN 신청 후 얼마나 걸리나요?',
    content: 'SSN 오피스 다녀온지 2주 됐는데 아직도 안 왔어요. 보통 얼마나 걸리나요? 걱정되네요...',
    category: '생활정보',
    tags: ['SSN', '이민', '행정', '질문'],
    views: 203,
    likes: 28,
    comment_count: 21
  },
  {
    nickname: '학부모',
    title: 'Plano ISD vs Frisco ISD 어디가 나은가요?',
    content: '초등학생 자녀가 있는데, 집 구할 때 학군을 고려하고 있습니다. Plano ISD와 Frisco ISD 중 어디가 더 좋은지 경험담 공유해주시면 감사하겠습니다.',
    category: '육아',
    tags: ['학군', 'Plano', 'Frisco', 'ISD'],
    views: 312,
    likes: 45,
    comment_count: 34
  },
  {
    nickname: '커피애호가',
    title: 'Carrollton 카페 추천받습니다',
    content: '조용히 공부할 수 있는 카페 찾고 있어요. Carrollton이나 Lewisville 근처에 분위기 좋은 카페 아시는 분?',
    category: '맛집',
    tags: ['카페', 'Carrollton', '공부', '추천'],
    views: 67,
    likes: 8,
    comment_count: 4
  },
  {
    nickname: '반려동물사랑',
    title: '강아지 미용 어디서 하시나요?',
    content: '말티즈 키우고 있는데, 한국식으로 미용 잘하는 곳 찾고 있습니다. Richardson 지역이면 더 좋겠어요.',
    category: '생활정보',
    tags: ['반려동물', '강아지', '미용', 'Richardson'],
    views: 92,
    likes: 12,
    comment_count: 9
  },
  {
    nickname: 'IT개발자',
    title: 'Dallas 한인 개발자 모임 있나요?',
    content: '소프트웨어 개발자인데, 한인 개발자 네트워킹 모임이나 스터디 그룹 있으면 참여하고 싶습니다. 정보 있으신 분 공유 부탁드려요!',
    category: '취미',
    tags: ['개발자', 'IT', '네트워킹', '모임'],
    views: 178,
    likes: 31,
    comment_count: 15
  },
  {
    nickname: '초보운전',
    title: 'Texas 운전면허 시험 팁 좀 알려주세요',
    content: '다음 주에 운전면허 시험 보러 가는데 긴장되네요. 주의할 점이나 팁 있으면 공유해주시면 감사하겠습니다!',
    category: '생활정보',
    tags: ['운전면허', 'Texas', '시험', '팁'],
    views: 156,
    likes: 24,
    comment_count: 18
  },
  {
    nickname: '등산러버',
    title: 'DFW 근처 등산하기 좋은 곳',
    content: '날씨 좋을 때 가족들과 가볍게 등산하고 싶은데, Dallas 근처에 트레일 추천해주실 분 있나요? 초보자도 갈 수 있는 곳으로요.',
    category: '취미',
    tags: ['등산', 'DFW', '트레일', '추천'],
    views: 119,
    likes: 19,
    comment_count: 11
  },
  {
    nickname: '세금고민',
    title: '한인 세무사 추천 부탁드립니다',
    content: 'Tax season이 다가오는데, 한국어로 상담 가능한 세무사 찾고 있습니다. 경험 있으신 분들 추천 부탁드려요.',
    category: '생활정보',
    tags: ['세무사', '세금', '추천', 'Tax'],
    views: 201,
    likes: 29,
    comment_count: 17
  },
  {
    nickname: '뷰티관심',
    title: 'Plano 한인 미용실 후기',
    content: 'Legacy Dr에 있는 ○○ 미용실 다녀왔는데 컷트랑 염색 너무 마음에 들어요! 원장님이 한국에서 오래 하셨대요. 추천합니다~',
    category: '생활정보',
    tags: ['미용실', 'Plano', '후기', '추천'],
    views: 187,
    likes: 26,
    comment_count: 14
  },
  {
    nickname: '골프초보',
    title: 'Dallas 지역 골프 레슨 받을 만한 곳',
    content: '골프 처음 배우려고 하는데, 한국어로 레슨 해주시는 프로 계신가요? 초보라 기초부터 배우고 싶습니다.',
    category: '취미',
    tags: ['골프', '레슨', 'Dallas', '추천'],
    views: 94,
    likes: 11,
    comment_count: 7
  },
  {
    nickname: '교회찾기',
    title: 'Richardson 근처 한인교회 추천',
    content: '최근에 이사 와서 교회를 찾고 있습니다. Richardson이나 Plano 지역에 젊은 층이 많은 한인교회 추천해주시면 감사하겠습니다.',
    category: '문화',
    tags: ['교회', 'Richardson', 'Plano', '추천'],
    views: 142,
    likes: 16,
    comment_count: 10
  }
];

async function addCommunityPosts() {
  console.log('💬 커뮤니티 포스트 추가 중...\n');
  
  const now = new Date();
  
  for (let i = 0; i < communityData.length; i++) {
    const post = communityData[i];
    const id = `post_${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = `hash_${Math.random().toString(36).substr(2, 20)}`;
    const ipHash = `ip_${Math.random().toString(36).substr(2, 15)}`;
    
    // tags를 JSON 형식으로 변환
    const tags = JSON.stringify(post.tags);
    
    // 생성일 랜덤 (최근 30일 내)
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    await sql`
      INSERT INTO community_posts (
        id, nickname, password_hash, title, content, category,
        tags, views, likes, comment_count, is_pinned,
        ip_hash, created_at, updated_at, city
      ) VALUES (
        ${id}, ${post.nickname}, ${passwordHash}, ${post.title}, ${post.content}, ${post.category},
        ${tags}::json, ${post.views}, ${post.likes}, ${post.comment_count}, false,
        ${ipHash}, ${createdAt.toISOString()}, ${createdAt.toISOString()}, 'Dallas'
      )
    `;
    
    console.log(`✅ ${i + 1}. ${post.title} (${post.category})`);
  }
  
  console.log(`\n✅ 총 ${communityData.length}개 커뮤니티 포스트 추가 완료!`);
}

addCommunityPosts().catch(console.error);
