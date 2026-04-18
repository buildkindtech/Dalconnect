#!/usr/bin/env node
/**
 * 아침 브리핑 Phase 2 — TTS 스크립트 생성
 *
 * 사용법:
 *   node briefing-tts-gen.cjs 1,3,5,7,9       # DB news IDs
 *   node briefing-tts-gen.cjs --ids=1,3,5,7,9  # 같은 방법
 *
 * 생성 파일:
 *   memory/morning-reels/YYYY-MM-DD/tts-script.txt
 *   memory/morning-reels/YYYY-MM-DD/briefing-config.json
 *
 * Google TTS (Chirp3-HD Leda)로 자동 음성 생성 + briefing-pipeline.sh 자동 실행
 */

const { Client } = require('pg');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { askAI } = require('./ai.cjs');

const BOT_TOKEN = '8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY';
const CHAT_ID = '-5280678324';
const DATABASE_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';

// ─── 날짜 ────────────────────────────────────────────────
function getKoreanDate(d = new Date()) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayOfWeek: days[d.getDay()],
    dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
    label: `${d.getMonth()+1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`,
  };
}

// ─── TTS 평문 → SSML + 단어별 <mark> 태그 생성 ──────────────────
// 반환: { ssml: string, wordList: string[] }
// wordList[i] ↔ <mark name="w_i"/> → TTS API가 timepoints로 정확한 타이밍 반환
function buildSSMLWithMarks(plainText) {
  const PHONETICS = [
    ['LAFC','엘에이에프씨'],['NFL','엔에프엘'],['NBA','엔비에이'],
    ['MLB','메이저리그'],['MLS','메이저리그사커'],['LPGA','엘피지에이'],
    ['KLPGA','케이엘피지에이'],['PGA','피지에이'],['WBC','월드베이스볼클래식'],
    ['NASA','나사'],['ICE','아이씨이'],['H1B','에이치원비자'],
    ['USCIS','유에스씨아이에스'],['BTS','비티에스'],['AI','에이아이'],
    ['CEO','씨이오'],['DFW','디에프더블유'],['SNS','에스엔에스'],
    ['GDP','지디피'],['UN','유엔'],['EU','유럽연합'],['IT','아이티'],
    ['NCT','엔시티'],['Rock Solid','록 솔리드'],['SWIM','스윔'],
  ];

  // 카테고리 전환 키워드 → 앞에 600ms 쉼
  const CATEGORY_BREAKS = [
    '달라스 로컬 소식입니다',
    '미국 뉴스입니다',
    '한국 뉴스입니다',
    '스포츠 소식입니다',
    '연예 소식입니다',
    '오늘 달커넥트 뉴스 여기까지입니다',
  ];

  const rawWords = plainText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(w => w);
  const wordList = rawWords; // 화면 표시용 원문 단어 목록

  const parts = [];
  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    let w = word.replace(/&/g, '&amp;');

    // 카테고리 전환 감지 — 현재 단어부터 3단어를 합쳐서 패턴 매칭
    const phrase3 = rawWords.slice(i, i + 4).join(' ');
    const isCategoryStart = CATEGORY_BREAKS.some(kb => phrase3.startsWith(kb.split(' ')[0]) &&
      rawWords.slice(i, i + kb.split(' ').length).join(' ') === kb);
    if (isCategoryStart) parts.push('<break time="600ms"/>');

    // mark 태그 삽입 (화면 타이밍 기준)
    parts.push(`<mark name="w_${i}"/>`);

    // 영어 약어 → <sub alias> 치환
    for (const [en, ko] of PHONETICS) {
      w = w.replace(new RegExp(`\\b${en}\\b`, 'g'), `<sub alias="${ko}">${en}</sub>`);
    }
    parts.push(w);

    // 문장 끝 쉼 (.!? 로 끝나는 단어)
    if (/[.!?]$/.test(word)) parts.push('<break time="350ms"/>');
  }

  return { ssml: `<speak>${parts.join(' ')}</speak>`, wordList };
}

