#!/usr/bin/env node
/**
 * DalKonnect 뉴스 품질 체크 + 자동 픽스
 * 크론잡 마지막 단계로 실행
 * 결과를 MC용 JSON으로 저장
 */
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 2, ssl: { rejectUnauthorized: false } });

let GOOGLE_AI_KEY = '';
try {
  const env = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env', 'utf8');
  const m = env.match(/GOOGLE_AI_KEY=(.+)/);
  if (m) GOOGLE_AI_KEY = m[1].trim();
} catch(e) {}

const REPORT_PATH = path.join(__dirname, '../news-quality-report.json');

function decodeEntities(t) {
  return (t||'').replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCharCode(parseInt(h,16)))
    .replace(/&#(\d+);/g,(_,d)=>String.fromCharCode(parseInt(d)))
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function deepClean(text) {
  if (!text) return text;
  let c = text;
  // 1. TTS 마커 이후 실제 내용만 추출 (한겨레/중앙 등)
  const ttsIdx = c.indexOf('기사를 읽어드립니다');
  if (ttsIdx >= 0) { c = c.substring(ttsIdx + 9).replace(/^[^가-힣]*/, ''); }
  // 2. 오디오 플레이어 잔재
  c = c.replace(/Your browser does not support\s*the?\s*audio element\.?/gi, '');
  c = c.replace(/\b\d{1,2}:\d{2}\b\s*(다음)?/g, '');
  // 3. 날짜/기자/등록 헤더
  c = c.replace(/수정\s*\d{4}-\d{2}-\d{2}[^가-힣]{0,20}/g, '');
  c = c.replace(/등록\s*\d{4}-\d{2}-\d{2}[^가-힣]{0,20}/g, '');
  c = c.replace(/[가-힣]{2,5}(,[가-힣]{2,5})*\s*기자/g, '');
  // 4. 브레드크럼/섹션 헤더 ("본문미래&과학과학" 류)
  c = c.replace(/^본문[가-힣\s\/·&]+?(?=[가-힣]{10,})/m, '');
  c = c.replace(/^[가-힣\/·&]{1,20}(?=[가-힣]{10,}[^\s])/m, ''); // 짧은 카테고리 prefix
  // 5. 이미지 크레딧
  c = c.replace(/픽사베이\s*광고?/g, '');
  c = c.replace(/게티이미지뱅크\s*/g, '');
  c = c.replace(/이미지투데이\s*/g, '');
  c = c.replace(/연합뉴스\s*(?=\s)/g, '');
  c = c.replace(/Credit:\s*[A-Za-z\/\s\.\-]+(?=\s|$)/g, '');
  // 6. 광고 텍스트
  c = c.replace(/광고\s*(?=[가-힣])/g, '');
  // 7. 영문 쓰레기
  c = c.replace(/Nation\/World\s*/gi, '');
  c = c.replace(/Local News\s*/gi, '');
  // 8. 중복 단어 제거
  c = c.replace(/([가-힣]{2,6})\1/g, '$1');
  return c.replace(/\s{2,}/g, ' ').trim();
}
function isEnglish(t) {
  const k = (t.match(/[가-힣]/g)||[]).length;
  const e = (t.match(/[A-Za-z]/g)||[]).length;
  return e > 50 && e > k * 2;
}
async function translateToKorean(content) {
  if (!GOOGLE_AI_KEY) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        contents:[{parts:[{text:`영어 뉴스를 자연스러운 한국어로 번역. JSON만: {"c":"번역"}\n\n${content.substring(0,800)}`}]}],
        generationConfig:{temperature:0.2, maxOutputTokens:800, thinkingConfig:{thinkingBudget:0}},
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text||'';
    const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'');
    const m = clean.match(/\{[\s\S]*?\}/);
    if (!m) return null;
    return JSON.parse(m[0]).c || null;
  } catch(e) { return null; }
}
async function enrichContent(id, title, url) {
  if (!GOOGLE_AI_KEY) return null;
  try {
    // 기사 본문 직접 시도
    const r = await fetch(url, { headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(8000) });
    if (r.ok) {
      const html = await r.text();
      const patterns = [
        /<article[^>]*>([\s\S]{200,}?)<\/article>/i,
        /<div[^>]+class="[^"]*(?:article-body|article_body|articleBody|news-content|entry-content|article_txt)[^"]*"[^>]*>([\s\S]{200,}?)<\/div>/i,
      ];
      for (const pat of patterns) {
        const m = html.match(pat);
        if (m) { const t = m[1].replace(/<[^>]+>/g,' ').replace(/\s{2,}/g,' ').trim(); if (t.length > 150) return t.substring(0,2000); }
      }
      // OG description
      const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{50,})["']/i);
      if (og) return og[1].substring(0,500);
    }
  } catch(e) {}
  // AI 요약 fallback
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        contents:[{parts:[{text:`뉴스 제목으로 3문장 한국어 요약. JSON만: {"c":"요약"}\n\n제목: ${title}`}]}],
        generationConfig:{temperature:0.3, maxOutputTokens:300, thinkingConfig:{thinkingBudget:0}},
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text||'';
    const clean = text.replace(/```json\n?/g,'').replace(/```\n?/g,'');
    const m = clean.match(/\{[\s\S]*?\}/);
    if (m) return JSON.parse(m[0]).c || null;
  } catch(e) {}
  return null;
}

