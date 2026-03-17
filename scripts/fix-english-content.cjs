require('dotenv').config();
const fs = require('fs');
const pg = require('pg');
const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });

// Google AI Key from workspace .env
let GOOGLE_AI_KEY = '';
try {
  const envFile = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env','utf8');
  const m = envFile.match(/GOOGLE_AI_KEY=(.+)/);
  if (m) GOOGLE_AI_KEY = m[1].trim();
} catch(e) {}

async function translateToKorean(title, content) {
  if (!GOOGLE_AI_KEY) return null;
  try {
    const r = await (await fetch)(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: `다음 영문 뉴스를 자연스러운 한국어로 번역하세요. JSON만 반환: {"title":"번역제목","content":"번역내용"}\n\n제목: ${title}\n내용: ${(content||'').substring(0,1500)}` }] }] })
    });
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return { title: parsed.title, content: parsed.content };
  } catch(e) { return null; }
}

async function main() {
  // 본문에 한글이 없는 영어 기사 찾기
  const { rows } = await pool.query(`
    SELECT id, title, content, source FROM news 
    WHERE content ~ '[a-zA-Z]' 
    AND (content !~ '[가-힣]{5,}' OR title !~ '[가-힣]')
    AND source IN ('WFAA','NBC DFW','ESPN','Elle','Realtor.com','NerdWallet','Murthy Law','American Immigration Council','VisaJourney','Soompi','BBC World')
    ORDER BY created_at DESC LIMIT 50
  `);
  console.log('영어 기사 대상:', rows.length, '건');

  let done = 0;
  for (const row of rows) {
    const isEnglish = !(/[가-힣]{5,}/.test(row.content || ''));
    if (!isEnglish) continue;
    
    const translated = await translateToKorean(row.title, row.content);
    if (!translated) continue;
    
    await pool.query('UPDATE news SET title=$1, content=$2 WHERE id=$3', [translated.title, translated.content, row.id]);
    console.log('✅', translated.title.substring(0,50));
    done++;
    await new Promise(r => setTimeout(r, 500)); // rate limit
  }
  console.log('\n번역 완료:', done, '건');
  pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