// ─── TTS 평문 → SSML 변환 (구형 — mark 없는 버전, fallback용) ───────
function buildSSML(plainText) {
  // 1. XML 특수문자 이스케이프 (& 만 실질 위험)
  let t = plainText.replace(/&/g, '&amp;');

  // 2. 영어 약어 → <sub alias="한국어"> 치환
  const PHONETICS = [
    ['LAFC',   '엘에이에프씨'],
    ['NFL',    '엔에프엘'],
    ['NBA',    '엔비에이'],
    ['MLB',    '메이저리그'],
    ['MLS',    '메이저리그사커'],
    ['LPGA',   '엘피지에이'],
    ['PGA',    '피지에이'],
    ['WBC',    '월드베이스볼클래식'],
    ['NASA',   '나사'],
    ['ICE',    '아이씨이'],
    ['H1B',    '에이치원비자'],
    ['USCIS',  '유에스씨아이에스'],
    ['BTS',    '비티에스'],
    ['AI',     '에이아이'],
    ['CEO',    '씨이오'],
    ['CFO',    '씨에프오'],
    ['DFW',    '디에프더블유'],
    ['WFAA',   '더블유에프에이에이'],
    ['SNS',    '에스엔에스'],
    ['GDP',    '지디피'],
    ['CPI',    '소비자물가지수'],
    ['IMF',    '국제통화기금'],
    ['UN',     '유엔'],
    ['EU',     '유럽연합'],
    ['PC',     '피씨'],
    ['IT',     '아이티'],
    ['EV',     '전기차'],
    ['DNA',    '디엔에이'],
    ['FBI',    '에프비아이'],
    ['CIA',    '씨아이에이'],
  ];
  for (const [en, ko] of PHONETICS) {
    t = t.replace(new RegExp(`\\b${en}\\b`, 'g'), `<sub alias="${ko}">${en}</sub>`);
  }

  // 3. 뉴스 서수 앞에 쉼 삽입 (각 소식 시작 전 자연스러운 간격)
  const ORDINALS = ['첫 번째','두 번째','세 번째','네 번째','다섯 번째',
                    '여섯 번째','일곱 번째','여덟 번째','아홉 번째','열 번째'];
  for (const ord of ORDINALS) {
    t = t.replace(new RegExp(ord + ' 소식입니다', 'g'),
      `<break time="650ms"/>${ord} 소식입니다<break time="150ms"/>`);
  }
  t = t.replace(/마지막 소식입니다/g,
    '<break time="650ms"/>마지막 소식입니다<break time="150ms"/>');

  // 4. 날씨 문장 뒤, 클로징 문장 앞 쉼
  t = t.replace(/(있겠습니다\.)/g, '$1<break time="500ms"/>');
  t = t.replace(/오늘 달커넥트 뉴스 여기까지입니다/,
    '<break time="700ms"/>오늘 달커넥트 뉴스 여기까지입니다');

  return `<speak>${t}</speak>`;
}

// ─── 날씨 영어→한국어 변환 ───────────────────────────────────
function descToKorean(rawDesc) {
  const WEATHER_KO = {
    'Sunny': '맑음', 'Clear': '맑음', 'Partly cloudy': '구름 조금',
    'Partly Cloudy': '구름 조금', 'Cloudy': '흐림', 'Overcast': '흐림',
    'Mist': '안개', 'Fog': '안개', 'Freezing fog': '짙은 안개',
    'Patchy rain nearby': '간헐적 소나기', 'Patchy rain possible': '간헐적 소나기',
    'Light rain shower': '가벼운 소나기', 'Light rain': '가벼운 비',
    'Moderate rain': '보통 비', 'Heavy rain': '강한 비',
    'Moderate or heavy rain shower': '강한 소나기',
    'Torrential rain shower': '집중호우',
    'Thundery outbreaks possible': '천둥번개 가능',
    'Patchy light rain with thunder': '뇌우',
    'Moderate or heavy rain with thunder': '강한 뇌우',
    'Blizzard': '눈보라', 'Light snow': '가벼운 눈',
    'Moderate snow': '보통 눈', 'Heavy snow': '강한 눈',
    'Blowing snow': '눈보라', 'Freezing drizzle': '얼어붙는 이슬비',
    'Light sleet': '진눈깨비', 'Moderate or heavy sleet': '강한 진눈깨비',
    'Ice pellets': '우박', 'Light showers of ice pellets': '가벼운 우박',
  };
  if (!rawDesc) return '맑음';
  if (WEATHER_KO[rawDesc]) return WEATHER_KO[rawDesc];
  // 키워드 기반 fallback (맵에 없는 영어 설명도 한국어로)
  const lower = rawDesc.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return '천둥번개';
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) return '비';
  if (lower.includes('snow') || lower.includes('blizzard') || lower.includes('sleet')) return '눈';
  if (lower.includes('fog') || lower.includes('mist')) return '안개';
  if (lower.includes('cloud') || lower.includes('overcast')) return '흐림';
  if (lower.includes('sun') || lower.includes('clear') || lower.includes('fair')) return '맑음';
  return '흐림';
}

// ─── 날씨 ─────────────────────────────────────────────────
function fetchWeather() {
  return new Promise((resolve) => {
    https.get('https://wttr.in/Dallas,TX?format=j1', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const w = JSON.parse(data);
          const today = w.weather[0];
          const minC = Math.round((parseInt(today.mintempF) - 32) * 5/9);
          const maxC = Math.round((parseInt(today.maxtempF) - 32) * 5/9);
          const rawDesc = today.hourly[4]?.weatherDesc[0]?.value || '';
          const desc = descToKorean(rawDesc);
          resolve({ minC, maxC, desc, minF: today.mintempF, maxF: today.maxtempF });
        } catch {
          resolve({ minC: 15, maxC: 25, desc: '맑음', minF: 59, maxF: 77 });
        }
      });
    }).on('error', () => resolve({ minC: 15, maxC: 25, desc: '맑음', minF: 59, maxF: 77 }));
  });
}

