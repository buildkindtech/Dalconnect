/**
 * 미번역 뉴스 자동 재번역 스위프
 * 크론에서 뉴스 업데이트 후 자동 실행 가능
 * 사용: node scripts/fix-untranslated.cjs [--limit 50]
 */
const { Pool } = require('pg');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '30');

async function translateOne(title, content) {
  const prompt = `뉴스 제목과 내용을 자연스러운 한국어로 번역. 달라스 한인 독자 대상. JSON만 반환: {"title":"한국어제목","content":"한국어내용(3~5문장)"}\n\n제목: ${title}\n내용: ${(content || title).substring(0, 1800)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } }
        }),
        signal: AbortSignal.timeout(20000)
      });
      const d = await res.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const m = text.match(/\{[\s\S]*?\}/);
      if (!m) { await sleep(1000); continue; }
      const parsed = JSON.parse(m[0]);
      if (!parsed.title || !/[\uAC00-\uD7AF]{3,}/.test(parsed.title)) { await sleep(1000); continue; }
      return { title: parsed.title, content: parsed.content || null };
    } catch (e) { await sleep(1500); }
  }
  return null;
}

(async () => {
  // 미번역 기준: 제목에 한글 없거나 내용에 한글 없는 것 (번역 필요 소스만)
  const { rows } = await pool.query(`
    SELECT id, title, content, source FROM news
    WHERE (
      title !~ '[가-힣]{3,}'
      OR content IS NULL
      OR (content !~ '[가-힣]{5,}' AND length(content) < 200)
    )
    AND source IN ('WFAA','NBC DFW','Soompi','ESPN','NerdWallet','BBC World',
                   'Realtor.com','Elle','Motherly','Entrepreneur',
                   'Murthy Law','American Immigration Council','VisaJourney','Fox4 DFW')
    ORDER BY created_at DESC
    LIMIT $1
  `, [LIMIT]);

  if (rows.length === 0) { console.log('✅ 미번역 기사 없음'); await pool.end(); return; }
  console.log(`🔄 미번역 ${rows.length}개 재번역 시작...`);

  let fixed = 0, failed = 0;
  for (const row of rows) {
    const result = await translateOne(row.title, row.content);
    if (result) {
      await pool.query('UPDATE news SET title=$1, content=$2 WHERE id=$3', [result.title, result.content || row.content, row.id]);
      console.log(`✅ ${result.title.substring(0, 50)}`);
      fixed++;
    } else {
      // 번역 실패 → 제목만이라도 한국어로 저장 (삭제 안 함)
      console.log(`⚠️ 번역 실패 유지: ${row.title.substring(0, 50)}`);
      failed++;
    }
    await sleep(600);
  }
  console.log(`\n완료: ✅${fixed} 번역 / 🗑️${failed} 삭제`);
  await pool.end();
})().catch(e => { console.error('❌', e.message); process.exit(1); });
