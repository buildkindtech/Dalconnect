delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function updateCharts() {
  console.log('🔄 기존 차트 삭제 중...\n');
  
  // 기존 drama, music, movie, netflix 타입 차트 삭제
  await sql`DELETE FROM charts WHERE chart_type IN ('drama', 'music', 'movie', 'netflix')`;
  
  console.log('✅ 기존 차트 삭제 완료\n');
  
  // 2026년 2월 기준 최신 차트
  const latestCharts = [
    // 2026 최신 드라마
    {
      chart_type: 'drama',
      rank: 1,
      title_ko: '정신병동에도 아침이 와요',
      title_en: 'Daily Dose of Sunshine',
      artist: '박보영, 윤박',
      platform: 'Netflix',
      youtube_url: 'https://www.youtube.com/watch?v=7dKn-gSYOSU',
      thumbnail_url: 'https://i.ytimg.com/vi/7dKn-gSYOSU/maxresdefault.jpg',
      description: '정신건강의학과 간호사 이야기',
      score: 98.5
    },
    {
      chart_type: 'drama',
      rank: 2,
      title_ko: '무빙',
      title_en: 'Moving',
      artist: '조인성, 한효주, 차태현',
      platform: 'Disney+',
      youtube_url: 'https://www.youtube.com/watch?v=fMnN90Z2KKU',
      thumbnail_url: 'https://i.ytimg.com/vi/fMnN90Z2KKU/maxresdefault.jpg',
      description: '초능력자 가족의 이야기',
      score: 97.8
    },
    {
      chart_type: 'drama',
      rank: 3,
      title_ko: '눈물의 여왕',
      title_en: 'Queen of Tears',
      artist: '김수현, 김지원',
      platform: 'tvN',
      youtube_url: 'https://www.youtube.com/watch?v=thBXud76OEw',
      thumbnail_url: 'https://i.ytimg.com/vi/thBXud76OEw/maxresdefault.jpg',
      description: '재벌가 부부의 위기 극복기',
      score: 96.9
    },
    // 2026 최신 K-pop
    {
      chart_type: 'music',
      rank: 1,
      title_ko: 'APT.',
      title_en: 'APT.',
      artist: 'ROSÉ & Bruno Mars',
      platform: 'YouTube Music',
      youtube_url: 'https://www.youtube.com/watch?v=ekr2nIex040',
      thumbnail_url: 'https://i.ytimg.com/vi/ekr2nIex040/maxresdefault.jpg',
      description: '글로벌 메가 히트',
      score: 99.5
    },
    {
      chart_type: 'music',
      rank: 2,
      title_ko: 'Supernova',
      title_en: 'Supernova',
      artist: 'aespa',
      platform: 'YouTube Music',
      youtube_url: 'https://www.youtube.com/watch?v=phuiiNCxRMg',
      thumbnail_url: 'https://i.ytimg.com/vi/phuiiNCxRMg/maxresdefault.jpg',
      description: 'aespa 대표곡',
      score: 97.2
    },
    {
      chart_type: 'music',
      rank: 3,
      title_ko: 'Love wins all',
      title_en: 'Love wins all',
      artist: 'IU',
      platform: 'YouTube Music',
      youtube_url: 'https://www.youtube.com/watch?v=tId4NPUqi1Y',
      thumbnail_url: 'https://i.ytimg.com/vi/tId4NPUqi1Y/maxresdefault.jpg',
      description: 'IU 감성 발라드',
      score: 96.8
    },
    // 2026 최신 영화
    {
      chart_type: 'movie',
      rank: 1,
      title_ko: '범죄도시 4',
      title_en: 'The Roundup: Punishment',
      artist: '마동석, 김무열',
      platform: '영화관',
      youtube_url: 'https://www.youtube.com/watch?v=HXbfKKfJ0h0',
      thumbnail_url: 'https://i.ytimg.com/vi/HXbfKKfJ0h0/maxresdefault.jpg',
      description: '천만 관객 돌파',
      score: 98.0
    },
    {
      chart_type: 'movie',
      rank: 2,
      title_ko: '파묘',
      title_en: 'Exhuma',
      artist: '최민식, 김고은, 유해진',
      platform: '영화관',
      youtube_url: 'https://www.youtube.com/watch?v=qEvcfYbWkpE',
      thumbnail_url: 'https://i.ytimg.com/vi/qEvcfYbWkpE/maxresdefault.jpg',
      description: '오컬트 스릴러 천만 돌파',
      score: 97.5
    },
    {
      chart_type: 'movie',
      rank: 3,
      title_ko: '하얼빈',
      title_en: 'Harbin',
      artist: '현빈, 박정민',
      platform: '영화관',
      youtube_url: 'https://www.youtube.com/watch?v=8KMzYRFKjM0',
      thumbnail_url: 'https://i.ytimg.com/vi/8KMzYRFKjM0/maxresdefault.jpg',
      description: '안중근 의사 독립운동',
      score: 96.3
    },
    // 2026 넷플릭스 최신
    {
      chart_type: 'netflix',
      rank: 1,
      title_ko: '오징어 게임 시즌 2',
      title_en: 'Squid Game Season 2',
      artist: '이정재, 이병헌, 임시완',
      platform: 'Netflix',
      youtube_url: 'https://www.youtube.com/watch?v=wXBWJkx_IhA',
      thumbnail_url: 'https://i.ytimg.com/vi/wXBWJkx_IhA/maxresdefault.jpg',
      description: '글로벌 넘버원 시리즈',
      score: 99.0
    },
    {
      chart_type: 'netflix',
      rank: 2,
      title_ko: '종이의 집: 공동경제구역',
      title_en: 'Money Heist: Korea',
      artist: '유지태, 박해수',
      platform: 'Netflix',
      youtube_url: 'https://www.youtube.com/watch?v=RWdLhqfdZB0',
      thumbnail_url: 'https://i.ytimg.com/vi/RWdLhqfdZB0/maxresdefault.jpg',
      description: '한국판 종이의 집',
      score: 95.5
    },
    {
      chart_type: 'netflix',
      rank: 3,
      title_ko: '더 글로리',
      title_en: 'The Glory',
      artist: '송혜교, 임지연',
      platform: 'Netflix',
      youtube_url: 'https://www.youtube.com/watch?v=q09HlsPWBFY',
      thumbnail_url: 'https://i.ytimg.com/vi/q09HlsPWBFY/maxresdefault.jpg',
      description: '학폭 복수극',
      score: 94.8
    }
  ];
  
  console.log('📺 최신 차트 추가 중...\n');
  
  const today = new Date().toISOString();
  
  for (const chart of latestCharts) {
    const id = `chart_${chart.chart_type}_${chart.rank}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await sql`
      INSERT INTO charts (
        id, chart_type, rank, title_ko, title_en, artist, 
        platform, youtube_url, thumbnail_url, description, 
        score, chart_date, created_at, city
      ) VALUES (
        ${id}, ${chart.chart_type}, ${chart.rank}, ${chart.title_ko}, ${chart.title_en}, ${chart.artist},
        ${chart.platform}, ${chart.youtube_url}, ${chart.thumbnail_url}, ${chart.description},
        ${chart.score}, ${today}, ${today}, 'Dallas'
      )
    `;
    
    console.log(`✅ [${chart.chart_type}] ${chart.rank}. ${chart.title_ko} - ${chart.artist}`);
  }
  
  console.log(`\n✅ 최신 차트 ${latestCharts.length}개 추가 완료!`);
}

updateCharts().catch(console.error);
