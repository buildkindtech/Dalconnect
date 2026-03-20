const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GEMINI_KEY = process.env.GOOGLE_AI_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function translate(title, content) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `뉴스 제목과 내용을 자연스러운 한국어로 번역하세요. 반드시 JSON만 반환: {"title":"번역된제목","content":"번역된내용"}\n\n제목: ${title}\n내용: ${(content||'').substring(0, 2000)}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });
  if (!res.ok) throw new Error('API 오류: ' + res.status);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('JSON 파싱 실패');
  return JSON.parse(m[0]);
}

async function main() {
  // content가 null이거나 영어인 뉴스
  const r = await pool.query(`
    SELECT id, title, content FROM news
    WHERE content IS NULL
    OR (content ~ '[a-zA-Z]{20,}' AND content !~ '[가-힣]{5,}')
    ORDER BY created_at DESC
    LIMIT 50
  `);
  console.log(`미번역 ${r.rows.length}개 처리 시작`);

  let ok = 0, fail = 0;
  for (const n of r.rows) {
    try {
      const result = await translate(n.title, n.content || '');
      const newContent = result.content || null;
      const newTitle = result.title || n.title;
      if (newContent && /[\uAC00-\uD7AF]{5,}/.test(newContent)) {
        await pool.query('UPDATE news SET title=$1, content=$2 WHERE id=$3', [newTitle, newContent, n.id]);
        console.log('✅', newTitle.substring(0, 50));
        ok++;
      } else {
        console.log('⚠️ 번역 결과 불량:', n.title.substring(0, 40));
        fail++;
      }
      await sleep(500);
    } catch(e) {
      console.log('❌', n.title.substring(0, 40), '-', e.message);
      fail++;
      await sleep(1000);
    }
  }
  console.log(`\n완료: ✅${ok}개 성공, ❌${fail}개 실패`);
  await pool.end();
}

main().catch(console.error);
