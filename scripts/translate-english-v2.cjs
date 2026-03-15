#!/usr/bin/env node
/**
 * 영어 뉴스 → 한국어 번역 + 찌꺼기 정리 v2
 * gemini-2.5-flash, thinkingBudget:0
 */
const pg = require('pg');
const fs = require('fs');

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 2, ssl: { rejectUnauthorized: false } });

let KEY = '';
try { const e = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env','utf8'); const m = e.match(/GOOGLE_AI_KEY=(.+)/); if(m) KEY=m[1].trim(); } catch(e){}
if (!KEY) { console.error('GOOGLE_AI_KEY 없음'); process.exit(1); }

function decodeEntities(t) {
  return (t||'').replace(/&#x([0-9a-fA-F]+);/g, (_,h)=>String.fromCharCode(parseInt(h,16)))
    .replace(/&#(\d+);/g, (_,d)=>String.fromCharCode(parseInt(d)))
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
}

function cleanJunk(t) {
  let c = decodeEntities(t);
  // WFAA/뉴스 사이트 광고/네비 찌꺼기
  c = c.replace(/To stream \w+ on your[^.]+\./gi,' ');
  c = c.replace(/you need the \w+ app[^.]+\./gi,' ');
  c = c.replace(/Download the \w+ app[^.]+\./gi,' ');
  c = c.replace(/Next up in \d+\s*Example video title[^.]*\./gi,' ');
  c = c.replace(/More Videos?\s*/gi,' ');
  c = c.replace(/Local News\s*/gi,' ');
  c = c.replace(/Nation\/World\s*/gi,' ');
  c = c.replace(/Author:\s*[A-Za-z ,()]+/g,' ');
  c = c.replace(/Published:\s*\d+:\d+[^.\n]*/gi,' ');
  c = c.replace(/Updated:\s*\d+:\d+[^.\n]*/gi,' ');
  c = c.replace(/Credit:\s*[A-Z][A-Za-z ]+/g,' ');
  c = c.replace(/\{[^{}]{0,300}"@type"[^{}]{0,300}\}/g,' ');
  c = c.replace(/org",\s*"@type[^}]*\}/g,' ');
  return c.replace(/\s{2,}/g,' ').trim();
}

async function translate(content) {
  const cleaned = cleanJunk(content);
  if (cleaned.length < 30) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        contents:[{parts:[{text:`다음 영어 뉴스를 자연스러운 한국어 기사체로 번역하세요. 광고/메타데이터 무시. JSON만 반환: {"c":"번역본문"}\n\n${cleaned.substring(0,800)}`}]}],
        generationConfig:{temperature:0.2, maxOutputTokens:1000, thinkingConfig:{thinkingBudget:0}},
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // 코드블록 제거
    const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'');
    const m = clean.match(/\{[\s\S]*?\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    return parsed.c || null;
  } catch(e) { return null; }
}

async function run() {
  const LIMIT = parseInt(process.argv[2] || '300');
  const { rows } = await pool.query(`
    SELECT id, content FROM news 
    WHERE content ~ '[A-Za-z ]{80,}' AND content !~ '[가-힣]{20,}' 
    ORDER BY published_date DESC LIMIT $1
  `, [LIMIT]);
  
  console.log(`번역 대상: ${rows.length}개`);
  let done = 0, fail = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const translated = await translate(row.content);
    if (translated && translated.length > 30) {
      await pool.query('UPDATE news SET content = $1 WHERE id = $2', [translated, row.id]);
      process.stdout.write('T');
      done++;
    } else {
      process.stdout.write('·');
      fail++;
    }
    if ((i+1) % 50 === 0) console.log(` [${i+1}/${rows.length}]`);
    await new Promise(r => setTimeout(r, 400));
  }
  
  console.log(`\n\n✅ 완료: ${done}개 번역, ${fail}개 실패`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
