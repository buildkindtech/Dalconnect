#!/usr/bin/env node
/**
 * 뉴스 AI 요약 엔진 v1
 * 
 * 1단계: 기사 페이지에서 본문 직접 추출 시도
 * 2단계: 실패 시 Gemini Flash로 3-4문장 한국어 요약 생성
 * 
 * 실행: node scripts/enrich-news-ai.cjs [--limit=100] [--batch=20]
 */

const pg = require('pg');
const fs = require('fs');

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3, ssl: { rejectUnauthorized: false } });

// Gemini API key
let GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';
if (!GOOGLE_AI_KEY) {
  try {
    const envFile = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env', 'utf8');
    const m = envFile.match(/GOOGLE_AI_KEY=(.+)/);
    if (m) GOOGLE_AI_KEY = m[1].trim();
  } catch(e) {}
}
console.log('Gemini API:', GOOGLE_AI_KEY ? '✅ 로드됨' : '❌ 없음 (본문 추출만 사용)');

const args = process.argv.slice(2);
const LIMIT = parseInt((args.find(a => a.startsWith('--limit=')) || '--limit=200').split('=')[1]);
const BATCH = parseInt((args.find(a => a.startsWith('--batch=')) || '--batch=20').split('=')[1]);
const AI_ONLY = args.includes('--ai-only'); // AI 요약만 사용 (스크래이핑 스킵)

function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

// 기사 본문 추출 — 한국/영어 뉴스 사이트 공통 셀렉터
function extractArticleBody(html) {
  if (!html) return null;
  
  // 주요 기사 본문 패턴들
  const bodyPatterns = [
    // 공통 article 태그
    /<article[^>]*>([\s\S]{200,}?)<\/article>/i,
    // 한국 뉴스 사이트들
    /<div[^>]+class="[^"]*(?:article-body|article_body|articleBody|article-content|article_content|news-content|news_content|entry-content|post-content|cont_view|news_view|view_cont|article_txt)[^"]*"[^>]*>([\s\S]{200,}?)<\/div>/i,
    // 연합뉴스, 한겨레 등
    /<div[^>]+id="[^"]*(?:article-view-content-div|articleBody|article_txt|newsct_article)[^"]*"[^>]*>([\s\S]{200,}?)<\/div>/i,
    // 조선/동아 계열
    /<div[^>]+class="[^"]*(?:par|article_par|news_cont|story_body|story-body|article__body)[^"]*"[^>]*>([\s\S]{200,}?)<\/div>/i,
  ];
  
  for (const pattern of bodyPatterns) {
    const match = html.match(pattern);
    if (match) {
      const text = cleanHtml(match[1]);
      if (text.length > 150) return text.substring(0, 2000);
    }
  }
  
  // 마지막 폴백: <p> 태그 모아서 200자 이상이면 사용
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]{20,}?)<\/p>/gi;
  let m;
  while ((m = pRegex.exec(html)) !== null && paragraphs.length < 10) {
    const t = cleanHtml(m[1]);
    if (t.length > 20 && !t.includes('function') && !t.includes('var ') && !t.includes('copyright')) {
      paragraphs.push(t);
    }
  }
  const combined = paragraphs.join(' ');
  if (combined.length > 150) return combined.substring(0, 2000);
  
  return null;
}

async function fetchArticleBody(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { body: null, ogDesc: null };
    const html = await res.text();
    
    // OG description
    let ogDesc = null;
    const ogMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{30,})["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']{30,})["'][^>]+property=["']og:description["']/i)
                 || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{30,})["']/i);
    if (ogMatch) ogDesc = cleanHtml(ogMatch[1]).substring(0, 500);
    
    const body = AI_ONLY ? null : extractArticleBody(html);
    return { body, ogDesc };
  } catch(e) {
    return { body: null, ogDesc: null };
  }
}

async function generateAiSummary(title, existingContent, source) {
  if (!GOOGLE_AI_KEY) return null;
  try {
    const prompt = `당신은 뉴스 요약 전문가입니다. 다음 뉴스 기사를 읽기 쉽고 자연스러운 한국어로 3-4문장 요약해주세요.
    
- 핵심 내용만 간결하게
- 자연스러운 한국어 문장
- 마지막 문장에 "자세한 내용은 원문에서 확인하세요." 추가
- JSON 형식으로 반환: {"summary": "요약 내용"}

기사 제목: ${title}
출처: ${source}
기존 내용: ${(existingContent || '').substring(0, 400)}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.summary || null;
  } catch(e) {
    return null;
  }
}

async function processArticle(row) {
  const { id, title, url, content: existing, source } = row;
  
  // 1단계: 기사 본문 직접 추출
  const { body, ogDesc } = await fetchArticleBody(url);
  
  if (body && body.length >= 200) {
    return { id, content: body, method: 'scrape' };
  }
  
  // 2단계: OG description이 충분하면 사용
  const fallbackContent = body || ogDesc || existing || '';
  
  // 3단계: AI 요약 생성
  if (GOOGLE_AI_KEY) {
    const summary = await generateAiSummary(title, fallbackContent, source);
    if (summary && summary.length > 50) {
      return { id, content: summary, method: 'ai' };
    }
  }
  
  // 4단계: OG description이라도 있으면 사용
  if (fallbackContent.length >= 50) {
    return { id, content: fallbackContent, method: 'og' };
  }
  
  return { id, content: null, method: 'failed' };
}

async function run() {
  console.log(`\n🚀 뉴스 AI 요약 엔진 시작`);
  console.log(`최대 ${LIMIT}개 처리, 배치 ${BATCH}개\n`);
  
  // 내용 부족한 뉴스 가져오기
  const { rows } = await pool.query(`
    SELECT id, title, url, content, source 
    FROM news 
    WHERE (content IS NULL OR length(content) < 200)
    AND published_date > NOW() - INTERVAL '30 days'
    ORDER BY published_date DESC
    LIMIT $1
  `, [LIMIT]);
  
  console.log(`처리 대상: ${rows.length}개\n`);
  
  let scraped = 0, aiGenerated = 0, ogUsed = 0, failed = 0;
  
  // 배치 처리
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(rows.length / BATCH);
    
    console.log(`\n📦 배치 ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH, rows.length)}번)`);
    
    // 배치 내 병렬 처리
    const results = await Promise.all(batch.map(row => processArticle(row)));
    
    // DB 업데이트
    for (const result of results) {
      if (!result.content) {
        process.stdout.write('✗');
        failed++;
        continue;
      }
      
      await pool.query('UPDATE news SET content = $1 WHERE id = $2', [result.content, result.id]);
      
      if (result.method === 'scrape') { process.stdout.write('S'); scraped++; }
      else if (result.method === 'ai') { process.stdout.write('A'); aiGenerated++; }
      else if (result.method === 'og') { process.stdout.write('O'); ogUsed++; }
    }
    console.log();
    
    // 배치간 딜레이 (API rate limit)
    if (i + BATCH < rows.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ 완료!`);
  console.log(`  S(스크래이핑): ${scraped}개`);
  console.log(`  A(AI 요약):   ${aiGenerated}개`);
  console.log(`  O(OG 설명):   ${ogUsed}개`);
  console.log(`  ✗(실패):      ${failed}개`);
  console.log(`  총 처리:      ${scraped + aiGenerated + ogUsed}개`);
  
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
