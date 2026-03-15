#!/usr/bin/env node
/**
 * 영어 뉴스 정리 + 한국어 번역
 * 1. 찌꺼기 패턴 제거 (앱 광고, 영상 자막 등)
 * 2. Gemini로 한국어 번역
 */
const pg = require('pg');
const fs = require('fs');

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 2, ssl: { rejectUnauthorized: false } });

let GOOGLE_AI_KEY = '';
try {
  const env = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env', 'utf8');
  const m = env.match(/GOOGLE_AI_KEY=(.+)/);
  if (m) GOOGLE_AI_KEY = m[1].trim();
} catch(e) {}
console.log('Gemini:', GOOGLE_AI_KEY ? '✅' : '❌ 없음');

// 제거할 찌꺼기 패턴
const JUNK_PATTERNS = [
  /To stream \w+ on your (phone|mobile)[^.]*\./gi,
  /you need the \w+ app[^.]*\./gi,
  /Download the \w+ app[^.]*\./gi,
  /Next up in \d+ Example video title will go here for this video/gi,
  /More Videos?/gi,
  /Skip Advertisement/gi,
  /Click here to (read|view|watch|subscribe)[^.]*\./gi,
  /Subscribe to [^.]*newsletter[^.]*\./gi,
  /Sign up for [^.]*newsletter[^.]*/gi,
  /\bAuthor:\s*[^\n]+/gi,
  /Published:\s*\d+:\d+\s*(AM|PM)[^\n]+/gi,
  /Updated:\s*\d+:\d+\s*(AM|PM)[^\n]+/gi,
  /Copyright [©℗℗]\s*\d{4}[^.]*\./gi,
  /All rights reserved[^.]*\./gi,
  /Read (more|full story)[^.]*\./gi,
  /\[Read more[^\]]*\]/gi,
  /Advertisement\n?/gi,
];

function cleanJunk(text) {
  if (!text) return text;
  let cleaned = text;
  for (const pat of JUNK_PATTERNS) {
    cleaned = cleaned.replace(pat, ' ');
  }
  // 연속 공백 정리
  cleaned = cleaned.replace(/\s{3,}/g, ' ').trim();
  return cleaned;
}

function isEnglish(text) {
  if (!text) return false;
  const korChars = (text.match(/[가-힣]/g) || []).length;
  const engChars = (text.match(/[A-Za-z]/g) || []).length;
  return engChars > korChars * 2 && engChars > 50;
}

async function translateToKorean(title, content) {
  if (!GOOGLE_AI_KEY) return { title, content };
  try {
    const prompt = `뉴스 제목과 본문을 자연스러운 한국어로 번역해주세요.
- 기사체로 번역 (격식체)
- 고유명사(인명/지명)는 한국어 표기법 적용
- JSON만 반환: {"title":"번역제목","content":"번역내용"}

제목: ${title}
본문: ${content.substring(0, 800)}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { title, content };
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { title, content };
    const parsed = JSON.parse(m[0]);
    return {
      title: parsed.title || title,
      content: parsed.content || content,
    };
  } catch(e) {
    return { title, content };
  }
}

async function run() {
  const LIMIT = parseInt(process.argv[2] || '300');
  
  // 영어 기사 찾기 (한글이 거의 없는 것)
  const { rows } = await pool.query(`
    SELECT id, title, content, source FROM news
    WHERE (
      content ~ '[A-Za-z ]{50,}'
      AND (content !~ '[가-힣]{10,}' OR title !~ '[가-힣]{5,}')
    )
    ORDER BY published_date DESC
    LIMIT $1
  `, [LIMIT]);

  console.log(`\n번역 대상: ${rows.length}개\n`);
  let done = 0, failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // 1. 찌꺼기 정리
    const cleanedContent = cleanJunk(row.content || '');
    const cleanedTitle = cleanJunk(row.title || '');
    
    // 2. 영어면 번역
    const needsTranslation = isEnglish(cleanedContent) || isEnglish(cleanedTitle);
    
    let finalTitle = cleanedTitle;
    let finalContent = cleanedContent;
    
    if (needsTranslation) {
      const translated = await translateToKorean(cleanedTitle, cleanedContent);
      finalTitle = translated.title;
      finalContent = translated.content;
    }
    
    // 변경사항 있으면 업데이트
    if (finalTitle !== row.title || finalContent !== row.content) {
      await pool.query(
        'UPDATE news SET title = $1, content = $2 WHERE id = $3',
        [finalTitle, finalContent, row.id]
      );
      process.stdout.write(needsTranslation ? 'T' : 'C');
      done++;
    } else {
      process.stdout.write('·');
    }
    
    if ((i + 1) % 50 === 0) console.log(` [${i+1}/${rows.length}]`);
    
    // Rate limit
    if (needsTranslation) await new Promise(r => setTimeout(r, 400));
  }
  
  console.log(`\n\n✅ 완료: T(번역)=${done}개, 실패=${failed}개`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