async function run() {
  const now = new Date();
  console.log(`\n🔍 [${now.toLocaleString('ko-KR', {timeZone:'America/Chicago'})}] 품질 체크 시작`);

  // 최근 24시간 신규 뉴스
  const { rows: recent } = await pool.query(`SELECT id, title, url, content, thumbnail_url FROM news WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC`);
  
  // 전체 품질 현황
  const { rows: stats } = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE content IS NULL OR length(content) < 50) as no_content,
      COUNT(*) FILTER (WHERE thumbnail_url IS NULL) as no_thumb,
      COUNT(*) FILTER (WHERE content ~ '[A-Za-z ]{60,}' AND content !~ '[가-힣]{15,}') as english,
      COUNT(*) FILTER (WHERE content LIKE '%기사를 읽어드립니다%' OR content LIKE '%Local News%' OR content LIKE '%본문%' OR content LIKE '%픽사베이%' OR content LIKE '%audio element%' OR content LIKE '%게티이미지%' OR content LIKE '%이미지투데이%') as junk
    FROM news
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `);
  const s = stats[0];

  console.log(`신규: ${recent.length}개 | 내용없음: ${s.no_content} | 썸네일없음: ${s.no_thumb} | 영어: ${s.english} | 찌꺼기: ${s.junk}`);

  const fixes = { content: 0, translation: 0, junk: 0 };

  for (const row of recent) {
    let content = decodeEntities(row.content || '');
    let updated = false;

    // 찌꺼기 정리
    const cleaned = deepClean(content);
    if (cleaned !== content && cleaned.length > 30) {
      content = cleaned;
      updated = true;
      fixes.junk++;
    }

    // 내용 없으면 채우기
    if (!content || content.length < 50) {
      const enriched = await enrichContent(row.id, row.title, row.url);
      if (enriched && enriched.length > 30) {
        content = enriched;
        updated = true;
        fixes.content++;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    // 영어면 번역
    if (isEnglish(content)) {
      const translated = await translateToKorean(content);
      if (translated && translated.length > 30) {
        content = translated;
        updated = true;
        fixes.translation++;
      }
      await new Promise(r => setTimeout(r, 400));
    }

    if (updated) {
      await pool.query('UPDATE news SET content = $1 WHERE id = $2', [content, row.id]);
    }
  }

  // 최종 상태 재확인
  const { rows: final } = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE content IS NULL OR length(content) < 50) as no_content,
      COUNT(*) FILTER (WHERE thumbnail_url IS NULL) as no_thumb
    FROM news WHERE created_at > NOW() - INTERVAL '24 hours'
  `);
  const f = final[0];

  const allClear = parseInt(f.no_content) === 0;
  const status = allClear ? '✅ 정상' : '⚠️ 주의';

  // MC 리포트 저장
  const report = {
    lastRun: now.toISOString(),
    lastRunKST: now.toLocaleString('ko-KR', { timeZone: 'America/Chicago', hour12: false }),
    status: allClear ? 'ok' : 'warning',
    checklist: [
      { label: '신규 기사 수집', value: `${recent.length}개`, ok: recent.length > 0 },
      { label: '내용 없는 기사', value: `${f.no_content}개`, ok: parseInt(f.no_content) === 0 },
      { label: '썸네일 없는 기사', value: `${f.no_thumb}개`, ok: parseInt(f.no_thumb) === 0 },
      { label: '자동 픽스', value: `내용+${fixes.content} 번역+${fixes.translation} 정리+${fixes.junk}`, ok: true },
    ],
    fixes,
    totalNews: 0,
  };

  const { rows: totalRow } = await pool.query('SELECT COUNT(*) FROM news');
  report.totalNews = parseInt(totalRow[0].count);

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n${status} | 자동픽스: 내용+${fixes.content} 번역+${fixes.translation} 정리+${fixes.junk}`);
  console.log(`리포트 저장: ${REPORT_PATH}`);

  // 영어 기사 잔여 확인
  const { rows: engRows } = await pool.query(`
    SELECT COUNT(*) as cnt FROM news
    WHERE content ~ '[A-Za-z ]{80,}' AND content !~ '[가-힣]{20,}'
    AND created_at > NOW() - INTERVAL '24 hours'
  `);
  const engCount = parseInt(engRows[0].cnt || 0);

  // 텔레그램 알림 (직접 전송 — AI agent 판단 없이)
  try {
    const tgConf = JSON.parse(fs.readFileSync('/Users/aaron/.openclaw/openclaw.json','utf8'));
    const tgList = tgConf.channels?.telegram;
    const tg = Array.isArray(tgList) ? tgList[0] : tgList;
    const botToken = tg?.botToken || tg?.token;
    const chatId = '-5280678324';
    if (botToken) {
      const runTime = now.toLocaleString('ko-KR', { timeZone:'America/Chicago', hour12:false });
      let msg = '';
      if (engCount > 0 || parseInt(f.no_content) > 0) {
        msg = `⚠️ DalKonnect 뉴스 품질 이슈\n`
            + `❌ 영어 기사 잔여: ${engCount}개\n`
            + `❌ 내용 없는 기사: ${f.no_content}개\n`
            + `🔧 자동픽스: 내용+${fixes.content} 번역+${fixes.translation} 정리+${fixes.junk}\n`
            + `🕐 ${runTime}`;
      } else {
        msg = `✅ DalKonnect 뉴스 정상\n`
            + `📰 24h 신규: ${recent.length}개 | 영어잔여: 0개\n`
            + `🔧 자동픽스: +${fixes.content+fixes.translation+fixes.junk}건\n`
            + `🕐 ${runTime}`;
      }
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ chat_id: chatId, text: msg })
      });
      console.log('📱 텔레그램 알림 전송:', engCount > 0 ? '⚠️ 이슈' : '✅ 정상');
    }
  } catch(e) { console.log('텔레그램 알림 실패:', e.message); }

  await pool.end();
  return report;
}

run().catch(e => { console.error(e); process.exit(1); });
