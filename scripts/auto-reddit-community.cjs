#!/usr/bin/env node
/**
 * Reddit → DalKonnect 커뮤니티 자동 시드
 * 
 * 엄마/육아/달라스 생활 정보를 Reddit에서 수집해서
 * community_posts 테이블에 자동 게시
 * 
 * 소스:
 * - r/Mommit, r/beyondthebump, r/Parenting, r/toddlers — 육아/엄마
 * - r/Dallas, r/DFW 검색 — 달라스 가족/이벤트
 */

require('dotenv').config();
const pg = require('pg');
const fs = require('fs');
const crypto = require('crypto');

const DB_URL = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

// Gemini API Key
let GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || '';
if (!GOOGLE_AI_KEY) {
  try {
    const envFile = fs.readFileSync('/Users/aaron/.openclaw/workspace/.env', 'utf8');
    const m = envFile.match(/GOOGLE_AI_KEY=(.+)/);
    if (m) GOOGLE_AI_KEY = m[1].trim();
  } catch(e) {}
}
console.log('Gemini API:', GOOGLE_AI_KEY ? '✅' : '❌ MISSING');

// ─── Reddit 소스 설정 ────────────────────────────────────────────
const REDDIT_SOURCES = [
  // 엄마/육아 전문 서브레딧
  { type: 'hot',    sub: 'Mommit',       category: '육아',   nickname: '맘스코너',  minScore: 20 },
  { type: 'hot',    sub: 'beyondthebump', category: '육아',   nickname: '육아정보',  minScore: 15 },
  { type: 'hot',    sub: 'Parenting',     category: '육아',   nickname: '부모이야기', minScore: 20 },
  { type: 'hot',    sub: 'toddlers',      category: '육아',   nickname: '육아정보',  minScore: 15 },
  // 달라스 로컬 — 가족/이벤트 키워드
  { type: 'search', sub: 'Dallas',        category: '달라스', nickname: '달라스소식', minScore: 10,
    q: 'kids events activities toddler playground family school daycare' },
  { type: 'search', sub: 'DFW',           category: '달라스', nickname: '달라스소식', minScore: 5,
    q: 'family kids baby activities events school' },
];

// 정치/논쟁/성인 필터
const SKIP_REGEX = /\b(trump|biden|maga|democrat|republican|election|ICE|arrest|murder|shooting|killed|victim|racist|fascist|nazi|abortion|gun|GOP|DNC|antifa|BLM|riot|protest|lawsuit|indicted|convicted|defund|pedo|cruelty|sex\b)\b/i;

// ─── Gemini 번역 ──────────────────────────────────────────────────
async function translateToKorean(title, content) {
  if (!GOOGLE_AI_KEY) return { title, content };
  if (/[\uAC00-\uD7AF]{5,}/.test(title)) return { title, content }; // 이미 한글
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text:
            `달라스 한인 커뮤니티 사이트용 게시글입니다. 제목과 내용을 자연스러운 한국어로 번역하세요.\n반드시 JSON만 반환: {"title":"번역된제목","content":"번역된내용"}\n\n제목: ${title}\n내용: ${(content||'').slice(0,400)}`
          }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );
    if (!res.ok) return { title, content };
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { title: parsed.title || title, content: parsed.content || content };
  } catch (e) {
    return { title, content };
  }
}

// ─── 중복 체크 (제목 기준) ────────────────────────────────────────
async function isDuplicate(title) {
  const { rows } = await pool.query(
    'SELECT id FROM community_posts WHERE title = $1 LIMIT 1',
    [title]
  );
  return rows.length > 0;
}

// ─── 커뮤니티 포스트 삽입 ────────────────────────────────────────
async function insertPost({ title, content, category, nickname, city, tags, redditUrl }) {
  const id = crypto.randomUUID();
  const passwordHash = crypto.createHash('sha256').update('reddit_auto_seed').digest('hex');
  const ipHash = crypto.createHash('sha256').update('reddit_bot').digest('hex');

  await pool.query(
    `INSERT INTO community_posts
       (id, nickname, password_hash, title, content, category, tags, views, likes, comment_count, is_pinned, ip_hash, city, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,0,false,$8,$9,NOW(),NOW())`,
    [
      id,
      nickname,
      passwordHash,
      title,
      content + (redditUrl ? `\n\n[원문 보기](${redditUrl})` : ''),
      category,
      JSON.stringify(tags || []),
      ipHash,
      city || null,
    ]
  );
  return id;
}

// ─── Reddit 수집 ─────────────────────────────────────────────────
async function fetchRedditPosts() {
  const allPosts = [];
  for (const src of REDDIT_SOURCES) {
    try {
      console.log(`\n🤖 r/${src.sub} (${src.type})...`);
      const url = src.type === 'search'
        ? `https://www.reddit.com/r/${src.sub}/search.json?q=${encodeURIComponent(src.q)}&sort=new&restrict_sr=1&limit=20&t=week`
        : `https://www.reddit.com/r/${src.sub}/hot.json?limit=25`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'DalKonnect/1.0 (+https://dalkonnect.com)' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const posts = data.data?.children?.map(c => c.data) || [];

      let count = 0;
      for (const p of posts) {
        if (p.score < src.minScore) continue;
        if (SKIP_REGEX.test(p.title) || SKIP_REGEX.test(p.selftext || '')) continue;
        if (p.over_18) continue;

        const rawTitle = p.title.trim();
        const rawContent = (p.selftext || '').trim().slice(0, 600)
          || `댓글 ${p.num_comments}개 · 추천 ${p.score}`;

        allPosts.push({
          rawTitle,
          rawContent,
          category: src.category,
          nickname: src.nickname,
          city: ['Dallas','DFW','FortWorth'].includes(src.sub) ? 'dallas' : null,
          tags: ['reddit', src.category === '육아' ? '육아' : '달라스'],
          redditUrl: `https://www.reddit.com${p.permalink}`,
          score: p.score,
          needsTranslation: !/[\uAC00-\uD7AF]{3,}/.test(rawTitle),
        });
        if (++count >= 6) break;
      }
      console.log(`  ${count}개 후보`);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.log(`  ⚠️ r/${src.sub} 실패: ${e.message}`);
    }
  }
  return allPosts;
}

// ─── 메인 ────────────────────────────────────────────────────────
async function run() {
  console.log(`\n[${new Date().toISOString()}] Reddit 커뮤니티 시드 시작`);
  const posts = await fetchRedditPosts();
  console.log(`\n총 ${posts.length}개 후보 → 번역 + 삽입 중...`);

  let inserted = 0, skipped = 0;
  for (const post of posts) {
    // 중복 체크 (원문 제목으로)
    if (await isDuplicate(post.rawTitle)) { skipped++; continue; }

    // 번역
    let title = post.rawTitle;
    let content = post.rawContent;
    if (post.needsTranslation && GOOGLE_AI_KEY) {
      const t = await translateToKorean(post.rawTitle, post.rawContent);
      title = t.title || post.rawTitle;
      content = t.content || post.rawContent;
      // 번역 후 중복 체크
      if (await isDuplicate(title)) { skipped++; continue; }
      await new Promise(r => setTimeout(r, 400));
    }

    await insertPost({ title, content, ...post });
    console.log(`  ✅ [${post.category}] ${title.slice(0, 55)}`);
    inserted++;
  }

  console.log(`\n[완료] 신규 ${inserted}개 삽입, ${skipped}개 중복 스킵`);
  await pool.end();
}

run().catch(e => { console.error('Reddit 시드 오류:', e.message); process.exit(1); });