// ─── Telegram ─────────────────────────────────────────────
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

// 음성 파일을 Telegram으로 전송 (sendAudio)
function sendTelegramAudio(filePath, caption) {
  return new Promise((resolve) => {
    try {
      const result = execSync(
        `curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendAudio"` +
        ` -F "chat_id=${CHAT_ID}"` +
        ` -F "audio=@${filePath}"` +
        ` -F "caption=${caption.replace(/"/g, '\\"')}"`,
        { encoding: 'utf8', timeout: 60000 }
      );
      resolve(JSON.parse(result));
    } catch (e) {
      console.error('❌ Telegram 음성 전송 실패:', e.message);
      resolve({ ok: false });
    }
  });
}

// ─── 카테고리 → 슬라이드 설정 ───────────────────────────────
const CATEGORY_SLIDE = {
  '로컬': { icon:'🏙️', accent:'#60a5fa', bg:'linear-gradient(160deg,#0f1a2e 0%,#1e3a5f 50%,#0f1a2e 100%)', badge:'🏙️ 달라스 로컬' },
  '달라스': { icon:'🏙️', accent:'#60a5fa', bg:'linear-gradient(160deg,#0f1a2e 0%,#1e3a5f 50%,#0f1a2e 100%)', badge:'🏙️ 달라스 로컬' },
  '한국': { icon:'🚨', accent:'#f87171', bg:'linear-gradient(160deg,#1a0a0a 0%,#3b1010 50%,#1a0a0a 100%)', badge:'🇰🇷 한국뉴스' },
  '미주': { icon:'🇺🇸', accent:'#60a5fa', bg:'linear-gradient(160deg,#0f1a2e 0%,#1e3a5f 50%,#0f1a2e 100%)', badge:'🇺🇸 미주뉴스' },
  '문화': { icon:'🎬', accent:'#c084fc', bg:'linear-gradient(160deg,#1a0a2e 0%,#3b1060 50%,#1a0a2e 100%)', badge:'🎬 문화' },
  '연예': { icon:'🎤', accent:'#c084fc', bg:'linear-gradient(160deg,#1a0a2e 0%,#3b1060 50%,#1a0a2e 100%)', badge:'🎵 문화/연예' },
  'k-pop': { icon:'🎵', accent:'#c084fc', bg:'linear-gradient(160deg,#1a0a2e 0%,#3b1060 50%,#1a0a2e 100%)', badge:'🎵 K-POP' },
  '경제': { icon:'💸', accent:'#fbbf24', bg:'linear-gradient(160deg,#1a1400 0%,#3b3000 50%,#1a1400 100%)', badge:'💸 환율/경제' },
  '부동산': { icon:'🏠', accent:'#fbbf24', bg:'linear-gradient(160deg,#1a1400 0%,#3b3000 50%,#1a1400 100%)', badge:'🏠 부동산' },
  '이민': { icon:'📋', accent:'#4ade80', bg:'linear-gradient(160deg,#0a1a0a 0%,#103b10 50%,#0a1a0a 100%)', badge:'📋 이민/비자' },
  '비자': { icon:'📋', accent:'#4ade80', bg:'linear-gradient(160deg,#0a1a0a 0%,#103b10 50%,#0a1a0a 100%)', badge:'📋 이민/비자' },
  '건강': { icon:'💊', accent:'#2dd4bf', bg:'linear-gradient(160deg,#001a18 0%,#003b36 50%,#001a18 100%)', badge:'💊 건강' },
  '스포츠': { icon:'⚽', accent:'#60a5fa', bg:'linear-gradient(160deg,#0a0f1a 0%,#0f2040 50%,#0a0f1a 100%)', badge:'⚽ 스포츠' },
  '생활': { icon:'💡', accent:'#f97316', bg:'linear-gradient(160deg,#1a0800 0%,#3b1800 50%,#1a0800 100%)', badge:'💡 생활정보' },
  '테크': { icon:'📱', accent:'#818cf8', bg:'linear-gradient(160deg,#0a0a1a 0%,#1a1060 50%,#0a0a1a 100%)', badge:'📱 테크' },
  '기타': { icon:'📰', accent:'#94a3b8', bg:'linear-gradient(160deg,#0f1520 0%,#1e2535 50%,#0f1520 100%)', badge:'📰 뉴스' },
};

function getCategorySlide(category) {
  if (!category) return CATEGORY_SLIDE['기타'];
  const lower = (category || '').toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_SLIDE)) {
    if (lower.includes(key)) return val;
  }
  return CATEGORY_SLIDE['기타'];
}

