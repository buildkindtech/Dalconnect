/**
 * auto-community-seed.cjs
 * 3-5일마다 AI가 달라스 한인 커뮤니티 글 3-5개 자동 생성
 * 실행: node scripts/auto-community-seed.cjs
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── 게시글 템플릿 풀 (실제같은 달라스 한인 생활 주제) ──────────────────────
const POST_TEMPLATES = [
  // 생활정보
  { category: '생활정보', title: 'DMV 예약 꿀팁 공유해요', content: '달라스에서 DMV 예약하기가 정말 어렵더라고요. 저는 DPS Frisco 오피스가 제일 빠르게 잡혔어요. 온라인으로 오전 7시에 새로고침하면 그나마 빨리 잡히더라고요. 혹시 더 좋은 방법 아시는 분 계세요?', tags: ['DMV','운전면허','달라스'], nickname: '새이민자' },
  { category: '생활정보', title: 'H-E-B vs Kroger vs HMart 장보기 비교', content: 'H-E-B 가격이 Kroger보다 확실히 싸긴 한데 한국 식재료는 HMart가 최고죠. 요즘은 H-E-B에도 한국 라면이나 간장 정도는 있더라고요. 여러분은 어디서 주로 장 보세요?', tags: ['장보기','마트','생활'], nickname: '주부맘' },
  { category: '생활정보', title: 'Texas 자동차 등록 갱신 온라인으로 가능하네요', content: '매년 DMV 가서 자동차 등록 갱신하는 줄 알았는데, 오늘 온라인으로 해봤더니 10분도 안 걸렸어요! txdmv.gov에서 하면 됩니다. 스티커 우편으로 받는 것도 포함이고요.', tags: ['자동차등록','Texas','생활정보'], nickname: '절약러' },
  { category: '생활정보', title: 'DART 버스/전철 실제로 써보신 분?', content: '차 없이 생활해보려고 DART 이용해봤는데 솔직히 좀 불편하긴 해요. Plano에서 다운타운까지는 Red Line으로 괜찮은데, 그 외 지역은 버스 배차간격이 너무 길어요. 혹시 DART 잘 활용하시는 분 계세요?', tags: ['DART','대중교통','달라스'], nickname: '무차생활러' },
  { category: '생활정보', title: 'Costco vs Sam\'s Club 어디가 나아요?', content: 'Costco 회원권 갱신할지 Sam\'s Club 전환할지 고민 중이에요. 한국 식품이나 고기 퀄리티는 Costco가 좋은데, 가격은 Sam\'s Club이 조금 저렴한 것 같기도 하고요. 달라스에서 어디 더 애용하세요?', tags: ['Costco','SamsClub','쇼핑'], nickname: '주부3인가족' },

  // 맛집
  { category: '맛집', title: 'Carrollton H Mart 푸드코트 솔직 후기', content: '오늘 HMart 2층 푸드코트에서 밥 먹었는데 순대국밥이 진짜 맛있었어요! 국물이 진하고 양도 많아서 $12 주고 먹기 아깝지 않더라고요. 거기 냉면도 맛있다고 하던데 다음엔 도전해봐야겠어요.', tags: ['HMart','Carrollton','맛집'], nickname: '맛집헌터' },
  { category: '맛집', title: '달라스 최고 김치찌개 맛집 어디예요?', content: '요즘 집에서 끓이는 김치찌개가 질려서 외식으로 먹고 싶은데요. 달라스/플라노/캐롤튼 어디든 진짜 맛있는 김치찌개 파는 곳 추천 부탁드려요. 국물 진하고 김치 잘 익은 곳으로요!', tags: ['김치찌개','맛집','한식'], nickname: '한식러버' },
  { category: '맛집', title: 'Allen에 새로 생긴 한식당 어때요?', content: 'Allen 쪽에 요즘 한식당이 몇 개 새로 생겼다는 얘기 들었는데, 가보신 분 계세요? 특히 갈비나 삼겹살 잘 하는 곳으로요. 드라이브해서라도 갈 의향 있어요.', tags: ['Allen','신규맛집','한식'], nickname: '고기러버' },
  { category: '맛집', title: '한국식 치킨 vs 미국식 프라이드치킨 여러분 취향은?', content: 'bhc, 60chicken 같은 한국식 치킨이 DFW에도 생기고 있잖아요. 근데 솔직히 Raising Cane\'s나 Chick-fil-A 같은 미국식도 너무 맛있어서... 여러분 취향은 어느 쪽이에요?', tags: ['치킨','맛집','푸드'], nickname: '치킨마니아' },

  // 육아/교육
  { category: '육아', title: 'Frisco ISD 영재 프로그램 신청 경험 있으신 분?', content: '아이가 내년에 초등학교 들어가는데 Frisco ISD 영재 프로그램(GATE) 신청할지 고민 중이에요. 테스트가 꽤 어렵다고 들었는데 준비 방법이나 경험 공유해주실 분 계세요?', tags: ['FriscoISD','영재교육','육아'], nickname: '학부모고민중' },
  { category: '육아', title: 'Plano 지역 수학 학원 추천 부탁드려요', content: '초4 아이 수학 실력이 좀 늘었으면 해서 학원을 알아보고 있어요. Kumon, Mathnasium 등 들어봤는데 한국 선생님 계신 학원이 있으면 더 좋겠어요. 플라노 근처 추천해주세요!', tags: ['수학학원','Plano','교육'], nickname: '수학걱정맘' },
  { category: '육아', title: '여름방학 한국어 캠프 정보 있나요?', content: '아이들이 한국말을 잊어가는 것 같아서 여름방학에 한국어 캠프 보내고 싶어요. DFW 지역에 한국학교나 캠프 프로그램 알고 계신 분 정보 좀 부탁드려요!', tags: ['한국어캠프','여름방학','교육'], nickname: '이중언어맘' },

  // Q&A
  { category: 'Q&A', title: '미국에서 한국 운전면허 교환하는 방법?', content: '한국 운전면허를 미국 면허로 교환할 수 있다고 들었는데, Texas에서도 되나요? 필기시험이나 주행시험 없이 교환되는 건지 궁금해서요. 경험해보신 분 계세요?', tags: ['운전면허','교환','생활정보'], nickname: '한국서온지1년' },
  { category: 'Q&A', title: 'ITIN 신청 혼자 할 수 있나요?', content: 'SSN이 없어서 세금 보고를 위해 ITIN이 필요한데요. 한인 세무사 통하지 않고 직접 신청 가능한지, 서류 준비는 어떻게 해야 하는지 아시는 분 계세요?', tags: ['ITIN','세금','생활정보'], nickname: '세금초보' },
  { category: 'Q&A', title: 'Texas에서 의료보험 없이 병원 가면?', content: '직장 보험이 아직 시작이 안 됐는데 아파서 병원을 가야 할 것 같아요. 의료보험 없이 가면 비용이 얼마나 나올까요? 저렴하게 진료받을 수 있는 방법 있으면 알려주세요.', tags: ['의료보험','병원','생활정보'], nickname: '건강걱정' },

  // 부동산
  { category: '부동산', title: 'Plano vs Frisco vs McKinney 어디 살기 좋아요?', content: '이사를 준비 중인데 Plano, Frisco, McKinney 중 어디가 한인들한테 살기 좋은지 비교해주실 분 계세요? 학군, 한인 커뮤니티 규모, 집값 등 고려하고 있어요.', tags: ['이사','부동산','달라스'], nickname: '이사준비중' },
  { category: '부동산', title: '아파트 lease break 경험 있으신 분?', content: '불가피한 사정으로 렌트 계약 만료 전에 이사를 해야 할 것 같아요. Lease break 하면 어떤 페널티가 있는지, 어떻게 협상하면 좋은지 경험 있으신 분 조언 부탁드려요.', tags: ['아파트','lease','부동산'], nickname: '이사급한분' },

  // 자유게시판
  { category: '자유게시판', title: '달라스 생활 6개월 후기 공유해요', content: '한국에서 달라스로 온 지 6개월이 됐네요. 처음엔 차 없이 어떻게 사나 싶었는데 이제 적응이 됐어요. 넓은 도로, 저렴한 집값, 좋은 날씨... 힘든 건 한국 친구들이 그립다는 것? 달라스 생활 어떠세요?', tags: ['달라스생활','이민','일상'], nickname: '달라스6개월차' },
  { category: '자유게시판', title: 'DFW 한인들 주로 어느 앱 쓰세요?', content: '한국에 있을 때 네이버/카카오 많이 쓰다가 여기 오니까 대부분 Google/iMessage 쓰더라고요. 혹시 DFW 한인들끼리 많이 쓰는 커뮤니티 앱이나 카카오톡 단체방 같은 거 있나요?', tags: ['커뮤니티','앱','한인'], nickname: '소통러' },

  // 뷰티/패션
  { category: '뷰티', title: 'Carrollton 한인 네일샵 추천해주세요', content: '한국식으로 꼼꼼하게 해주는 네일샵 찾고 있는데요. 캐롤튼/플라노 쪽에 한국 스타일로 잘 해주는 곳 있으면 추천 부탁드려요. 특히 젤네일 잘 하는 곳으로요!', tags: ['네일','뷰티','Carrollton'], nickname: '뷰티러버' },
  { category: '뷰티', title: '미국에서 한국 스킨케어 어디서 사세요?', content: 'Innisfree, Laneige, Cosrx 같은 한국 스킨케어 여기서도 구할 수 있더라고요. H Mart, Walmart, Ulta, Amazon 다 가격이 달라서... 여러분은 어디서 구매하세요?', tags: ['스킨케어','뷰티','쇼핑'], nickname: '피부관리러' },
];

// ─── Gemini AI 커뮤니티 글 생성 ───────────────────────────────────────────────
async function generateAIPosts(existingTitles, count) {
  const apiKey = (() => {
    try { return require('fs').readFileSync('/Users/aaron/.claude/api-keys.env','utf8').match(/GOOGLE_AI_KEY=(.+)/)?.[1]?.trim(); } catch { return process.env.GOOGLE_AI_KEY; }
  })();
  if (!apiKey) { console.log('⚠️ GOOGLE_AI_KEY 없음'); return []; }

  const CATEGORIES = ['생활정보','맛집','육아','Q&A','부동산','자유게시판','뷰티'];
  const NICKNAMES = ['달라스이민5년차','주부맘','플라노엄마','IT직장인','주부3인가족','새이민자','맛집헌터','학부모고민중','절약러','이사준비중'];

  // 최근 뉴스 헤드라인 가져오기 (시의성 있는 주제 생성용)
  let recentNews = '';
  try {
    const nr = await pool.query("SELECT title FROM news WHERE created_at > NOW() - INTERVAL '48 hours' ORDER BY created_at DESC LIMIT 6");
    recentNews = nr.rows.map(r => r.title).join(', ');
  } catch {}

  const existingList = [...existingTitles].slice(-20).join('\n');
  const prompt = `달라스(DFW) 한인 커뮤니티 게시판에 올라올 법한 실제 주민 글 ${count}개를 생성해주세요.

최근 뉴스 맥락 (참고용): ${recentNews}

카테고리 중 선택: ${CATEGORIES.join(', ')}
닉네임 풀: ${NICKNAMES.join(', ')}

조건:
- 실제 달라스 한인이 쓴 것처럼 자연스러운 한국어
- 구체적인 장소/학교/마트명 포함 (Frisco, Plano, Carrollton, H-Mart, Costco 등)
- 질문형 또는 경험 공유형
- 각 글 200-350자
- 아래 기존 제목과 중복 절대 금지:
${existingList}

JSON 배열로만 응답 (설명 없이):
[
  {"category":"카테고리","title":"제목","content":"본문","tags":["태그1","태그2"],"nickname":"닉네임"},
  ...
]`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2000, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) { console.log('⚠️ JSON 파싱 실패'); return []; }
    const posts = JSON.parse(jsonMatch[0]);
    // 중복 제목 최종 필터
    return posts.filter(p => !existingTitles.has(p.title));
  } catch(e) {
    console.log('⚠️ Gemini 에러:', e.message);
    return [];
  }
}

// ─── 랜덤 유틸 ────────────────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePostId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 11);
  return `post_seed_${ts}_${rand}`;
}

// 최근 N일 내 랜덤 날짜 생성
function randomRecentDate(daysBack = 2) {
  const now = new Date();
  const msBack = randomInt(0, daysBack * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - msBack).toISOString();
}

// ─── 중복 체목 체크 ───────────────────────────────────────────────────────────
async function getExistingTitles() {
  const result = await pool.query('SELECT title FROM community_posts');
  return new Set(result.rows.map(r => r.title));
}

// ─── 마지막 시드 날짜 확인 (너무 자주 실행 방지) ─────────────────────────────
async function getLastSeedDate() {
  try {
    const result = await pool.query(
      "SELECT created_at FROM community_posts WHERE id LIKE 'post_seed_%' ORDER BY created_at DESC LIMIT 1"
    );
    if (result.rows.length === 0) return null;
    return new Date(result.rows[0].created_at);
  } catch (e) {
    return null;
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function seedCommunityPosts() {
  console.log('🌱 커뮤니티 자동 시드 시작...');

  // 마지막 시드로부터 3일 이내면 스킵
  const lastSeed = await getLastSeedDate();
  if (lastSeed) {
    const daysSince = (Date.now() - lastSeed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) {
      console.log(`⏭️  최근 시드로부터 ${daysSince.toFixed(1)}일 경과 — 스킵 (3일 최소 간격)`);
      await pool.end();
      return;
    }
    console.log(`📅 마지막 시드: ${lastSeed.toLocaleDateString('ko-KR')} (${daysSince.toFixed(1)}일 전)`);
  }

  const existingTitles = await getExistingTitles();
  console.log(`기존 게시글: ${existingTitles.size}개`);

  // 아직 올라가지 않은 템플릿만 필터
  const unused = POST_TEMPLATES.filter(t => !existingTitles.has(t.title));
  console.log(`사용 가능한 템플릿: ${unused.length}개`);

  // 템플릿 남아있으면 기존 방식, 소진되면 Gemini AI 생성
  const count = randomInt(3, 5);
  let toAdd = [];

  if (unused.length >= count) {
    const shuffled = unused.sort(() => Math.random() - 0.5);
    toAdd = shuffled.slice(0, count);
  } else {
    console.log('🤖 템플릿 소진 → Gemini AI로 신규 게시글 생성 중...');
    toAdd = await generateAIPosts(existingTitles, count);
    if (toAdd.length === 0) {
      console.log('⚠️ AI 생성 실패');
      await pool.end();
      return;
    }
  }

  let added = 0;
  for (const template of toAdd) {
    const id = generatePostId();
    const createdAt = randomRecentDate(2); // 최근 0-2일 내
    const views = randomInt(5, 40);
    const likes = randomInt(0, 8);

    await pool.query(
      `INSERT INTO community_posts 
       (id, nickname, password_hash, title, content, category, tags, views, likes, comment_count, is_pinned, created_at, updated_at, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, false, $10, $10, 'dallas')`,
      [
        id,
        template.nickname,
        'auto_seeded',   // password_hash placeholder
        template.title,
        template.content,
        template.category,
        JSON.stringify(template.tags),
        views,
        likes,
        createdAt,
      ]
    );
    console.log(`  ✅ [${template.category}] ${template.title}`);
    added++;
  }

  console.log(`\n✅ 완료: ${added}개 게시글 추가 (총 ${existingTitles.size + added}개)`);
  await pool.end();
}

seedCommunityPosts().catch(e => {
  console.error('❌ 에러:', e.message);
  pool.end();
  process.exit(1);
});
