#!/usr/bin/env node
/**
 * 아침 브리핑 Phase 1+2 통합 — 자동 선별 + TTS 스크립트 생성
 * 매일 4:45am 실행
 * 1. DB에서 48시간 뉴스 조회
 * 2. 카테고리 다양하게 7개 자동 선별
 * 3. TTS 스크립트 생성 (Gemini)
 * 4. memory/morning-reels/YYYY-MM-DD/tts-script.txt 저장
 * 5. Telegram으로 TTS 스크립트 전송 (Aaron이 Freepik에서 복붙 녹음)
 */
const { Client } = require('pg');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { askAI } = require('./ai.cjs');

const BASE = path.resolve(__dirname, '..');
// Load .env if not already in environment
if (!process.env.DATABASE_URL) {
  try {
    const envFile = fs.readFileSync(path.join(BASE, '.env'), 'utf8');
    for (const line of envFile.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {}
}

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.DALCONNECT_CHAT || '-5280678324';
const DATABASE_URL = process.env.DATABASE_URL;

function fetchWeather() {
  return new Promise((resolve) => {
    https.get('https://wttr.in/Dallas,TX?format=j1', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const w = JSON.parse(data);
          const today = w.weather[0];
          const minF = parseInt(today.mintempF);
          const maxF = parseInt(today.maxtempF);
          const desc = today.hourly[4]?.weatherDesc[0]?.value || '맑음';
          resolve({ minF, maxF, desc });
        } catch {
          resolve({ minF: 59, maxF: 77, desc: '맑음' });
        }
      });
    }).on('error', () => resolve({ minF: 59, maxF: 77, desc: '맑음' }));
  });
}

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function getKoreanDate(d = new Date()) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return {
    label: `${d.getMonth()+1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`,
    dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
  };
}

