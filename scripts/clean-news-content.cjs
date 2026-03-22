/**
 * 기존 뉴스 DB의 content 필드 정리 스크립트
 * 연합뉴스 등에서 들어온 템플릿 코드/저작권문구/JS코드 제거
 */
delete process.env.DATABASE_URL;
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

function cleanContent(text) {
  if (!text) return '';
  return text
    // HTML 태그 제거
    .replace(/<[^>]*>/g, '')
    // HTML 엔티티
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    // Handlebars 템플릿 코드 제거 ({{#if ...}}, {{COUNT_TEXT}} 등)
    .replace(/\{\{[^}]*\}\}/g, '')
    // JavaScript 코드 블록 제거
    .replace(/window\[['"][^\]]+['"]\][^;]*;?/g, '')
    .replace(/\bvar\s+\w+\s*=\s*[^;]+;/g, '')
    // 저작권/크레딧 문구 제거 (연합뉴스 패턴)
    .replace(/<저작권자[^>]*>[^<]*/g, '')
    .replace(/저작권자\([^)]*\)[^\n]*/g, '')
    .replace(/무단\s*(전재|배포|복사)[^\n]*/g, '')
    .replace(/재판매\s*및\s*DB\s*금지/g, '')
    .replace(/AI\s*학습\s*및\s*활용\s*금지/g, '')
    // 카카오톡 제보 안내 제거
    .replace(/제보는\s*카카오톡[^\n]*/g, '')
    // 기자 이름/구독 패턴 제거
    .replace(/[가-힣]+기자\s*(구독\s*구독중)?/g, '')
    .replace(/구독\s*구독중\s*(이전\s*다음\s*이미지\s*확대)?/g, '')
    // 이미지 확대 텍스트
    .replace(/이미지\s*확대/g, '')
    // 마크다운 이스케이프 (Reddit 등)
    .replace(/\[\*{1,3}/g, '[')
    .replace(/\*{1,3}\]/g, ']')
    // 빈 브래킷 제거 [  ] 또는 [ . ] 등
    .replace(/\[\s*\.?\s*\]/g, '')
    // (서울=연합뉴스), (로스앤젤레스=연합뉴스) 등 출처 괄호 제거
    .replace(/\([가-힣a-zA-Z\s]+=연합뉴스\)/g, '')
    // 이전 다음 탐색 텍스트 제거
    .replace(/\b이전\s*다음\b/g, '')
    // 송고 날짜 패턴 제거 (2026/03/22 송고)
    .replace(/\d{4}\/\d{2}\/\d{2}\s*송고/g, '')
    .replace(/\d{4}년\d{2}월\d{2}일\s*\d{2}시\d{2}분\s*송고/g, '')
    // 연속 공백/줄바꿈 정리
    .replace(/\s+/g, ' ')
    .trim();
}

async function cleanNewsContent() {
  console.log('🧹 뉴스 content 정리 시작...\n');

  // 더러운 데이터가 있는 뉴스 가져오기
  const dirtyNews = await sql`
    SELECT id, title, content 
    FROM news 
    WHERE 
      content LIKE '%{{%' OR
      content LIKE '%window[%' OR
      content LIKE '%저작권자%' OR
      content LIKE '%재판매 및 DB%' OR
      content LIKE '%카카오톡%' OR
      content LIKE '%구독중%' OR
      content LIKE '%이미지 확대%' OR
      content LIKE '%AI 학습%'
  `;

  console.log(`🔍 정리 대상: ${dirtyNews.length}개 뉴스\n`);

  let updated = 0;
  for (const item of dirtyNews) {
    const cleaned = cleanContent(item.content);
    if (cleaned !== item.content) {
      await sql`UPDATE news SET content = ${cleaned} WHERE id = ${item.id}`;
      updated++;
      console.log(`✅ 정리: ${item.title?.substring(0, 50)}`);
      console.log(`   전: ${item.content?.substring(0, 100)}...`);
      console.log(`   후: ${cleaned.substring(0, 100)}...`);
      console.log('');
    }
  }

  console.log(`\n🎉 완료! ${updated}개 뉴스 content 정리됨`);
}

cleanNewsContent().catch(console.error);
