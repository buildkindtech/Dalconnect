/**
 * YouTube Mart Content Sync
 * Glass Cart (유리카트) 채널 → DalKonnect Shopping DB
 * 
 * 실행: node scripts/youtube-mart-sync.cjs
 * 크론: 매일 오전 9am
 */

require('dotenv').config();
const { Pool } = require('pg');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// 채널 목록 (나중에 추가 가능)
const CHANNELS = [
  {
    id: 'UCzikZfE3N5Lx3t9xWlh8wUg',
    name: '유리카트',
    store: 'costco', // 주 카테고리
  },
];

// 제목 기반 마트 분류
function classifyStore(title) {
  const t = title.toLowerCase();
  if (t.includes('코스트코') || t.includes('costco')) return 'costco';
  if (t.includes('트레이더 조') || t.includes("trader joe")) return 'traderjoes';
  if (t.includes('heb') || t.includes('에이치이비')) return 'heb';
  if (t.includes('센트럴 마켓') || t.includes('central market')) return 'centralmarket';
  if (t.includes('트레이더스')) return 'costco'; // 트레이더스는 한국 마트지만 코스트코 섹션에
  return 'costco'; // 기본값
}

// 제목에서 아이템 키워드 추출
function extractKeywords(title) {
  // 대괄호, 이모지, 날짜, 세일정보 텍스트 제거
  return title
    .replace(/\[.*?\]/g, '')
    .replace(/\d+\/\d+\([가-힣]\)/g, '')
    .replace(/[😀-🙏🌀-🗿🚀-🛿☀-⛿✀-➿🤀-🧿]/gu, '')
    .replace(/코스트코 (세일정보|신상|신상&세일정보)/g, '')
    .replace(/트레이더스 세일정보/g, '')
    .replace(/세일정보|신상정보/g, '')
    .trim();
}

async function fetchLatestVideos(channelId, maxResults = 10) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.error) {
    console.error('YouTube API error:', data.error.message);
    return [];
  }
  
  return data.items || [];
}

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mart_videos (
      id SERIAL PRIMARY KEY,
      video_id VARCHAR(20) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      title_clean TEXT,
      store VARCHAR(50) NOT NULL,
      channel_name VARCHAR(100),
      thumbnail_url TEXT,
      published_at TIMESTAMP,
      youtube_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ mart_videos 테이블 준비됨');
}

async function syncVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY 없음');
    process.exit(1);
  }
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL 없음');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await ensureTable(pool);

    let totalNew = 0;
    let totalSkipped = 0;

    for (const channel of CHANNELS) {
      console.log(`\n📺 ${channel.name} 채널 동기화 중...`);
      const videos = await fetchLatestVideos(channel.id, 15);
      
      for (const video of videos) {
        const s = video.snippet;
        const videoId = video.id.videoId;
        const store = classifyStore(s.title);
        const titleClean = extractKeywords(s.title);
        const thumbnail = s.thumbnails?.high?.url || s.thumbnails?.default?.url;
        const publishedAt = s.publishedAt || s.publishTime;

        try {
          await pool.query(`
            INSERT INTO mart_videos (video_id, title, title_clean, store, channel_name, thumbnail_url, published_at, youtube_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (video_id) DO UPDATE SET
              title = EXCLUDED.title,
              thumbnail_url = EXCLUDED.thumbnail_url
          `, [
            videoId,
            s.title,
            titleClean,
            store,
            channel.name,
            thumbnail,
            publishedAt,
            `https://www.youtube.com/watch?v=${videoId}`
          ]);

          console.log(`  ✅ [${store}] ${s.title.substring(0, 50)}...`);
          totalNew++;
        } catch (err) {
          console.error(`  ❌ 저장 실패: ${err.message}`);
          totalSkipped++;
        }
      }
    }

    // 최신 10개 출력
    const { rows } = await pool.query(`
      SELECT store, title_clean, published_at::date as date
      FROM mart_videos
      ORDER BY published_at DESC
      LIMIT 10
    `);
    
    console.log('\n📋 최신 영상:');
    rows.forEach(r => console.log(`  [${r.store}] ${r.date} | ${r.title_clean}`));
    console.log(`\n✅ 완료: ${totalNew}개 저장, ${totalSkipped}개 스킵`);

  } finally {
    await pool.end();
  }
}

syncVideos().catch(console.error);