function getCategoryTitle(category) {
  const lower = (category || '').toLowerCase();
  if (lower.includes('로컬') || lower.includes('달라스')) return '달라스 로컬';
  if (lower.includes('한국')) return '한국뉴스';
  if (lower.includes('미주')) return '미주뉴스';
  if (lower.includes('k-pop') || lower.includes('kpop')) return 'K-POP';
  if (lower.includes('연예')) return '문화/연예';
  if (lower.includes('문화')) return '문화';
  if (lower.includes('경제')) return '경제';
  if (lower.includes('부동산')) return '부동산';
  if (lower.includes('이민') || lower.includes('비자')) return '이민/비자';
  if (lower.includes('건강')) return '건강';
  if (lower.includes('스포츠')) return '스포츠';
  if (lower.includes('생활')) return '생활정보';
  if (lower.includes('테크')) return '테크';
  return category || '뉴스';
}

// ─── 메인 ─────────────────────────────────────────────────
async function main() {
  // 인수 파싱
  const args = process.argv.slice(2);
  let rawIds = '';
  for (const a of args) {
    if (a.startsWith('--ids=')) rawIds = a.slice(6);
    else if (/^[\d,]+$/.test(a)) rawIds = a;
  }

  if (!rawIds) {
    console.error('사용법: node briefing-tts-gen.cjs 1,3,5,7,9');
    process.exit(1);
  }

  const numbers = rawIds.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  console.log(`선택된 뉴스 번호: ${numbers.join(', ')}`);

  // ─── Phase 1에서 저장된 selected-news.json 우선 사용 ────────
  // Phase 1(news-candidates.cjs)이 오늘 날짜로 saved-news.json을 생성했으면 그걸 사용.
  // DB를 다시 조회하면 다른 뉴스가 나올 수 있어서 Aaron의 선택이 무효화됨.
  const todayDate = new Date().toISOString().slice(0, 10);
  const selectedNewsPath = path.join(BASE, 'memory', 'morning-reels', todayDate, 'selected-news.json');
  let candidateList = [];

  if (fs.existsSync(selectedNewsPath)) {
    // Phase 1 캐시 사용 — DB 재조회 불필요
    const cached = JSON.parse(fs.readFileSync(selectedNewsPath, 'utf8'));
    // selected-news.json은 id/title/category/source만 저장됨 → content는 DB에서 보충
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    for (const item of cached) {
      const { rows } = await client.query(
        `SELECT id, title, content, category, source, published_date FROM news WHERE id = $1`,
        [item.id]
      ).catch(() => ({ rows: [] }));
      if (rows.length > 0) {
        candidateList.push(rows[0]);
      } else {
        // content 없으면 title만이라도 사용
        candidateList.push({ id: item.id, title: item.title, content: item.title, category: item.category, source: item.source });
      }
    }
    await client.end();
    console.log(`✅ Phase 1 캐시 사용: ${selectedNewsPath} (${candidateList.length}개)`);
  } else {
    // Phase 1 캐시 없음 → DB 직접 조회 (fallback)
    console.log(`⚠️ selected-news.json 없음 → DB 직접 조회`);
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    const BASE_WHERE = `
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND title IS NOT NULL AND title != ''
        AND content IS NOT NULL AND LENGTH(content) > 80
        AND source NOT ILIKE 'r/%'
        AND source NOT ILIKE '%reddit%'
        AND source NOT ILIKE '%community%'
        AND title NOT ILIKE '%패션%' AND title NOT ILIKE '%뷰티%'
        AND title NOT ILIKE '%반려동물%' AND title NOT ILIKE '%햄스터%'
        AND title NOT ILIKE '%고양이%' AND title NOT ILIKE '%강아지%'
        AND title NOT ILIKE '%레시피%' AND title NOT ILIKE '%요리%'
    `;
    const usedIds = new Set();
    const qOne = async (where) => {
      const { rows } = await client.query(`
        SELECT id, title, content, category, source, published_date
        FROM news ${BASE_WHERE} ${where}
          AND id NOT IN (${usedIds.size > 0 ? [...usedIds].map(id=>`'${id}'`).join(',') : "''"})
        ORDER BY published_date DESC LIMIT 1
      `).catch(() => ({ rows: [] }));
      for (const r of rows) { candidateList.push(r); usedIds.add(r.id); }
    };
    await qOne(`AND (title ILIKE '%환율%' OR title ILIKE '%달러%원%' OR title ILIKE '%기름값%')`);
    await qOne(`AND (title ILIKE '%토네이도%' OR title ILIKE '%우박%' OR title ILIKE '%빙판%' OR (title ILIKE '%폭풍%' AND (title ILIKE '%달라스%' OR title ILIKE '%DFW%' OR title ILIKE '%텍사스%' OR title ILIKE '%경보%')) OR ((title ILIKE '%달라스%' OR title ILIKE '%DFW%' OR title ILIKE '%텍사스%') AND (title ILIKE '%경보%' OR title ILIKE '%홍수%')))`);
    await qOne(`AND (title ILIKE '%H1B%' OR title ILIKE '%영주권%' OR title ILIKE '%추방%' OR title ILIKE '%ICE%' OR (title ILIKE '%이민%' AND (title ILIKE '%정책%' OR title ILIKE '%단속%')))`);
    await qOne(`AND (title ILIKE '%김혜성%' OR title ILIKE '%이정후%' OR title ILIKE '%류현진%' OR title ILIKE '%손흥민%' OR title ILIKE '%이강인%')`);
    await qOne(`AND (title ILIKE '%BTS%' OR title ILIKE '%방탄%' OR title ILIKE '%블랙핑크%') AND (title ILIKE '%컴백%' OR title ILIKE '%수상%' OR title ILIKE '%빌보드%' OR title ILIKE '%1위%')`);
    await qOne(`AND title ILIKE '%트럼프%' AND (title ILIKE '%관세%' OR title ILIKE '%이민%' OR title ILIKE '%정책%')`);
    await qOne(`AND (source ILIKE '%WFAA%' OR source ILIKE '%dallasnews%')`);
    await qOne(`AND (title ILIKE '%레이오프%' OR title ILIKE '%감원%' OR (title ILIKE '%해고%' AND (title ILIKE '%구글%' OR title ILIKE '%메타%' OR title ILIKE '%애플%')))`);
    const STD = [
      `AND category ILIKE '%한국뉴스%'`,
      `AND category ILIKE '%한국뉴스%'`,
      `AND (category ILIKE '%월드%' OR category ILIKE '%국제%')`,
      `AND (category ILIKE '%경제%' OR title ILIKE '%환율%' OR title ILIKE '%금리%')`,
      `AND (category ILIKE '%연예%' OR category ILIKE '%K-POP%' OR category ILIKE '%스포츠%')`,
      `AND (category ILIKE '%미국%' OR title ILIKE '%트럼프%')`,
      `AND category ILIKE '%스포츠%'`,
      `AND (category ILIKE '%월드%' OR category ILIKE '%국제%')`,
    ];
    for (const w of STD) {
      if (candidateList.length >= 12) break;
      await qOne(w);
    }
    await client.end();
  }

  // 선택된 번호로 뉴스 선별 (1-based)
  const selectedNews = numbers
    .filter(n => n >= 1 && n <= candidateList.length)
    .map(n => candidateList[n - 1]);

  if (selectedNews.length === 0) {
    console.error('선택된 뉴스가 없습니다. 번호를 확인하세요.');
    process.exit(1);
  }

  console.log(`선택된 뉴스 ${selectedNews.length}개:`);
  selectedNews.forEach((n, i) => console.log(`  ${i+1}. ${n.title} (${n.category})`));

  // 날씨 & 날짜
  const weather = await fetchWeather();
  const dateInfo = getKoreanDate();
  console.log(`날씨: 최저 ${weather.minC}°C / 최고 ${weather.maxC}°C · ${weather.desc}`);

  // AI로 TTS 스크립트 생성
  const newsListForAI = selectedNews.map((n, i) => {
    const content = n.content?.slice(0, 300) || n.title;
    return `${i+1}. [${n.category}] ${n.title}\n   내용: ${content}`;
  }).join('\n\n');

  const ttsPrompt = `달커넥트 아침 브리핑 TTS 스크립트를 작성해주세요.

날짜: ${dateInfo.label}
날씨: ${weather.desc}, 최저 ${weather.minF}도, 최고 ${weather.maxF}도
뉴스 ${selectedNews.length}개:

${newsListForAI}

규칙:
- 구조: 인사 → 날짜+요일 → 날씨 → 뉴스(번호순) → 마무리
- "오늘의 주요 소식 N가지 전해드립니다" 같은 전환 문장 금지 — 날씨 끝나면 바로 "첫번째 소식입니다"로 시작
- 번호 형식: "첫번째 소식입니다. / 두번째입니다. / 마지막 소식입니다."
- 각 소식 2-3문장 (전체 130초 이내)
- 고속도로: I-35E, I-30 등 영어 그대로
- 숫자: 한국어 읽기 ("천오백원대", "열네 명")
- 마무리: "오늘 달커넥트 뉴스 여기까지입니다. 더 자세한 내용은 달커넥트닷컴에서 만나보세요. 즐거운 ${dateInfo.dayOfWeek}요일 되세요. 감사합니다."
- TTS 스크립트만 출력 (설명 없이)`;

  console.log('\nAI TTS 스크립트 생성 중...');
  let ttsScript = await askAI(ttsPrompt, { maxTokens: 2000 });
  console.log('✅ TTS 스크립트 생성 완료');

  // ─── 스크립트 자동 검증 + 수정 ────────────────────────────
  // 영어가 섞인 채로 TTS 생성하면 "바치 레인 너바이" 같은 오발음 발생
  // → 오디오 만들기 전에 여기서 먼저 잡는다
  ttsScript = (function autoFixScript(script) {
    // 1. 날씨 영어 설명 교체 (AI가 날씨를 영어 그대로 쓰는 경우)
    const WEATHER_PATTERNS = [
      [/Patchy rain nearby/gi, '간헐적 소나기'],
      [/Patchy rain possible/gi, '간헐적 소나기'],
      [/Light rain shower/gi, '가벼운 소나기'],
      [/Light rain/gi, '가벼운 비'],
      [/Moderate rain/gi, '보통 비'],
      [/Heavy rain/gi, '강한 비'],
      [/Partly cloudy/gi, '구름 조금'],
      [/Overcast/gi, '흐림'],
      [/Cloudy/gi, '흐림'],
      [/Sunny/gi, '맑음'],
      [/Clear/gi, '맑음'],
      [/Thundery outbreaks possible/gi, '천둥번개 가능'],
      [/Thundery outbreaks/gi, '천둥번개'],
      [/Blizzard/gi, '눈보라'],
      [/Light snow/gi, '가벼운 눈'],
      [/Moderate snow/gi, '보통 눈'],
      [/Freezing drizzle/gi, '얼어붙는 이슬비'],
      [/Light sleet/gi, '진눈깨비'],
      [/Fog\b/gi, '안개'],
      [/Mist\b/gi, '안개'],
    ];
    let fixed = script;
    for (const [pat, ko] of WEATHER_PATTERNS) {
      if (pat.test(fixed)) {
        console.log(`🔧 날씨 자동 수정: "${fixed.match(pat)?.[0]}" → "${ko}"`);
        fixed = fixed.replace(pat, ko);
      }
    }

    // 2. 허용된 영어 약어 (TTS가 읽어도 자연스러운 것들)
    const ALLOWED = new Set(['I-35', 'I-30', 'I-20', 'I-45', 'DFW', 'NFL', 'NBA', 'MLB', 'MLS',
      'LPGA', 'BTS', 'NASA', 'ICE', 'H1B', 'USCIS', 'K-POP', 'SNS', 'AI', 'IT',
      'LAFC', 'LA', 'NY', 'DC', 'US', 'UN', 'EU', 'GDP', 'CPI', 'WBC', 'LPGA',
      'PSG', 'CEO', 'FBI', 'CIA', 'CDC', 'WHO', 'IRS']);

    // 3. 4글자 이상 연속 영어 감지 → 경고 출력 (허용 목록 제외)
    const englishWords = [...fixed.matchAll(/[A-Za-z]{4,}/g)];
    for (const m of englishWords) {
      const w = m[0].toUpperCase();
      if (!ALLOWED.has(w) && !ALLOWED.has(m[0])) {
        console.warn(`⚠️  스크립트 영어 감지: "${m[0]}" (위치 ${m.index}) — 수동 확인 필요`);
      }
    }

    return fixed;
  })(ttsScript);
  // ── 검증 끝 ──────────────────────────────────────────────

  // 슬라이드 설정 생성
  const slides = [
    {
      id: 0,
      category: '인트로',
      icon: '📰',
      title: `${dateInfo.month}월 ${dateInfo.day}일 ${dateInfo.dayOfWeek}요일`,
      subtitle: '달커넥트 아침 브리핑',
      accent: '#60a5fa',
      bg: 'linear-gradient(160deg,#0a0c14 0%,#1a2540 50%,#0a0c14 100%)',
      badge: '달커넥트 아침브리핑',
    },
  ];

  // 뉴스별 슬라이드
  const aiSummaryPrompt = `아래 뉴스 목록 각각에 대해 슬라이드 subtitle을 생성해주세요.
subtitle = 핵심 키워드 2-3개를 " · " 로 연결 (20자 이내).
JSON 배열만 출력: ["subtitle1", "subtitle2", ...]

${selectedNews.map((n,i) => `${i+1}. ${n.title}`).join('\n')}`;

  const subtitleJson = await askAI(aiSummaryPrompt, { maxTokens: 500 });
  let subtitles = [];
  try {
    const match = subtitleJson.match(/\[[\s\S]*\]/);
    if (match) subtitles = JSON.parse(match[0]);
  } catch (_) {}

  selectedNews.forEach((n, i) => {
    const slideConf = getCategorySlide(n.category);
    const title = getCategoryTitle(n.category);
    const subtitle = subtitles[i] || n.title.slice(0, 20);
    slides.push({
      id: i + 1,
      category: title,
      icon: slideConf.icon,
      title,
      subtitle,
      accent: slideConf.accent,
      bg: slideConf.bg,
      badge: slideConf.badge,
    });
  });

  // CTA 슬라이드
  slides.push({
    id: slides.length,
    category: 'CTA',
    icon: '👇',
    title: '달커넥트',
    subtitle: 'dalkonnect.com',
    accent: '#60a5fa',
    bg: 'linear-gradient(160deg,#0a0c14 0%,#1a2540 50%,#0a0c14 100%)',
    badge: '달커넥트',
  });

  // 캡션 생성
  const captionLines = selectedNews.map((n, i) => {
    const slide = slides[i + 1];
    return `${slide.icon} ${subtitles[i] || n.title.slice(0, 25)}`;
  });

  const caption = `☀️ 달커넥트 아침 브리핑 | ${dateInfo.month}월 ${dateInfo.day}일

오늘 꼭 알아야 할 달라스 & 한국 소식 ⬇️

${captionLines.join('\n')}

매일 아침 달라스 한인 뉴스 👉 dalkonnect.com
팔로우하고 매일 받아보세요!

#달커넥트 #달라스한인 #DFW한인 #아침브리핑 #한인뉴스 #달라스뉴스 #DalKonnect`;

  // 썸네일 헤드라인 (가장 임팩트 있는 뉴스 1개)
  const thumbnailHeadlinePrompt = `아래 뉴스 중 가장 임팩트 있는 것 하나를 한 줄(20자 이내)로 요약해주세요. 텍스트만 출력:
${selectedNews.map((n,i) => `${i+1}. ${n.title}`).join('\n')}`;
  const thumbnailHeadline = (await askAI(thumbnailHeadlinePrompt, { maxTokens: 100 })).trim().replace(/^["']|["']$/g, '');

  // 폴더 생성
  const reelDir = path.join(BASE, 'memory', 'morning-reels', dateInfo.dateStr);
  fs.mkdirSync(reelDir, { recursive: true });

  // briefing-config.json 저장
  const config = {
    date: dateInfo.dateStr,
    dateLabel: dateInfo.label,
    weather,
    slides,
    caption,
    thumbnailHeadline,
    newsItems: selectedNews.map((n, i) => ({
      index: i + 1,
      title: n.title,
      category: n.category,
      source: n.source,
      subtitle: subtitles[i] || '',
    })),
  };
  const configPath = path.join(reelDir, 'briefing-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ briefing-config.json 저장: ${configPath}`);

  // tts-script.txt 저장
  const scriptPath = path.join(reelDir, 'tts-script.txt');
  fs.writeFileSync(scriptPath, ttsScript);
  console.log(`✅ tts-script.txt 저장: ${scriptPath}`);

  // ─── Google TTS 자동 음성 생성 (v1beta1 + mark 타이밍) ──────
  console.log('\n🎙️ Google TTS 음성 생성 중 (v1beta1 + mark timing)...');
  const apiKeysEnv = fs.existsSync('/Users/aaron/.claude/api-keys.env')
    ? fs.readFileSync('/Users/aaron/.claude/api-keys.env', 'utf8') : '';
  const ttsKeyMatch = apiKeysEnv.match(/GOOGLE_TTS_KEY=(.+)/);
  const ttsKey = ttsKeyMatch ? ttsKeyMatch[1].trim() : null;

  const voiceRawMp3 = path.join(reelDir, 'voice_raw.mp3');
  const wordTimingsPath = path.join(reelDir, 'word-timings.json');

  if (ttsKey) {
    // SSML with marks 생성 — 전체 스크립트를 한 번에 처리
    const { ssml: ssmlFull, wordList } = buildSSMLWithMarks(ttsScript);

    // SSML이 너무 길면 청크 분할 (mark 태그 포함 5000자 기준)
    // 단, mark 타이밍을 정확히 맞추려면 청크당 word index offset 추적 필요
    const ssmlInner = ssmlFull.replace(/^<speak>/, '').replace(/<\/speak>$/, '');
    const ssmlChunks = [];
    const chunkWordOffsets = []; // 각 청크의 첫 번째 단어 index

    // mark 태그 경계에서만 분할 (태그 중간 절대 자르지 않음)
    const markSplit = ssmlInner.split(/(?=<mark name="w_)/);
    let curChunk = '';
    let curOffset = 0;
    let chunkStartWord = 0;
    for (const part of markSplit) {
      const m = part.match(/<mark name="w_(\d+)"\/>/);
      if (m && (curChunk + part).length > 4000 && curChunk.length > 0) {
        ssmlChunks.push(`<speak>${curChunk}</speak>`);
        chunkWordOffsets.push(chunkStartWord);
        chunkStartWord = parseInt(m[1]);
        curChunk = part;
      } else {
        curChunk += part;
      }
    }
    if (curChunk.trim()) {
      ssmlChunks.push(`<speak>${curChunk}</speak>`);
      chunkWordOffsets.push(chunkStartWord);
    }

    const audioBuffers = [];
    const allTimepoints = []; // 전체 word timings 수집
    let chunkTimeOffset = 0; // 이전 청크 오디오 길이 누적

    for (let i = 0; i < ssmlChunks.length; i++) {
      console.log(`  청크 ${i+1}/${ssmlChunks.length} 생성 중...`);
      const body = JSON.stringify({
        input: { ssml: ssmlChunks[i] },
        voice: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
        enableTimePointing: ['SSML_MARK'],
      });
      const result = await new Promise((res, rej) => {
        const req = https.request({
          hostname: 'texttospeech.googleapis.com',
          path: `/v1beta1/text:synthesize?key=${ttsKey}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, (r) => {
          let buf = '';
          r.on('data', c => buf += c);
          r.on('end', () => { try { res(JSON.parse(buf)); } catch (e) { rej(e); } });
        });
        req.on('error', rej);
        req.write(body);
        req.end();
      });

      if (result.audioContent) {
        const audioBuf = Buffer.from(result.audioContent, 'base64');
        audioBuffers.push(audioBuf);

        // mark timepoints 수집 — 시간에 청크 오프셋 더하기
        if (result.timepoints && result.timepoints.length > 0) {
          for (const tp of result.timepoints) {
            const wordIdx = parseInt(tp.markName.replace('w_', ''));
            allTimepoints.push({
              word: wordList[wordIdx] || '',
              wordIdx,
              time: tp.timeSeconds + chunkTimeOffset,
            });
          }
        }

        // 다음 청크의 시간 오프셋 계산 (MP3 길이 ffprobe로)
        if (ssmlChunks.length > 1) {
          const tmpMp3 = path.join(reelDir, `chunk_probe_${i}.mp3`);
          fs.writeFileSync(tmpMp3, audioBuf);
          try {
            const dur = parseFloat(
              execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${tmpMp3}"`, { encoding: 'utf8' }).trim()
            );
            chunkTimeOffset += dur;
          } catch (_) { /* 오류 시 대략 추정 불가 — offset 누적 생략 */ }
          fs.unlinkSync(tmpMp3);
        }
      } else {
        console.error(`  ❌ 청크 ${i+1} 실패:`, JSON.stringify(result.error || result).slice(0, 200));
      }
    }

    if (audioBuffers.length > 0) {
      // 오디오 합치기
      if (audioBuffers.length === 1) {
        fs.writeFileSync(voiceRawMp3, audioBuffers[0]);
      } else {
        const tmpFiles = audioBuffers.map((buf, i) => {
          const tmp = path.join(reelDir, `chunk_${i}.mp3`);
          fs.writeFileSync(tmp, buf);
          return tmp;
        });
        const listFile = path.join(reelDir, 'chunks.txt');
        fs.writeFileSync(listFile, tmpFiles.map(f => `file '${f}'`).join('\n'));
        execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${voiceRawMp3}"`);
        tmpFiles.forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
        fs.unlinkSync(listFile);
      }
      console.log(`✅ Google TTS 음성 생성 완료: ${voiceRawMp3}`);

      // word-timings.json 저장
      if (allTimepoints.length > 0) {
        fs.writeFileSync(wordTimingsPath, JSON.stringify(allTimepoints, null, 2));
        console.log(`✅ word-timings.json 저장: ${wordTimingsPath} (${allTimepoints.length}개 단어)`);
      } else {
        console.warn('⚠️ timepoints 없음 — v1beta1이 mark 타이밍을 반환하지 않았거나 단일 청크 오류');
      }
    } else {
      console.error('❌ Google TTS 모든 청크 실패');
    }
  } else {
    console.error('❌ GOOGLE_TTS_KEY 없음 — 수동 녹음 필요');
  }

  // ─── Telegram 전송 ────────────────────────────────────────
  const ttsReady = fs.existsSync(voiceRawMp3);

  if (ttsReady) {
    // 음성 파일을 먼저 전송 — Aaron이 듣고 승인 후 파이프라인 실행
    console.log('\n📤 Telegram으로 음성 파일 전송 중...');
    const audioCaption = `🎙 ${dateInfo.label} 아침 브리핑 음성 미리보기\n\n들어보시고 이상 없으면 아래 명령어로 영상 제작:\nbriefing-pipeline.sh ${dateInfo.dateStr} ${voiceRawMp3}`;
    const audioSent = await sendTelegramAudio(voiceRawMp3, audioCaption);
    if (audioSent.ok) {
      console.log('✅ 음성 파일 Telegram 전송 완료');
    }
    // 확인 메시지도 전송
    await sendTelegram(
      `🎙️ <b>${dateInfo.label} 아침 브리핑 음성</b>\n\n` +
      `✅ Google TTS 자동 생성 완료\n` +
      `📁 파일: <code>${voiceRawMp3}</code>\n\n` +
      `👂 위 음성 파일을 들어보시고 이상 없으면 답장해주세요.\n` +
      `영상 제작 명령어:\n<code>bash cron/briefing-pipeline.sh ${dateInfo.dateStr} ${voiceRawMp3}</code>`
    );
  } else {
    // TTS 실패 시 스크립트 텍스트 전송
    await sendTelegram(
      `📝 <b>${dateInfo.label} 아침 브리핑 TTS 스크립트</b>\n\n` +
      `<pre>${ttsScript.slice(0, 3500)}</pre>\n\n` +
      `⚠️ TTS 자동 생성 실패 — 수동 녹음 후 아래 명령어 실행:\n` +
      `<code>bash cron/briefing-pipeline.sh ${dateInfo.dateStr} /path/to/voice.wav</code>`
    );
    console.error('❌ TTS 음성 생성 실패 — 파이프라인 중단');
  }

  console.log('\n✅ Phase 2 완료!');
  console.log(`   TTS 스크립트: ${scriptPath}`);
  console.log(`   브리핑 설정: ${configPath}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
