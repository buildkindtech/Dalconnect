const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function cleanContent(content) {
  if (!content) return content;
  let c = content;
  // 오디오 플레이어
  c = c.replace(/Your browser does not support the\s*audio element\.[\s\S]{0,20}?(?=\d|[가-힣])/gi, '');
  c = c.replace(/기사를 읽어드립니다[\s\S]{0,30}?(?=\d{1,2}:\d{2}|[가-힣]{2})/g, '');
  c = c.replace(/\d+:\d+\s*(다음)/g, '');
  // 픽사베이/이미지 크레딧
  c = c.replace(/픽사베이\s*광고?/g, '');
  c = c.replace(/이미지\s*출처\s*[:：]?\s*[^\s]+/g, '');
  // 날짜/기자 헤더 쓰레기
  c = c.replace(/기자\s*수정\s*\d{4}-\d{2}-\d{2}[^가-힣]{0,30}/g, '');
  c = c.replace(/등록\s*\d{4}-\d{2}-\d{2}[^가-힣]{0,30}/g, '');
  // "본문" 프리픽스
  c = c.replace(/^본문\s*/g, '');
  // 광고 텍스트
  c = c.replace(/광고[^\n]{0,50}\n?/g, '');
  // 연속 공백/줄바꿈 정리
  c = c.replace(/\n{3,}/g, '\n\n').trim();
  return c;
}

async function run() {
  // 찌꺼기 패턴 있는 기사들 찾기
  const { rows } = await pool.query(`
    SELECT id, title, content FROM news_articles 
    WHERE content LIKE '%audio element%' 
       OR content LIKE '%픽사베이%'
       OR content LIKE '%기사를 읽어드립니다%'
       OR content LIKE '%기자수정%'
       OR content LIKE '%등록 20%'
    LIMIT 100
  `);
  
  console.log(`찌꺼기 기사 ${rows.length}개 발견`);
  
  let fixed = 0;
  for (const row of rows) {
    const cleaned = cleanContent(row.content);
    if (cleaned !== row.content) {
      await pool.query('UPDATE news_articles SET content=$1 WHERE id=$2', [cleaned, row.id]);
      fixed++;
    }
  }
  console.log(`${fixed}개 정리 완료`);
  await pool.end();
}

run().catch(console.error);
