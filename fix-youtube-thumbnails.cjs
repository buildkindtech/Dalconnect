delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// YouTube URL에서 비디오 ID 추출
function extractVideoId(url) {
  if (!url) return null;
  
  // https://www.youtube.com/watch?v=VIDEO_ID
  const match1 = url.match(/[?&]v=([^&]+)/);
  if (match1) return match1[1];
  
  // https://youtu.be/VIDEO_ID
  const match2 = url.match(/youtu\.be\/([^?]+)/);
  if (match2) return match2[1];
  
  return null;
}

async function fixThumbnails() {
  console.log('📸 YouTube 썸네일 업데이트 중...\n');
  
  // drama, music, movie, netflix 타입의 모든 차트 가져오기
  const charts = await sql`
    SELECT id, title_ko, youtube_url, thumbnail_url 
    FROM charts 
    WHERE chart_type IN ('drama', 'music', 'movie', 'netflix')
    ORDER BY chart_type, rank
  `;
  
  console.log(`총 ${charts.length}개 차트 확인 중...\n`);
  
  for (const chart of charts) {
    const videoId = extractVideoId(chart.youtube_url);
    
    if (!videoId) {
      console.log(`⚠️  ${chart.title_ko}: YouTube URL 없음 또는 잘못됨`);
      continue;
    }
    
    // YouTube 썸네일 URL 생성 (maxresdefault > hqdefault > mqdefault)
    const newThumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    
    if (chart.thumbnail_url !== newThumbnail) {
      await sql`
        UPDATE charts 
        SET thumbnail_url = ${newThumbnail}
        WHERE id = ${chart.id}
      `;
      console.log(`✅ ${chart.title_ko}`);
      console.log(`   Video ID: ${videoId}`);
      console.log(`   Thumbnail: ${newThumbnail}`);
    } else {
      console.log(`✓  ${chart.title_ko}: 이미 정확함`);
    }
  }
  
  console.log('\n✅ 모든 썸네일 업데이트 완료!');
}

fixThumbnails().catch(console.error);
