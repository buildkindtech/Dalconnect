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
  // 육아
  { type: 'hot',    sub: 'Mommit',            category: '육아',   nickname: '맘스코너',   minScore: 20 },
  { type: 'hot',    sub: 'beyondthebump',      category: '육아',   nickname: '육아정보',   minScore: 15 },
  { type: 'hot',    sub: 'Parenting',          category: '육아',   nickname: '부모이야기', minScore: 20 },
  { type: 'hot',    sub: 'toddlers',           category: '육아',   nickname: '육아정보',   minScore: 15 },

  // 달라스 로컬
  { type: 'search', sub: 'Dallas',             category: '달라스', nickname: '달라스소식', minScore: 10,
    q: 'kids events activities family school daycare restaurant' },
  { type: 'hot',    sub: 'DFW',                category: '달라스', nickname: '달라스소식', minScore: 5 },

  // 맛집/음식
  { type: 'hot',    sub: 'KoreanFood',         category: '맛집',   nickname: '맛집정보',   minScore: 30 },
  { type: 'hot',    sub: 'foodhacks',          category: '맛집',   nickname: '요리꿀팁',   minScore: 20 },
  { type: 'search', sub: 'Dallas',             category: '맛집',   nickname: '달라스맛집', minScore: 10,
    q: 'restaurant food korean bbq ramen pho brunch' },

  // 부동산
  { type: 'hot',    sub: 'FirstTimeHomeBuyer', category: '부동산', nickname: '부동산정보', minScore: 30 },
  { type: 'hot',    sub: 'RealEstate',         category: '부동산', nickname: '부동산이야기', minScore: 25 },
  { type: 'search', sub: 'DFW',                category: '부동산', nickname: '달라스부동산', minScore: 5,
    q: 'housing rent buy home mortgage apartment' },

  // 건강
  { type: 'hot',    sub: 'nutrition',          category: '건강',   nickname: '영양정보',   minScore: 30 },
  { type: 'hot',    sub: 'loseit',             category: '건강',   nickname: '다이어트',   minScore: 25 },
  { type: 'hot',    sub: 'fitness',            category: '건강',   nickname: '운동정보',   minScore: 30 },

  // 생활정보
  { type: 'hot',    sub: 'personalfinance',    category: '생활정보', nickname: '재정관리',  minScore: 50 },
  { type: 'hot',    sub: 'frugal',             category: '생활정보', nickname: '절약꿀팁',  minScore: 30 },
  { type: 'hot',    sub: 'lifehacks',          category: '생활정보', nickname: '생활꿀팁',  minScore: 40 },

  // 반려동물
  { type: 'hot',    sub: 'dogs',               category: '반려동물', nickname: '강아지',    minScore: 50 },
  { type: 'hot',    sub: 'cats',               category: '반려동물', nickname: '고양이',    minScore: 50 },
  { type: 'hot',    sub: 'pets',               category: '반려동물', nickname: '펫라이프',  minScore: 30 },

  // 취업/커리어
  { type: 'hot',    sub: 'careerguidance',     category: '취업',   nickname: '커리어조언', minScore: 30 },
  { type: 'hot',    sub: 'cscareerquestions',  category: '취업',   nickname: 'IT취업',     minScore: 40 },
  { type: 'search', sub: 'jobs',               category: '취업',   nickname: '취업정보',   minScore: 20,
    q: 'advice resume interview salary remote' },

  // 교육
  { type: 'hot',    sub: 'homeschool',         category: '교육',   nickname: '홈스쿨',     minScore: 20 },
  { type: 'search', sub: 'Parenting',          category: '교육',   nickname: '교육정보',   minScore: 15,
    q: 'school education learning tutoring college' },

  // 여행
  { type: 'hot',    sub: 'solotravel',         category: '여행',   nickname: '여행이야기', minScore: 30 },
  { type: 'hot',    sub: 'travel',             category: '여행',   nickname: '여행정보',   minScore: 50 },
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

// ─── Reddit 수집 (카테고리별 2-3개 제한) ─────────────────────────
const PER_CATEGORY_LIMIT = 3; // 카테고리당 최대 수집

async function fetchRedditPosts() {
  const allPosts = [];
  const categoryCount = {}; // 카테고리별 수집 카운트

  for (const src of REDDIT_SOURCES) {
    // 이미 해당 카테고리가 한도 도달하면 스킵
    if ((categoryCount[src.category] || 0) >= PER_CATEGORY_LIMIT) continue;

    try {
      console.log(`\n🤖 r/${src.sub} [${src.category}] (${src.type})...`);
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
        if ((categoryCount[src.category] || 0) >= PER_CATEGORY_LIMIT) break;
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
          tags: [src.category, src.sub.toLowerCase()].filter(Boolean),
          redditUrl: `https://www.reddit.com${p.permalink}`,
          score: p.score,
          needsTranslation: !/[\uAC00-\uD7AF]{3,}/.test(rawTitle),
        });
        categoryCount[src.category] = (categoryCount[src.category] || 0) + 1;
        count++;
      }
      console.log(`  ${count}개 후보 (${src.category} 누적: ${categoryCount[src.category] || 0}/${PER_CATEGORY_LIMIT})`);
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.log(`  ⚠️ r/${src.sub} 실패: ${e.message}`);
    }
  }
  
  // 카테고리별 수집 요약
  console.log('\n📊 카테고리별 수집:');
  Object.entries(categoryCount).forEach(([cat, n]) => console.log(`  ${cat}: ${n}개`));
  
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
