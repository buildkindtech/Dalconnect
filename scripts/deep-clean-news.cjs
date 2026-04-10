#!/usr/bin/env node
const pg = require('pg');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 2, ssl: { rejectUnauthorized: false } });

function deepClean(text, title) {
  if (!text) return text;
  let c = text;

  // 1. "기사를 읽어드립니다" 마커 → 이후부터 실제 내용 시작
  const ttsMarker = c.indexOf('기사를 읽어드립니다');
  if (ttsMarker >= 0) {
    // 마커 이후 내용에서 첫 번째 의미있는 문장 찾기
    c = c.substring(ttsMarker + '기사를 읽어드립니다'.length);
    // 오디오 플레이어 텍스트 제거
    c = c.replace(/^[^가-힣]*/, '');
  }

  // 2. 오디오 플레이어 찌꺼기
  c = c.replace(/Your browser does not support\s*the\s*audio element\.?\s*[\d:.]*/gi, '');

  // 3. 날짜/수정/등록 패턴
  c = c.replace(/수정\s*\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}/g, '');
  c = c.replace(/등록\s*\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}/g, '');
  c = c.replace(/\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}(:\d{2})?/g, '');

  // 4. 기자 이름 패턴 (이름기자, 이름,이름기자)
  c = c.replace(/[가-힣]{2,4}(,[가-힣]{2,4})*\s*기자/g, '');

  // 5. 한겨레 브레드크럼 (본문으로 시작)
  c = c.replace(/^본문[가-힣\s\/·]*?(?=[가-힣]{10,})/m, '');

  // 6. 광고 텍스트
  c = c.replace(/광고\s*(?=[가-힣])/g, '');
  c = c.replace(/[가-힣가-힣\s]{0,10}제공\s*광고[^가-힣]*?(?=[가-힣])/g, '');

  // 7. 카테고리 반복 (스포츠스포츠 → 스포츠)
  c = c.replace(/([가-힣]{2,6})\1/g, '$1');

  // 8. 영어 찌꺼기
  c = c.replace(/Nation\/World\s*/gi, '');
  c = c.replace(/Local News\s*/gi, '');
  c = c.replace(/Credit:\s*[A-Z][A-Za-z \.]+/g, '');
  c = c.replace(/Author:\s*[A-Z][A-Za-z ,()\.]+/g, '');
  c = c.replace(/\(AP\)/gi, '');

  // 9. 제목이 내용 앞에 반복되는 경우 제거
  if (title && title.length > 10) {
    const titleClean = title.replace(/["""]/g, '').substring(0, 20);
    if (c.startsWith(titleClean) || c.startsWith('"' + titleClean)) {
      // 제목 이후 첫 실제 문장 찾기
      const afterTitle = c.replace(/^[\s\S]{0,100}?(?=[가-힣]{5,}[은는이가을를])/m, '');
      if (afterTitle.length > 50) c = afterTitle;
    }
  }

  // 10. 연속 공백/앞뒤 정리
  c = c.replace(/\s{2,}/g, ' ').trim();

  // 11. 앞에 남은 비한글 정크 제거 (따옴표/숫자/구두점으로 시작하는 경우)
  c = c.replace(/^[^가-힣"'"]{0,30}(?=[가-힣])/, '');

  return c;
}

// JS 코드 오염 여부 체크
function hasJsContamination(text) {
  if (!text) return false;
  const JS_PATTERNS = [
    'window_taboola', 'taboolaQ', 'COUNT_TEXT', 'dable(',
    'createElement', 'HELLOARCHIVE', 'renderWidget',
    'function(', 'var =', '.push(', 'addEventListener',
    'document.', 'window.', '$("#', "$('"
  ];
  return JS_PATTERNS.some(p => text.includes(p));
}

async function run() {
  // JS 코드 오염 기사 먼저 삭제
  const jsDelResult = await pool.query(`
    DELETE FROM news
    WHERE content LIKE '%window_taboola%'
       OR content LIKE '%COUNT_TEXT%'
       OR content LIKE '%taboolaQ%'
       OR content LIKE '%dable(%'
       OR content LIKE '%createElement%'
       OR content LIKE '%HELLOARCHIVE%'
       OR content LIKE '%renderWidget%'
       OR content LIKE '%function(%'
       OR content LIKE '%var %=%'
  `);
  if (jsDelResult.rowCount > 0) {
    console.log(`🗑️ JS 오염 기사 삭제: ${jsDelResult.rowCount}건`);
  }

  const { rows } = await pool.query(`
    SELECT id, title, content FROM news
    WHERE content LIKE '%기사를 읽어드립니다%'
       OR content LIKE '%본문%'
       OR content LIKE '%browser does not support%'
       OR content LIKE '%기자수정%'
       OR content LIKE '%등록 2026%'
       OR content LIKE '%광고%'
       OR content LIKE 'Local News%'
       OR content LIKE 'Nation/World%'
       OR content LIKE 'Credit:%'
    LIMIT 800
  `);

  console.log('정리 대상:', rows.length, '개');
  let done = 0;

  for (const row of rows) {
    const cleaned = deepClean(row.content, row.title);
    if (cleaned !== row.content && cleaned.length > 30) {
      await pool.query('UPDATE news SET content = $1 WHERE id = $2', [cleaned, row.id]);
      done++;
      process.stdout.write('.');
    }
  }
  console.log('\n정리 완료:', done, '개');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