async function main() {
  const today = getKoreanDate();
  console.log(`[${today.dateStr}] 아침 브리핑 자동 생성 시작`);

  // 1. DB 연결
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // 공통 제외 조건 — 저품질/비뉴스 소스 및 소프트 콘텐츠
  const BASE_WHERE = `
    WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND title IS NOT NULL AND title != ''
      AND content IS NOT NULL AND LENGTH(content) > 200
      AND source NOT ILIKE 'r/%'
      AND source NOT ILIKE '%reddit%'
      AND source NOT ILIKE '%community%'
      AND source NOT ILIKE '%Fast Company%'
      AND source NOT ILIKE '%Inc.com%'
      AND source NOT ILIKE '%Fortune%'
      AND source NOT ILIKE '%Allure%'
      AND source NOT ILIKE '%Elle%'
      AND source NOT ILIKE '%W Korea%'
      AND source NOT ILIKE '%HousingWire%'
      AND source NOT ILIKE '%Realtor.com%'
      AND source NOT ILIKE '%Redfin%'
      AND source NOT ILIKE '%Small Business%'
      AND source NOT ILIKE '%베이비뉴스%'
      AND source NOT ILIKE '%코메디닷컴%'
      AND source NOT ILIKE '%CNBC 개인재정%'
      AND source NOT ILIKE '%취업%'
      AND source NOT ILIKE '%건강%'
      AND title NOT ILIKE '%패션%'
      AND title NOT ILIKE '%뷰티%'
      AND title NOT ILIKE '%반려동물%'
      AND title NOT ILIKE '%햄스터%'
      AND title NOT ILIKE '%고양이%'
      AND title NOT ILIKE '%강아지%'
      AND title NOT ILIKE '%레시피%'
      AND title NOT ILIKE '%요리%'
      AND title NOT ILIKE '%다이어트%'
      AND title NOT ILIKE '%피부%'
      AND title NOT ILIKE '% 방법%'
      AND title NOT ILIKE '%하는 법%'
      AND title NOT ILIKE '%가지 %'
      AND title NOT ILIKE '%추천%'
      AND title NOT ILIKE '%랭킹%'
      AND title NOT ILIKE '%베스트%'
      AND title NOT ILIKE '[건강%'
      AND title NOT ILIKE '%어지럼%'
      AND title NOT ILIKE '%혈당%'
      AND title NOT ILIKE '%혈압%'
      AND title NOT ILIKE '%콜레스테롤%'
      AND title NOT ILIKE '%멜라토닌%'
      AND title NOT ILIKE '%비타민%'
      AND title NOT ILIKE '%영양%'
      AND title NOT ILIKE '[%칼럼%'
      AND title NOT ILIKE '%오피니언%'
  `;

  // 주요 언론사 소스 필터 (STD 슬롯에서 헤드라인 품질 보장)
  const MAJOR_SOURCE = `AND (
    source ILIKE '%연합뉴스%' OR source ILIKE '%조선일보%' OR source ILIKE '%동아일보%'
    OR source ILIKE '%한겨레%' OR source ILIKE '%경향신문%' OR source ILIKE '%중앙일보%'
    OR source ILIKE '%MBC%' OR source ILIKE '%KBS%' OR source ILIKE '%SBS%' OR source ILIKE '%YTN%'
    OR source ILIKE '%BBC%' OR source ILIKE '%Reuters%' OR source ILIKE '%AP%'
    OR source ILIKE '%WFAA%' OR source ILIKE '%dallasnews%' OR source ILIKE '%star-telegram%'
    OR source ILIKE '%CNN%' OR source ILIKE '%NBC%' OR source ILIKE '%ABC%' OR source ILIKE '%Fox%'
    OR source ILIKE '%CNBC%' OR source ILIKE '%Bloomberg%' OR source ILIKE '%WSJ%'
    OR source ILIKE '%ESPN%' OR source ILIKE '%Soompi%'
  )`;

  const query = (where) => client.query(`
    SELECT id, title, content, category, source, published_date
    FROM news ${BASE_WHERE} ${where}
      AND id NOT IN (${usedIds.size > 0 ? [...usedIds].map(id=>`'${id}'`).join(',') : "''"})
    ORDER BY published_date DESC LIMIT 1
  `).catch(() => ({ rows: [] }));

  const selected = [];
  const usedIds = new Set();

  // ── 카테고리 우선순위 (낮을수록 높은 우선순위) ────────────────
  const CAT_PRIORITY = {
    'DFW날씨': 0, 'DFW로컬': 1, '텍사스정책': 2,
    '이민/비자': 3, '트럼프정책': 3,
    'IT레이오프': 4, '미국': 4,
    '환율/물가': 5, '경제': 5,
    '한국선수': 6, 'KPOP': 6, '한국뉴스': 6,
    '월드': 7, '국제': 7,
    '연예스포츠': 8,
  };

  // ── 제목 키워드 추출 (2자 이상 의미있는 단어) ──────────────────
  function extractKeywords(title) {
    return title
      .replace(/[^\w가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);
  }

  // ── 중복 토픽 감지 (키워드 50% 이상 겹침) ────────────────────
  function isSameTopic(t1, t2) {
    const k1 = new Set(extractKeywords(t1));
    const k2 = new Set(extractKeywords(t2));
    if (k1.size === 0 || k2.size === 0) return false;
    const overlap = [...k1].filter(w => k2.has(w)).length;
    return overlap / Math.min(k1.size, k2.size) >= 0.5;
  }

  const selectedMeta = []; // { idx, label, priority }

  const add = (rows, label) => {
    const priority = CAT_PRIORITY[label] ?? 9;
    for (const r of rows) {
      if (usedIds.has(r.id)) continue;

      // 중복 토픽 체크
      const dupIdx = selectedMeta.findIndex(m => isSameTopic(m.article.title, r.title));
      if (dupIdx !== -1) {
        const dup = selectedMeta[dupIdx];
        if (priority < dup.priority) {
          // 더 높은 우선순위로 교체
          console.log(`🔄 중복교체: [${dup.label}→${label}] ${r.title.slice(0,35)}`);
          usedIds.delete(dup.article.id);
          selected.splice(selected.findIndex(s => s.id === dup.article.id), 1, r);
          selectedMeta.splice(dupIdx, 1, { article: r, label, priority });
          usedIds.add(r.id);
        } else {
          console.log(`⏭️ 중복스킵: [${label}] ${r.title.slice(0,35)} (이미 [${dup.label}] 있음)`);
        }
        continue;
      }

      selected.push(r);
      selectedMeta.push({ article: r, label, priority });
      usedIds.add(r.id);
      console.log(`✅ [${label}] ${r.title.slice(0,40)}`);
    }
  };

  // ── 1단계: MUST-INCLUDE (달라스 한인 일상 직결) ─────────────────
  // 환율/물가
  add((await query(`AND (title ILIKE '%환율%' OR title ILIKE '%달러%원%' OR title ILIKE '%기름값%' OR title ILIKE '%물가%급%')`)).rows, '환율/물가');
  // DFW 날씨 경보
  add((await query(`AND (title ILIKE '%토네이도%' OR title ILIKE '%우박%' OR title ILIKE '%빙판%' OR (title ILIKE '%폭풍%' AND (title ILIKE '%달라스%' OR title ILIKE '%DFW%' OR title ILIKE '%텍사스%' OR title ILIKE '%경보%')) OR ((title ILIKE '%달라스%' OR title ILIKE '%DFW%' OR title ILIKE '%텍사스%') AND (title ILIKE '%경보%' OR title ILIKE '%홍수%' OR (title ILIKE '%날씨%' AND title ILIKE '%주의%'))))`)).rows, 'DFW날씨');
  // 이민/비자 정책
  add((await query(`AND (title ILIKE '%H1B%' OR title ILIKE '%H-1B%' OR title ILIKE '%영주권%' OR title ILIKE '%추방%' OR (title ILIKE '% ICE %' AND title NOT ILIKE '%ice cream%') OR (title ILIKE '%이민%' AND (title ILIKE '%정책%' OR title ILIKE '%단속%' OR title ILIKE '%법%')))`)).rows, '이민/비자');

  // ── 2단계: HIGH-PRIORITY (정체성 + 미국생활 필수) ─────────────────
  // 한국 선수 활약
  add((await query(`AND (title ILIKE '%김혜성%' OR title ILIKE '%이정후%' OR title ILIKE '%류현진%' OR title ILIKE '%손흥민%' OR title ILIKE '%이강인%' OR title ILIKE '%김민재%' OR title ILIKE '%김광현%' OR title ILIKE '%박효준%' OR title ILIKE '%고우석%' OR title ILIKE '%오타니%')`)).rows, '한국선수');
  // K-pop 빅뉴스 (수상/빌보드/타임 등 실적 중심)
  add((await query(`AND (title ILIKE '%BTS%' OR title ILIKE '%방탄%' OR title ILIKE '%블랙핑크%' OR title ILIKE '%제니%' OR title ILIKE '%아이브%' OR title ILIKE '%뉴진스%' OR title ILIKE '%세븐틴%') AND (title ILIKE '%컴백%' OR title ILIKE '%수상%' OR title ILIKE '%빌보드%' OR title ILIKE '%그래미%' OR title ILIKE '%1위%' OR title ILIKE '%타임%' OR title ILIKE '%영향력%')`)).rows, 'KPOP');
  // 트럼프 정책 (관세/이민/군사/경제)
  add((await query(`AND title ILIKE '%트럼프%' AND (title ILIKE '%관세%' OR title ILIKE '%이민%' OR title ILIKE '%경제%' OR title ILIKE '%정책%' OR title ILIKE '%제재%' OR title ILIKE '%전쟁%' OR title ILIKE '%이란%' OR title ILIKE '%군%')`)).rows, '트럼프정책');
  // 미-이란/중동 주요 외교 (트럼프 외 다른 관점)
  add((await query(`AND (title ILIKE '%이란%' OR title ILIKE '%헤즈볼라%' OR title ILIKE '%중동%') AND (title ILIKE '%휴전%' OR title ILIKE '%합의%' OR title ILIKE '%협상%' OR title ILIKE '%전쟁%' OR title ILIKE '%핵%') AND title NOT ILIKE '%트럼프%'`)).rows, '중동외교');
  // 미국 주식/경제 빅뉴스 (사상최고치, 금리, 관세 충격)
  add((await query(`AND (title ILIKE '%나스닥%' OR title ILIKE '%S&P%' OR title ILIKE '%뉴욕증시%' OR title ILIKE '%코스피%' OR title ILIKE '%금리%' OR title ILIKE '%연준%') AND (title ILIKE '%사상최고%' OR title ILIKE '%급등%' OR title ILIKE '%급락%' OR title ILIKE '%동결%' OR title ILIKE '%인상%' OR title ILIKE '%인하%')`)).rows, '주식/경제');
  // DFW 로컬 — 사건사고·정치·생활 실질 영향
  add((await query(`AND (source ILIKE '%WFAA%' OR source ILIKE '%dallasnews%' OR source ILIKE '%star-telegram%')
    AND LENGTH(content) > 200
    AND (
      title ILIKE '%달라스%' OR title ILIKE '%DFW%' OR title ILIKE '%텍사스%' OR title ILIKE '%Fort Worth%'
      OR title ILIKE '%교통%' OR title ILIKE '%사고%' OR title ILIKE '%화재%' OR title ILIKE '%범죄%'
      OR title ILIKE '%학교%' OR title ILIKE '%도로%' OR title ILIKE '%공항%' OR title ILIKE '%폐쇄%'
      OR title ILIKE '%사임%' OR title ILIKE '%체포%' OR title ILIKE '%사망%' OR title ILIKE '%I-20%'
      OR title ILIKE '%I-35%' OR title ILIKE '%선거%' OR title ILIKE '%시장%'
    )`)).rows, 'DFW로컬');
  // 텍사스 법안/정책
  add((await query(`AND (title ILIKE '%텍사스%' OR title ILIKE '%달라스%') AND (title ILIKE '%법안%' OR title ILIKE '%총기%' OR title ILIKE '%세금%' OR title ILIKE '%교육%' OR title ILIKE '%의회%')`)).rows, '텍사스정책');
  // 한반도/주한미군
  add((await query(`AND (title ILIKE '%주한미군%' OR title ILIKE '%사드%' OR title ILIKE '%김정은%' OR title ILIKE '%북한%') AND (title ILIKE '%미사일%' OR title ILIKE '%핵%' OR title ILIKE '%훈련%' OR title ILIKE '%청문회%' OR title ILIKE '%반출%' OR title ILIKE '%도발%')`)).rows, '한반도');
  // IT 빅테크 레이오프
  add((await query(`AND (title ILIKE '%레이오프%' OR title ILIKE '%감원%' OR (title ILIKE '%해고%' AND (title ILIKE '%구글%' OR title ILIKE '%메타%' OR title ILIKE '%애플%' OR title ILIKE '%아마존%' OR title ILIKE '%마이크로소프트%'))))`)).rows, 'IT레이오프');

  // ── 3단계: 표준 슬롯 (다양성 확보, 최대 12개까지) ─────────────────
  const STD = [
    { label: '한국뉴스', count: 3, where: `AND category ILIKE '%한국뉴스%' ${MAJOR_SOURCE}` },
    { label: '월드',     count: 2, where: `AND (category ILIKE '%월드%' OR category ILIKE '%국제%') ${MAJOR_SOURCE}` },
    { label: '경제',     count: 1, where: `AND (category ILIKE '%경제%' OR title ILIKE '%환율%' OR title ILIKE '%금리%' OR title ILIKE '%주식%') ${MAJOR_SOURCE}` },
    { label: '연예스포츠', count: 2, where: `AND (category ILIKE '%연예%' OR category ILIKE '%K-POP%' OR category ILIKE '%스포츠%') ${MAJOR_SOURCE}` },
    { label: '미국',     count: 2, where: `AND (category ILIKE '%미국%' OR title ILIKE '%트럼프%' OR title ILIKE '%바이든%' OR title ILIKE '%의회%') ${MAJOR_SOURCE}` },
  ];
  for (const slot of STD) {
    if (selected.length >= 8) break;
    const remain = Math.min(slot.count, 8 - selected.length);
    const { rows } = await client.query(`
      SELECT id, title, content, category, source, published_date
      FROM news ${BASE_WHERE} ${slot.where}
        AND id NOT IN (${[...usedIds].map(id=>`'${id}'`).join(',') || "''"})
      ORDER BY published_date DESC LIMIT ${remain}
    `).catch(() => ({ rows: [] }));
    add(rows, slot.label);
  }

  await client.end();
  console.log(`선별 완료: ${selected.length}개 (목표 6-8개)`);

  // ── 카테고리 순서 정렬: 로컬 → 미국 → 한국 → 월드 → 경제 → 연예 → 스포츠 ──
  // category 필드 직접 매핑 우선 — 타이틀에 "달라스" 키워드 있어도 비로컬 기사가 앞에 오는 버그 방지
  const CAT_DIRECT = {
    'DFW날씨': 0, 'DFW로컬': 1, '로컬뉴스': 1, '텍사스정책': 2,
    '미국뉴스': 3, '트럼프': 3,
    '이민/비자': 4, '이민비자': 4,
    '한국뉴스': 5,
    '월드뉴스': 6, '국제뉴스': 6,
    '경제': 7, '세금/재정': 7,
    '부동산/숙소': 8,
    '연예': 9, 'K-POP': 9, 'KPOP': 9,
    '스포츠': 10,
    '육아': 11, '패션/뷰티': 12, '취업/사업': 12,
  };
  function catPriority(article) {
    const cat = (article.category || '').trim();
    // 1. category 직접 매핑
    if (cat in CAT_DIRECT) return CAT_DIRECT[cat];
    // 2. category 부분 키워드
    const cLow = cat.toLowerCase();
    if (cLow.includes('로컬') || cLow.includes('wfaa')) return 1;
    if (cLow.includes('텍사스')) return 2;
    if (cLow.includes('미국')) return 3;
    if (cLow.includes('이민')) return 4;
    if (cLow.includes('한국')) return 5;
    if (cLow.includes('월드') || cLow.includes('국제')) return 6;
    if (cLow.includes('경제') || cLow.includes('금리') || cLow.includes('환율')) return 7;
    if (cLow.includes('연예') || cLow.includes('kpop') || cLow.includes('bts')) return 9;
    if (cLow.includes('스포츠')) return 10;
    return 13; // 기타 (타이틀에 달라스 있어도 category가 비로컬이면 뒤로)
  }
  selected.sort((a, b) => catPriority(a) - catPriority(b));
  console.log('정렬 순서:', selected.map(n => `[${n.category}] ${n.title.slice(0,20)}`).join(' → '));

  // 3. 날씨
  const weather = await fetchWeather();
  console.log(`날씨: ${weather.desc} / 최저 ${weather.minF}°F 최고 ${weather.maxF}°F`);

  // 4. Gemini로 TTS 스크립트 생성
  const newsListText = selected.map((n, i) =>
    `${i+1}. [${n.category}] ${n.title}\n내용: ${(n.content || '').slice(0, 200)}`
  ).join('\n\n');

  const COUNT_KO = ['한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];
  const countWord = COUNT_KO[selected.length - 1] || `${selected.length}`;

  const ttsPrompt = `아래 뉴스 목록으로 달커넥트 아침 브리핑 TTS 스크립트를 작성해주세요.

날짜: ${today.label}
날씨: 최저 ${weather.minF}도, 최고 ${weather.maxF}도, ${weather.desc}
뉴스 ${selected.length}개:
${newsListText}

작성 규칙:
- "안녕하세요, 달커넥트 아침 브리핑입니다."로 시작
- 날짜, 날씨 멘트 포함 (날씨는 "최저 XX도, 최고 XX도" 형식으로 — °F, F, 화씨 등 영어/기호 절대 쓰지 말 것)
- "오늘 소식 ${countWord} 가지 전해드리겠습니다." (실제 뉴스 ${selected.length}개에 맞게)
- 각 뉴스: "첫번째 소식입니다. [내용]", "두번째 소식입니다. [내용]", "세번째 소식입니다. [내용]", ..., "마지막 소식입니다. [내용]"
- ⚠️ 모든 순서 번호 뒤에 반드시 "소식입니다"를 붙일 것 — "두번째입니다" 절대 금지
- 뉴스 순서: 위에 번호 매긴 순서 그대로 작성 (이미 카테고리별 정렬됨, 순서 절대 바꾸지 말 것)
- 각 뉴스 2~3문장, 달라스 한인 관점에서 생동감 있게
- 숫자/영어는 한글 발음으로 (예: I-35E → 아이삼십오이, DFW → 디에프더블유)
- ⚠️ 달라스/텍사스 휘발유 가격은 반드시 달러/갤런으로 말할 것 (예: "갤런당 3달러 20센트") — 원화 환산 절대 금지
- 마무리: "오늘 달커넥트 뉴스 여기까지입니다. 더 자세한 내용은 달커넥트닷컴에서 만나보세요. 즐거운 [요일] 되세요. 감사합니다."
- 스크립트 텍스트만 출력, 다른 설명 없이`;

  let ttsScript = (await askAI(ttsPrompt, { maxTokens: 4000, temperature: 0.5, thinkingBudget: 0 })).trim();

  // ── 글자 깨짐 검증 + 자동 복구 ──────────────────────────────
  const brokenChars = (ttsScript.match(/\uFFFD/g) || []).length;
  if (brokenChars > 0) {
    console.warn(`⚠️ 깨진 글자 ${brokenChars}개 감지 — 재생성 시도`);
    const retry = (await askAI(ttsPrompt, { maxTokens: 4000, temperature: 0.3, thinkingBudget: 0 })).trim();
    const retryBroken = (retry.match(/\uFFFD/g) || []).length;
    if (retryBroken < brokenChars) {
      ttsScript = retry;
      console.log(`✅ 재생성으로 깨진 글자 ${brokenChars} → ${retryBroken}개 감소`);
    }
    // 그래도 남아있으면 컨텍스트로 추정 교체
    ttsScript = ttsScript
      .replace(/트럼프\s*\uFFFD{1,3}국/g, '트럼프 미국')
      .replace(/\uFFFD{1,3}동\s*분쟁/g, '중동 분쟁')
      .replace(/\uFFFD{1,3}동\s*사태/g, '중동 사태')
      .replace(/\uFFFD{1,3}동\s*위기/g, '중동 위기')
      .replace(/\uFFFD/g, '');  // 나머지 깨진 글자 제거
    console.log(`🔧 깨진 글자 교정 완료`);
  }

  console.log(`TTS 스크립트 생성 완료 (${ttsScript.length}자)`);

  // 5. 파일 저장
  const dateDir = path.join(BASE, 'memory', 'morning-reels', today.dateStr);
  if (!fs.existsSync(dateDir)) fs.mkdirSync(dateDir, { recursive: true });
  const scriptPath = path.join(dateDir, 'tts-script.txt');
  fs.writeFileSync(scriptPath, ttsScript);
  console.log(`저장: ${scriptPath}`);

  // briefing-config 기본 저장 (선별 뉴스 목록)
  const configPath = path.join(dateDir, 'selected-news.json');
  fs.writeFileSync(configPath, JSON.stringify(selected.map(n => ({
    id: n.id, title: n.title, category: n.category, source: n.source
  })), null, 2));

  // 6. 완료 로그 (Telegram 전송은 full-auto 파이프라인에서 영상과 함께)
  console.log(`✅ TTS 스크립트 저장 완료: ${scriptPath} (${ttsScript.length}자)`);
  console.log(`📝 선별 뉴스 ${selected.length}개 → Leda TTS → 렌더 → 미리보기 자동 진행`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
