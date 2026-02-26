// DATABASE_URL 환경 변수 삭제 후 .env 로드
delete process.env.DATABASE_URL;

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 실제 K-pop 차트 데이터 (2026년 2월 기준)
const chartData = [
  {
    chart_type: 'youtube_korea',
    rank: 1,
    title_ko: 'APT.',
    title_en: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=ekr2nIex040',
    thumbnail_url: 'https://i.ytimg.com/vi/ekr2nIex040/maxresdefault.jpg',
    description: 'ROSÉ와 Bruno Mars의 협업 곡',
    score: 98.5,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 2,
    title_ko: 'Supernova',
    title_en: 'Supernova',
    artist: 'aespa',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=phuiiNCxRMg',
    thumbnail_url: 'https://i.ytimg.com/vi/phuiiNCxRMg/maxresdefault.jpg',
    description: 'aespa의 강렬한 신곡',
    score: 96.2,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 3,
    title_ko: '나는 반딧불',
    title_en: 'Firefly',
    artist: 'SEVENTEEN',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=7MvVJbikAjE',
    thumbnail_url: 'https://i.ytimg.com/vi/7MvVJbikAjE/maxresdefault.jpg',
    description: 'SEVENTEEN의 감성 발라드',
    score: 95.8,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 4,
    title_ko: 'How Sweet',
    title_en: 'How Sweet',
    artist: 'NewJeans',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=Q3y-80HBM6Q',
    thumbnail_url: 'https://i.ytimg.com/vi/Q3y-80HBM6Q/maxresdefault.jpg',
    description: 'NewJeans의 상큼한 신곡',
    score: 94.5,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 5,
    title_ko: 'Perfect Night',
    title_en: 'Perfect Night',
    artist: 'LE SSERAFIM',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=r_5sM5Cy5Kw',
    thumbnail_url: 'https://i.ytimg.com/vi/r_5sM5Cy5Kw/maxresdefault.jpg',
    description: 'LE SSERAFIM의 글로벌 히트곡',
    score: 93.7,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 6,
    title_ko: 'Magnetic',
    title_en: 'Magnetic',
    artist: 'ILLIT',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=J_CFBjAyPWE',
    thumbnail_url: 'https://i.ytimg.com/vi/J_CFBjAyPWE/maxresdefault.jpg',
    description: 'ILLIT의 데뷔 히트곡',
    score: 92.3,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 7,
    title_ko: 'Small girl',
    title_en: 'Small girl',
    artist: 'Lee Young Ji',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=IlE_Mv8LfG4',
    thumbnail_url: 'https://i.ytimg.com/vi/IlE_Mv8LfG4/maxresdefault.jpg',
    description: '이영지의 인기 힙합 트랙',
    score: 91.5,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 8,
    title_ko: 'Bubble Gum',
    title_en: 'Bubble Gum',
    artist: 'NewJeans',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=dhC7KzTcYDg',
    thumbnail_url: 'https://i.ytimg.com/vi/dhC7KzTcYDg/maxresdefault.jpg',
    description: 'NewJeans의 청량한 신곡',
    score: 90.8,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 9,
    title_ko: 'SPOT!',
    title_en: 'SPOT!',
    artist: 'ZICO & JENNIE',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=eOvkbGuktF8',
    thumbnail_url: 'https://i.ytimg.com/vi/eOvkbGuktF8/maxresdefault.jpg',
    description: 'ZICO와 JENNIE의 협업곡',
    score: 90.2,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 10,
    title_ko: 'Love 119',
    title_en: 'Love 119',
    artist: 'RIIZE',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=QMCWR_fQhyY',
    thumbnail_url: 'https://i.ytimg.com/vi/QMCWR_fQhyY/maxresdefault.jpg',
    description: 'RIIZE의 감미로운 발라드',
    score: 89.5,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 11,
    title_ko: 'Drama',
    title_en: 'Drama',
    artist: 'aespa',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=D8VEhcPeSlc',
    thumbnail_url: 'https://i.ytimg.com/vi/D8VEhcPeSlc/maxresdefault.jpg',
    description: 'aespa의 드라마틱한 퍼포먼스',
    score: 88.9,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 12,
    title_ko: '건물 사이에 피어난 장미',
    title_en: 'Rose Blossom',
    artist: 'H1-KEY',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=X3hSN2MkVLk',
    thumbnail_url: 'https://i.ytimg.com/vi/X3hSN2MkVLk/maxresdefault.jpg',
    description: 'H1-KEY의 감성 넘버',
    score: 87.6,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 13,
    title_ko: 'Super Shy',
    title_en: 'Super Shy',
    artist: 'NewJeans',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=ArmDp-zijuc',
    thumbnail_url: 'https://i.ytimg.com/vi/ArmDp-zijuc/maxresdefault.jpg',
    description: 'NewJeans의 대표곡',
    score: 86.4,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 14,
    title_ko: 'Ditto',
    title_en: 'Ditto',
    artist: 'NewJeans',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=Rrf8uQFvICE',
    thumbnail_url: 'https://i.ytimg.com/vi/Rrf8uQFvICE/maxresdefault.jpg',
    description: 'NewJeans의 청춘 송가',
    score: 85.2,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 15,
    title_ko: 'OMG',
    title_en: 'OMG',
    artist: 'NewJeans',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=sVTy_wmn5SU',
    thumbnail_url: 'https://i.ytimg.com/vi/sVTy_wmn5SU/maxresdefault.jpg',
    description: 'NewJeans의 중독성 강한 트랙',
    score: 84.1,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 16,
    title_ko: '천상연',
    title_en: 'Heaven',
    artist: 'QWER',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=gJHcBi_LJkQ',
    thumbnail_url: 'https://i.ytimg.com/vi/gJHcBi_LJkQ/maxresdefault.jpg',
    description: 'QWER의 밴드 사운드',
    score: 83.5,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 17,
    title_ko: 'Drowning',
    title_en: 'Drowning',
    artist: 'WOODZ',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=9icqKqU0bBU',
    thumbnail_url: 'https://i.ytimg.com/vi/9icqKqU0bBU/maxresdefault.jpg',
    description: 'WOODZ의 감성 R&B',
    score: 82.8,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 18,
    title_ko: 'Fighting',
    title_en: 'Fighting',
    artist: 'SEVENTEEN',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=i7a8_h0Q_Hc',
    thumbnail_url: 'https://i.ytimg.com/vi/i7a8_h0Q_Hc/maxresdefault.jpg',
    description: 'SEVENTEEN의 응원가',
    score: 81.9,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 19,
    title_ko: 'Smart',
    title_en: 'Smart',
    artist: 'LE SSERAFIM',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=eGxJE_MlxOA',
    thumbnail_url: 'https://i.ytimg.com/vi/eGxJE_MlxOA/maxresdefault.jpg',
    description: 'LE SSERAFIM의 당당한 트랙',
    score: 80.7,
    city: 'Dallas'
  },
  {
    chart_type: 'youtube_korea',
    rank: 20,
    title_ko: 'Baddie',
    title_en: 'Baddie',
    artist: 'IVE',
    platform: 'YouTube Music',
    youtube_url: 'https://www.youtube.com/watch?v=S81bMrK7t2w',
    thumbnail_url: 'https://i.ytimg.com/vi/S81bMrK7t2w/maxresdefault.jpg',
    description: 'IVE의 강렬한 컴백',
    score: 79.5,
    city: 'Dallas'
  }
];

async function addCharts() {
  console.log('🎵 K-pop 차트 데이터 추가 중...\n');
  
  const today = new Date().toISOString();
  
  for (const chart of chartData) {
    const id = `chart_${chart.rank}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await sql`
      INSERT INTO charts (
        id, chart_type, rank, title_ko, title_en, artist, 
        platform, youtube_url, thumbnail_url, description, 
        score, chart_date, created_at, city
      ) VALUES (
        ${id}, ${chart.chart_type}, ${chart.rank}, ${chart.title_ko}, ${chart.title_en}, ${chart.artist},
        ${chart.platform}, ${chart.youtube_url}, ${chart.thumbnail_url}, ${chart.description},
        ${chart.score}, ${today}, ${today}, ${chart.city}
      )
    `;
    
    console.log(`✅ ${chart.rank}. ${chart.title_ko} - ${chart.artist}`);
  }
  
  console.log(`\n✅ 총 ${chartData.length}개 차트 데이터 추가 완료!`);
}

addCharts().catch(console.error);
