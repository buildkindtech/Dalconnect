require('dotenv').config();
const fs = require('fs');
const fetch = (...a) => import('node-fetch').then(({default:f})=>f(...a));
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 });
const envFile = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env','utf8');
const KEY = envFile.match(/GOOGLE_AI_KEY=(.+)/)[1].trim();

async function translate(title, content) {
  const r = await (await fetch)('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+KEY, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ contents:[{ parts:[{ text: '영문 뉴스를 자연스러운 한국어로 번역. JSON만 반환: {"title":"번역제목","content":"번역내용"}\n\n제목: '+title+'\n내용: '+content.substring(0,1400) }] }] })
  });
  const d = await r.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

(async () => {
  const { rows } = await pool.query("SELECT id, title, content FROM news WHERE content !~ '[가-힣]{5,}' AND source IN ('WFAA','NBC DFW','ESPN','Elle','Soompi','BBC World','Realtor.com','NerdWallet') ORDER BY created_at DESC LIMIT 30");
  console.log('대상:', rows.length, '건');
  let done = 0;
  for (const row of rows) {
    const t = await translate(row.title, row.content);
    if (!t || !t.content) continue;
    await pool.query('UPDATE news SET content=$1 WHERE id=$2', [t.content, row.id]);
    console.log('✅', t.title?.substring(0,50) || row.title.substring(0,50));
    done++;
    await new Promise(r => setTimeout(r, 800));
  }
  console.log('\n완료:', done, '건');
  pool.end();
})().catch(e => { console.error(e.message); pool.end(); });
