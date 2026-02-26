delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 프론트엔드가 기대하는 차트 타입에 맞는 데이터
const chartsData = [
  // Drama charts
  {
    chart_type: 'drama',
    rank: 1,
    title_ko: '눈물의 여왕',
    title_en: 'Queen of Tears',
    artist: '김수현, 김지원',
    platform: 'tvN',
    youtube_url: 'https://www.youtube.com/watch?v=thBXud76OEw',
    thumbnail_url: 'https://i.ytimg.com/vi/thBXud76OEw/maxresdefault.jpg',
    description: 'tvN 토일드라마',
    score: 98.5,
    city: 'Dallas'
  },
  {
    chart_type: 'drama',
    rank: 2,
    title_ko: '선재 업고 튀어',
    title_en: 'Lovely Runner',
    artist: '변우석, 김혜윤',
    platform: 'tvN',
    youtube_url: 'https://www.youtube.com/watch?v=JbS_SW7AzP0',
    thumbnail_url: 'https://i.ytimg.com/vi/JbS_SW7AzP0/maxresdefault.jpg',
    description: '시간여행 로맨스',
    score: 96.2,
    city: 'Dallas'
  },
  {
    chart_type: 'drama',
    rank: 3,
    title_ko: '재벌집 막내아들',
    title_en: 'Reborn Rich',
    artist: '송중기, 신현빈',
    platform: 'JTBC',
    youtube_url: 'https://www.youtube.com/watch?v=9FnF8qjQ8_g',
    thumbnail_url: 'https://i.ytimg.com/vi/9FnF8qjQ8_g/maxresdefault.jpg',
    description: '환생 판타지 드라마',
    score: 95.8,
    city: 'Dallas'
  },
  // Music charts (K-pop)
  {
    chart_type: 'music',
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
    chart_type: 'music',
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
    chart_type: 'music',
    rank: 3,
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
  // Movie charts
  {
    chart_type: 'movie',
    rank: 1,
    title_ko: '범죄도시 4',
    title_en: 'The Roundup: Punishment',
    artist: '마동석, 김무열',
    platform: 'CGV',
    youtube_url: 'https://www.youtube.com/watch?v=HXbfKKfJ0h0',
    thumbnail_url: 'https://i.ytimg.com/vi/HXbfKKfJ0h0/maxresdefault.jpg',
    description: '범죄도시 시리즈 4편',
    score: 97.5,
    city: 'Dallas'
  },
  {
    chart_type: 'movie',
    rank: 2,
    title_ko: '파묘',
    title_en: 'Exhuma',
    artist: '최민식, 김고은',
    platform: 'CGV',
    youtube_url: 'https://www.youtube.com/watch?v=qEvcfYbWkpE',
    thumbnail_url: 'https://i.ytimg.com/vi/qEvcfYbWkpE/maxresdefault.jpg',
    description: '오컬트 미스터리',
    score: 96.8,
    city: 'Dallas'
  },
  {
    chart_type: 'movie',
    rank: 3,
    title_ko: '서울의 봄',
    title_en: 'Seoul Spring',
    artist: '황정민, 정우성',
    platform: 'CGV',
    youtube_url: 'https://www.youtube.com/watch?v=eLbyLnC3L18',
    thumbnail_url: 'https://i.ytimg.com/vi/eLbyLnC3L18/maxresdefault.jpg',
    description: '12.12 군사반란 실화',
    score: 95.2,
    city: 'Dallas'
  },
  // Netflix charts
  {
    chart_type: 'netflix',
    rank: 1,
    title_ko: '오징어 게임',
    title_en: 'Squid Game',
    artist: '이정재, 박해수',
    platform: 'Netflix',
    youtube_url: 'https://www.youtube.com/watch?v=oqxAJKy0ii4',
    thumbnail_url: 'https://i.ytimg.com/vi/oqxAJKy0ii4/maxresdefault.jpg',
    description: '넷플릭스 글로벌 1위',
    score: 99.0,
    city: 'Dallas'
  },
  {
    chart_type: 'netflix',
    rank: 2,
    title_ko: '지옥',
    title_en: 'Hellbound',
    artist: '유아인, 김현주',
    platform: 'Netflix',
    youtube_url: 'https://www.youtube.com/watch?v=cMQpwlQjUeY',
    thumbnail_url: 'https://i.ytimg.com/vi/cMQpwlQjUeY/maxresdefault.jpg',
    description: '초자연 스릴러',
    score: 94.5,
    city: 'Dallas'
  },
  {
    chart_type: 'netflix',
    rank: 3,
    title_ko: 'D.P.',
    title_en: 'D.P.',
    artist: '정해인, 구교환',
    platform: 'Netflix',
    youtube_url: 'https://www.youtube.com/watch?v=4QrLp4hOuAA',
    thumbnail_url: 'https://i.ytimg.com/vi/4QrLp4hOuAA/maxresdefault.jpg',
    description: '군대 탈영병 추적 드라마',
    score: 93.8,
    city: 'Dallas'
  }
];

async function addCorrectCharts() {
  console.log('📺 올바른 차트 타입 데이터 추가 중...\n');
  
  const today = new Date().toISOString();
  
  for (const chart of chartsData) {
    const id = `chart_${chart.chart_type}_${chart.rank}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
    
    console.log(`✅ [${chart.chart_type}] ${chart.rank}. ${chart.title_ko}`);
  }
  
  console.log(`\n✅ 총 ${chartsData.length}개 차트 데이터 추가 완료!`);
  
  // 타입별 개수 확인
  console.log('\n📊 타입별 차트 개수:');
  const counts = await sql`
    SELECT chart_type, COUNT(*) as count 
    FROM charts 
    GROUP BY chart_type
  `;
  counts.forEach(c => console.log(`   - ${c.chart_type}: ${c.count}개`));
}

addCorrectCharts().catch(console.error);
