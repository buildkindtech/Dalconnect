// Batch translate English news articles in DB → Korean
const pg = require('pg');
const https = require('https');

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false }, max: 3 });

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20');

async function translateToKorean(title, content) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{
        parts: [{
          text: `뉴스 제목과 내용을 자연스러운 한국어로 번역하세요. 반드시 JSON만 반환: {"title":"번역된제목","content":"번역된내용"}\n\n제목: ${title}\n내용: ${(content || '').substring(0, 300)}`
        }]
      }]
    });
    const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const match = text.match(/\{[\s\S]*\}/);
          resolve(match ? JSON.parse(match[0]) : { title, content });
        } catch { resolve({ title, content }); }
      });
    });
    req.on('error', () => resolve({ title, content }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ title, content }); });
    req.write(body);
    req.end();
  });
}

async function run() {
  const { rows } = await pool.query(
    `SELECT id, title, content FROM news WHERE title ~ '[A-Za-z]{5,}' AND title !~ '[가-힣]' LIMIT $1`,
    [BATCH_SIZE]
  );
  if (rows.length === 0) { console.log('번역할 영어 기사 없음'); await pool.end(); return; }
  console.log(`번역 시작: ${rows.length}개`);
  let done = 0;
  for (const row of rows) {
    try {
      const t = await translateToKorean(row.title, row.content);
      if (t.title !== row.title) {
        await pool.query('UPDATE news SET title=$1, content=$2 WHERE id=$3', [t.title, t.content || '', row.id]);
        done++;
        process.stdout.write('.');
      }
    } catch(e) {}
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n✅ ${done}/${rows.length}개 번역 완료`);
  await pool.end();
}
run().catch(e => { console.error(e); process.exit(1); });
