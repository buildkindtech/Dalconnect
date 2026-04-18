#!/usr/bin/env node
/**
 * 아침 브리핑 Phase 3a — 릴스 렌더러
 *
 * 사용법:
 *   node briefing-render.cjs YYYY-MM-DD
 *
 * 타이밍 소스 (우선순위 순):
 *   1. slide-timings.json   — Google TTS <mark> 태그 반환값 (가장 정확)
 *   2. tts-script.txt       — 스크립트 글자 수 비례 계산 (Whisper 불필요)
 *   3. voice_1.20x.json     — Whisper 전사 fallback (구형)
 *
 * 필수 파일:
 *   memory/morning-reels/YYYY-MM-DD/briefing-config.json
 *   memory/morning-reels/YYYY-MM-DD/voice_1.20x.mp3
 *
 * 생성 파일:
 *   memory/morning-reels/YYYY-MM-DD/frames/
 *   memory/morning-reels/YYYY-MM-DD/concat.txt
 *   memory/morning-reels/YYYY-MM-DD/news-briefing-MMDD.mp4
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const BGM = path.join(BASE, 'memory/reels-diabetes/bgm-lofi.mp3');

// ─── 인수 ─────────────────────────────────────────────────
const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('사용법: node briefing-render.cjs YYYY-MM-DD');
  process.exit(1);
}

const DATE_DIR = path.join(BASE, 'memory', 'morning-reels', dateArg);
const CONFIG_PATH = path.join(DATE_DIR, 'briefing-config.json');
const WHISPER_JSON = path.join(DATE_DIR, 'voice_1.20x.json');
const VOICE = path.join(DATE_DIR, 'voice_1.20x.mp3');
const FRAMES_DIR = path.join(DATE_DIR, 'frames');
const mmdd = dateArg.slice(5).replace('-', '');
const FINAL = path.join(DATE_DIR, `news-briefing-${mmdd}.mp4`);

// ─── 검증 (voice_1.20x.json은 optional) ──────────────────────
for (const f of [CONFIG_PATH, VOICE]) {
  if (!fs.existsSync(f)) {
    console.error(`❌ 파일 없음: ${f}`);
    process.exit(1);
  }
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const SLIDES = config.slides;
if (!SLIDES || SLIDES.length < 2) {
  console.error('❌ briefing-config.json에 slides 데이터 없음');
  process.exit(1);
}

// ─── 스크립트 기반 타이밍 함수 ─────────────────────────────────

/**
 * 스크립트 단어 목록 + 전체 오디오 길이 → 각 단어의 표시 시작 시간 배열
 * - 단어별 글자 수에 비례하여 시간 배분 (TTS는 글자 수에 비례해서 발음됨)
 * - SSML <break> 위치를 고려해 정확도 향상
 * - 1.2x 속도 보정 적용
 */
function calcScriptWordTimings(scriptWords, totalAudioDur) {
  const SPEED = 1.2;

  // buildSSMLWithMarks와 동일한 SSML 쉼 구조 반영
  const CATEGORY_HEADERS = [
    '달라스 로컬 소식입니다', '미국 뉴스입니다', '한국 뉴스입니다',
    '스포츠 소식입니다', '연예 소식입니다', '이민 소식입니다', '월드 뉴스입니다',
    '오늘 달커넥트 뉴스 여기까지입니다',
  ];

  const charCounts = scriptWords.map(w =>
    Math.max(w.replace(/[.,!?。、\s]/g, '').length, 1)
  );
  const breakBefore = new Array(scriptWords.length).fill(0);
  const breakAfter  = new Array(scriptWords.length).fill(0);

  for (let i = 0; i < scriptWords.length; i++) {
    const w = scriptWords[i];
    const wClean = w.replace(/[.,!?]/g, '');

    // 카테고리 헤더 첫 단어 앞 600ms (buildSSMLWithMarks와 동일)
    for (const h of CATEGORY_HEADERS) {
      const hWords = h.split(' ');
      if (wClean === hWords[0]) {
        const phrase = scriptWords.slice(i, i + hWords.length)
          .map(x => x.replace(/[.,!?]/g, '')).join(' ');
        if (phrase === h) {
          breakBefore[i] += 0.600 / SPEED;
          break;
        }
      }
    }

    // 문장 끝(.!?) 뒤 350ms (buildSSMLWithMarks와 동일)
    if (/[.!?]$/.test(w) && i + 1 < scriptWords.length) {
      breakAfter[i] += 0.350 / SPEED;
    }
  }

  // 총 쉼 시간 제외한 순수 발화 시간
  const totalBreak = breakBefore.reduce((a,b)=>a+b,0) + breakAfter.reduce((a,b)=>a+b,0);
  const speechDur = Math.max(totalAudioDur - totalBreak, totalAudioDur * 0.6);
  const totalChars = charCounts.reduce((a,b)=>a+b,0);
  const charDurSec = speechDur / totalChars;

  // 단어별 시작 시간 계산
  const starts = [];
  let t = 0;
  for (let i = 0; i < scriptWords.length; i++) {
    t += breakBefore[i];
    starts.push(t);
    t += charCounts[i] * charDurSec;
    t += breakAfter[i];
  }
  return starts;
}

/**
 * 스크립트 단어 + 타임스탬프 → 슬라이드 전환 시점 목록
 *
 * 핵심 원칙:
 *   1. 카테고리 헤더("달라스 로컬 소식입니다" 등) → 해당 카테고리 첫 슬라이드로 전환
 *   2. 카테고리 내 추가 슬라이드 수 = (slides에서 해당 category 슬라이드 수 - 1)
 *      → 그 수만큼만 문장 경계(.)에서 추가 전환 (초과 전환 없음)
 */
/**
 * detectTransitionsFromScript
 * - 카테고리 헤더는 스크립트 단어 + 타임스탬프로 감지
 * - 카테고리 내 추가 슬라이드는 slide subtitle 키워드를 Whisper에서 찾아 전환 (whisperFlat 제공 시)
 * - whisperFlat 없으면 구형 문장 경계 방식 fallback
 */
function detectTransitionsFromScript(scriptWords, wordTimestamps, slides, whisperFlat) {
  const CATEGORY_HEADERS = [
    { words: ['달라스', '로컬', '소식입니다'], cat: '달라스 로컬' },
    { words: ['미국', '뉴스입니다'],           cat: '미국 뉴스' },
    { words: ['한국', '뉴스입니다'],           cat: '한국 뉴스' },
    { words: ['스포츠', '소식입니다'],         cat: '스포츠' },
    { words: ['연예', '소식입니다'],           cat: '연예' },
    { words: ['이민', '소식입니다'],           cat: '이민' },
    { words: ['월드', '뉴스입니다'],           cat: '월드' },
  ];

  const catSlideCount = {};
  for (const slide of slides) {
    if (slide.category === '인트로' || slide.category === 'CTA') continue;
    catSlideCount[slide.category] = (catSlideCount[slide.category] || 0) + 1;
  }

  // 카테고리별 슬라이드 목록 (slideIdx 포함)
  const catSlidesMap = {};
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (s.category === '인트로' || s.category === 'CTA') continue;
    if (!catSlidesMap[s.category]) catSlidesMap[s.category] = [];
    catSlidesMap[s.category].push({ slide: s, slideIdx: i });
  }

  // ── subtitle 키워드 추출 + Whisper 검색 (whisperFlat 제공 시) ──────────────
  const KW_SKIP = new Set([
    '이란', '미국', '한국', '달라스', '트럼프', '뉴스', '소식', '추진', '귀환',
    '협상', '경고', '확정', '우승', '발매', '발표', '예고', '공격', '대비',
    '텍사스', '지정', '에서', '것으로', '위해', '이후', '추가', '예상',
  ]);
  function extractKws(subtitle) {
    return subtitle
      .replace(/[.,!?·×°「」『』【】《》\-–—·]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length >= 2 && !KW_SKIP.has(w));
  }
  function normW(w) { return (w || '').replace(/[.,!?。、·\s]/g, '').toLowerCase(); }
  function findKwInWhisper(keywords, fromT, toT) {
    if (!whisperFlat) return null;
    for (const wt of whisperFlat) {
      if (wt.start < fromT) continue;
      if (wt.start > toT) break;
      const wn = normW(wt.word);
      if (!wn) continue;
      for (const kw of keywords) {
        const kwn = normW(kw);
        if (kwn.length < 2) continue;
        // 앞 70% 글자 일치 (Korean stem match)
        const stem = kwn.substring(0, Math.max(2, Math.floor(kwn.length * 0.7)));
        if (stem.length >= 2 && wn.startsWith(stem)) return wt.start;
      }
    }
    return null;
  }

  const transitions = [{ slideIdx: 0, time: 0 }];
  let newsIdx = 1;
  const newsSlideCount = slides.filter(s => s.category !== '인트로' && s.category !== 'CTA').length;
  const headerFirstWords = new Set(CATEGORY_HEADERS.map(h => h.words[0]));
  let currentCatSlotsLeft = 0; // 구형 fallback용

  // 카테고리 헤더 시간 캡처 (within-category 키워드 검색 범위 결정용)
  const capturedCats = []; // { cat, startTime, endTime, catSlidesList }

  for (let i = 0; i < scriptWords.length; i++) {
    if (newsIdx > newsSlideCount) break;
    const w = scriptWords[i];
    const wClean = w.replace(/[.,!?]/g, '');

    // CTA
    if (wClean.includes('여기까지')) {
      const ctaSlide = slides[slides.length - 1];
      if (ctaSlide?.category === 'CTA') {
        transitions.push({ slideIdx: slides.length - 1, time: wordTimestamps[i] });
      }
      break;
    }

    // ── 순서 번호 방식 감지 ("첫 번째 소식입니다", "두 번째입니다", "마지막 소식입니다") ──
    // "번째" 포함 단어 → 서수 시작 시점에 슬라이드 전환 (ex: "첫"이 들리는 순간 바뀜)
    if (wClean.includes('번째') && newsIdx <= newsSlideCount) {
      const lookAhead = scriptWords.slice(i, i + 4).map(x => x.replace(/[.,!?]/g, '')).join('');
      if (lookAhead.includes('소식') || lookAhead.includes('입니다')) {
        // 서수 시작 단어 찾기:
        // "첫번째" (붙은 형태) → 이 단어 자체가 서수 시작 → i 사용
        // "첫 번째" (띄어쓴 형태) → 앞 단어("첫")가 서수 시작 → i-1 사용
        const ORDINALS = ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
        const prevWord = (i > 0) ? scriptWords[i - 1].replace(/[.,!?]/g, '') : '';
        const isSelfOrdinal = wClean.match(/^(첫|두|세|네|다섯|여섯|일곱|여덟|아홉|열|한)/);
        const ordinalStart = (ORDINALS.includes(prevWord) && !isSelfOrdinal) ? i - 1 : i;
        const transTime = wordTimestamps[ordinalStart];
        // "소식입니다" 끝 찾기 (skip용)
        let skipIdx = i;
        for (let j = i; j < Math.min(i + 4, scriptWords.length); j++) {
          const jClean = scriptWords[j].replace(/[.,!?]/g, '');
          if (jClean.includes('입니다') || jClean.includes('소식입니다')) { skipIdx = j; break; }
        }
        transitions.push({ slideIdx: newsIdx++, time: transTime });
        i = skipIdx;
        continue;
      }
    }
    // "마지막" + "소식" 패턴 — "마지막"이 들리는 순간 전환
    if (wClean === '마지막' && newsIdx <= newsSlideCount) {
      const lookAhead = scriptWords.slice(i, i + 3).map(x => x.replace(/[.,!?]/g, '')).join('');
      if (lookAhead.includes('소식')) {
        const transTime = wordTimestamps[i]; // "마지막" 시작 시점
        let skipIdx = i;
        for (let j = i; j < Math.min(i + 3, scriptWords.length); j++) {
          const jClean = scriptWords[j].replace(/[.,!?]/g, '');
          if (jClean.includes('입니다') || jClean.includes('소식입니다')) { skipIdx = j; break; }
        }
        transitions.push({ slideIdx: newsIdx++, time: transTime });
        i = skipIdx;
        continue;
      }
    }

    // 카테고리 헤더 감지
    if (headerFirstWords.has(wClean)) {
      for (const h of CATEGORY_HEADERS) {
        if (wClean !== h.words[0]) continue;
        const phrase = scriptWords.slice(i, i + h.words.length)
          .map(x => x.replace(/[.,!?]/g, '')).join(' ');
        if (phrase === h.words.join(' ')) {
          const catStart = wordTimestamps[i];
          const catSlidesList = catSlidesMap[h.cat] || [];

          // 이전 카테고리 endTime 마감
          if (capturedCats.length > 0 && capturedCats[capturedCats.length - 1].endTime === null) {
            capturedCats[capturedCats.length - 1].endTime = catStart;
          }

          if (whisperFlat && catSlidesList.length > 1) {
            // Hybrid 모드: 첫 슬라이드만 여기서 추가, 나머지는 loop 후 키워드 검색
            transitions.push({ slideIdx: newsIdx, time: catStart });
            capturedCats.push({ cat: h.cat, startTime: catStart, endTime: null, catSlidesList });
            newsIdx += catSlidesList.length;
          } else {
            // 구형 모드 (Whisper 없거나 슬라이드 1개)
            transitions.push({ slideIdx: newsIdx++, time: catStart });
            currentCatSlotsLeft = (catSlideCount[h.cat] || 1) - 1;
          }
          i += h.words.length - 1;
          break;
        }
      }
      continue;
    }

    // 구형 fallback: 문장 끝 → 카테고리 내 추가 슬라이드
    if (!whisperFlat && currentCatSlotsLeft > 0 && /[.!?]$/.test(w) && newsIdx <= newsSlideCount) {
      const nextWord = scriptWords[i + 1];
      if (nextWord) {
        const nextClean = nextWord.replace(/[.,!?]/g, '');
        const isNextHeader = CATEGORY_HEADERS.some(h => nextClean === h.words[0]);
        if (!isNextHeader) {
          transitions.push({ slideIdx: newsIdx++, time: wordTimestamps[i + 1] });
          currentCatSlotsLeft--;
        }
      }
    }
  }

  // 마지막 카테고리 endTime 마감
  if (capturedCats.length > 0 && capturedCats[capturedCats.length - 1].endTime === null) {
    capturedCats[capturedCats.length - 1].endTime = wordTimestamps[wordTimestamps.length - 1] || totalDur;
  }

  // ── Hybrid 모드: 카테고리 내 추가 슬라이드 — subtitle 키워드로 Whisper 검색 ──
  for (const catInfo of capturedCats) {
    const { cat, startTime, endTime, catSlidesList } = catInfo;
    if (catSlidesList.length <= 1) continue;

    let searchFrom = startTime + 0.5;
    for (let si = 1; si < catSlidesList.length; si++) {
      const { slide, slideIdx } = catSlidesList[si];
      const kws = extractKws(slide.subtitle);
      let kTime = findKwInWhisper(kws, searchFrom, endTime || totalDur);

      if (kTime !== null) {
        console.log(`  ✅ ${cat}[${si}] "${kws.slice(0, 2).join(', ')}" → ${kTime.toFixed(2)}s`);
        transitions.push({ slideIdx, time: kTime });
        searchFrom = kTime + 0.5;
      } else {
        // Fallback: 비례 분할
        const ratio = si / catSlidesList.length;
        kTime = startTime + ((endTime || totalDur) - startTime) * ratio;
        console.warn(`  ⚠️ ${cat}[${si}] 키워드 미감지 → fallback ${kTime.toFixed(2)}s (kws: ${kws.slice(0,3).join(', ')})`);
        transitions.push({ slideIdx, time: kTime });
        searchFrom = kTime + 0.5;
      }
    }
  }

  transitions.sort((a, b) => a.time - b.time);

  const detectedNews = transitions.filter(t => {
    const s = slides[t.slideIdx];
    return s && s.category !== '인트로' && s.category !== 'CTA';
  }).length;
  console.log(`  전환 감지: ${detectedNews}/${newsSlideCount}`);

  if (detectedNews < Math.ceil(newsSlideCount / 2)) {
    console.warn(`⚠️ 감지 불충분 — 균등 분배 fallback`);
    const totalT = wordTimestamps[wordTimestamps.length - 1] || totalDur;
    transitions.length = 0;
    for (let i = 0; i < slides.length; i++) {
      transitions.push({ slideIdx: i, time: (i / slides.length) * totalT });
    }
  }

  return transitions;
}

// ─── Whisper 데이터 파싱 ───────────────────────────────────────
const whisperData = fs.existsSync(WHISPER_JSON)
  ? JSON.parse(fs.readFileSync(WHISPER_JSON, 'utf8'))
  : null;

// Whisper 단어 평탄화 (모듈 레벨 — detectTransitionsFromScript + alignScriptToWhisper 공용)
const whisperFlatGlobal = [];
if (whisperData) {
  for (const seg of whisperData.segments) {
    for (const w of (seg.words || [])) {
      if (w.word && w.word.trim()) whisperFlatGlobal.push(w);
    }
  }
}

/**
 * 스크립트 단어 배열 ↔ Whisper 단어 배열 시퀀스 정렬 (DP)
 * - 스크립트 텍스트를 화면에 표시, Whisper 타임스탬프만 타이밍에 사용
 * - 리턴: [{word: scriptWord, start, end}] (스크립트 단어 수와 동일)
 */
function alignScriptToWhisper(scriptWords, whisperWords) {
  function norm(w) {
    return w.replace(/[\s.,!?·]/g, '').toLowerCase();
  }
  const n = scriptWords.length;
  const m = whisperWords.length;
  const GAP = 0.5;

  function cost(sw, ww) {
    const sn = norm(sw), wn = norm(ww.word || '');
    if (!sn || !wn) return 1;
    if (sn === wn) return 0;
    if (sn.includes(wn) || wn.includes(sn)) return 0.1;
    // 공통 접두사
    let common = 0;
    for (let k = 0; k < Math.min(sn.length, wn.length); k++) {
      if (sn[k] === wn[k]) common++; else break;
    }
    return common >= 2 ? 0.3 : 1;
  }

  // DP 테이블 (Float32Array로 메모리 절약)
  const dp = Array.from({length: n + 1}, (_, i) =>
    new Float32Array(m + 1).fill(0).map((_, j) => i === 0 ? j * GAP : j === 0 ? i * GAP : 0)
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j-1] + cost(scriptWords[i-1], whisperWords[j-1]),
        dp[i-1][j] + GAP,
        dp[i][j-1] + GAP
      );
    }
  }

  // Traceback
  const mapping = new Array(n).fill(null); // script[i] → whisperIdx
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + cost(scriptWords[i-1], whisperWords[j-1])) {
      mapping[i-1] = j-1; i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i-1][j] + GAP) {
      i--; // script word with no whisper match
    } else {
      j--; // whisper word with no script match
    }
  }

  // 결과 배열: 스크립트 단어별 타임스탬프
  const result = scriptWords.map((word, idx) => ({
    word, wordIdx: idx,
    start: mapping[idx] !== null ? (whisperWords[mapping[idx]].start || 0) : null,
    end:   mapping[idx] !== null ? (whisperWords[mapping[idx]].end   || null) : null,
  }));

  // null 구간 보간
  for (let k = 0; k < n; k++) {
    if (result[k].start === null) {
      let prev = k - 1; while (prev >= 0 && result[prev].start === null) prev--;
      let next = k + 1; while (next < n && result[next].start === null) next++;
      const t0 = prev >= 0 ? result[prev].start : 0;
      const t1 = next < n ? result[next].start : (whisperWords[m-1]?.end || totalDur);
      result[k].start = t0 + (t1 - t0) * (k - prev) / (next - prev || 1);
      result[k].end   = result[k].start + 0.25;
    }
  }
  return result;
}

// 오타 교정 딕셔너리 (기본값 — briefing-config.json에 wordCorrections 있으면 우선)
const DEFAULT_CORRECTIONS = {
  '으': '', '어': '', '음': '',  // Chirp3-HD 필러 소리 자막 제거
  '달컨액트': '달커넥트', '달컨액트닷컴에서': '달커넥트닷컴에서',
  '화제가': '화재가', '화제': '화재',
  '오해하세요.': '우회하세요.',
  '도절': '두절',
  '한국의': '한국에',
  '동양': '동향',
  '잔여': '자녀',
  '팔로워하고': '팔로우하고',
  'uscis가': 'USCIS가',
  '$1': '원달러',
};
const WORD_CORRECTIONS = Object.assign({}, DEFAULT_CORRECTIONS, config.wordCorrections || {});

function correctWord(w) { const t = w.trim(); return WORD_CORRECTIONS[t] || t; }

// 세그먼트 파싱 (whisperData가 있을 때만)
const rawSegments = [];
const MAX_WORDS = 10;
const chunkedSegments = [];
if (whisperData) {
  for (const seg of whisperData.segments) {
    const words = (seg.words || []).filter(w => w.word && w.word.trim());
    if (words.length === 0) {
      rawSegments.push([{ word: correctWord(seg.text.trim()), start: seg.start, end: seg.end }]);
    } else {
      rawSegments.push(words.map(w => ({ word: correctWord(w.word.trim()), start: w.start, end: w.end })));
    }
  }
  for (const seg of rawSegments) {
    if (seg.length <= MAX_WORDS) chunkedSegments.push(seg);
    else for (let i = 0; i < seg.length; i += MAX_WORDS) chunkedSegments.push(seg.slice(i, i + MAX_WORDS));
  }
}

const totalDur = parseFloat(execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${VOICE}"`).toString().trim());
console.log(`음성 길이: ${totalDur.toFixed(1)}초`);

// ─── 슬라이드 전환 시점 자동 감지 ─────────────────────────────
// ✅ 핵심 전략: "번째" 단어 감지 → 서수 시작 시점에 슬라이드 전환 (조기 전환)
//   - "첫번째 소식입니다" → "첫번째" 시작 시 전환 (기존: "소식입니다" 이후 전환)
//   - 이렇게 해야 "첫번째 소식입니다 [뉴스내용]" 전체가 새 슬라이드에 표시됨
//   - "첫" + "번째" 분리 전사 시 → "첫".start를 전환 시점으로 사용
//   - "마지막 소식입니다" → "마지막".start를 전환 시점으로 사용
//   - 백업: "소식입니다" 감지 (debounce로 중복 방지)
const CTA_KEYWORD = '여기까지';

function detectTransitions() {
  const allWords = [];
  for (const seg of chunkedSegments) {
    for (const w of seg) allWords.push(w);
  }

  const newsSlideCount = SLIDES.filter(s => s.category !== '인트로' && s.category !== 'CTA').length;
  const transitions = [{ slideIdx: 0, time: 0 }]; // 인트로
  let newsSlideIdx = 1;
  let lastMatchTime = -999;
  const DEBOUNCE = 2.0; // 중복 매칭 방지 (초)

  for (let wi = 0; wi < allWords.length; wi++) {
    const w = allWords[wi];
    if (w.start - lastMatchTime < DEBOUNCE) continue;
    if (newsSlideIdx >= SLIDES.length) break;

    const wClean = w.word.replace(/[.,!?。]/g, '').trim();

    // ✅ "번째" 감지 → 서수 시작 시점에 슬라이드 전환
    //    "첫번째 소식입니다", "두번째입니다", "5번째 소식입니다" 커버
    if (wClean.includes('번째')) {
      const targetSlide = SLIDES[newsSlideIdx];
      if (targetSlide && targetSlide.category !== 'CTA') {
        // 합쳐진 서수 ("첫번째", "5번째") → 이 단어 자체가 서수
        const isSelfOrdinal = /^(첫번째|두번째|세번째|네번째|다섯번째|여섯번째|일곱번째|여덟번째|아홉번째|열번째|\d+번째)$/.test(wClean);
        // 분리된 서수 ("첫" + "번째") → 이전 단어 시작
        const prevWord = wi > 0 ? allWords[wi - 1] : null;
        const prevClean = prevWord ? prevWord.word.replace(/[.,!?。]/g, '').trim() : '';
        const isOrdinalPrefix = prevClean && (
          /^\d+$/.test(prevClean) ||
          ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'].includes(prevClean)
        );
        const transTime = isSelfOrdinal ? w.start
                        : (isOrdinalPrefix && prevWord) ? prevWord.start
                        : w.start;
        transitions.push({ slideIdx: newsSlideIdx, time: transTime });
        newsSlideIdx++;
        lastMatchTime = w.start;
      }
    }

    // ✅ "마지막" 감지 → "마지막 소식입니다" 패턴 (마지막 뉴스 슬라이드)
    if (wClean === '마지막' || wClean.includes('마지막소식')) {
      const nextWord = allWords[wi + 1];
      const nextClean = nextWord ? nextWord.word.replace(/[.,!?。]/g, '').trim() : '';
      if (nextClean.includes('소식') || nextClean.includes('입니다') || wClean.includes('소식')) {
        const targetSlide = SLIDES[newsSlideIdx];
        if (targetSlide && targetSlide.category !== 'CTA') {
          transitions.push({ slideIdx: newsSlideIdx, time: w.start });
          newsSlideIdx++;
          lastMatchTime = w.start;
        }
      }
    }

    // ✅ "소식입니다" 백업 감지 (debounce로 "번째"/"마지막" 이후 중복 방지)
    //    "마지막 소식입니다" 에서 "마지막" 미감지 시 fallback
    if (wClean.includes('소식입니다') || wClean.includes('소식이에요')) {
      const targetSlide = SLIDES[newsSlideIdx];
      if (targetSlide && targetSlide.category !== 'CTA') {
        const nextWordStart = allWords[wi + 1]?.start;
        const transTime = nextWordStart !== undefined
          ? nextWordStart
          : (w.end !== undefined ? w.end : w.start + 0.5);
        transitions.push({ slideIdx: newsSlideIdx, time: transTime });
        newsSlideIdx++;
        lastMatchTime = w.start;
      }
    }

    // CTA 감지 ("여기까지입니다" — 인트로의 "N가지 전해드립니다"와 구분)
    // Whisper가 "10가지" → "여기까지"로 오인식하는 경우 방지:
    // 뉴스 슬라이드를 절반 이상 감지한 후에만, 그리고 바로 다음 단어가 "입니다" 계열인 경우에만 발동
    if (wClean.includes(CTA_KEYWORD) && newsSlideIdx > Math.ceil(newsSlideCount / 2)) {
      const nextWord = allWords[wi + 1];
      const nextClean = nextWord ? nextWord.word.replace(/[.,!?。]/g, '').trim() : '';
      const isRealCTA = wClean.includes('여기까지입니다') || nextClean.startsWith('입니다') || nextClean === '';
      if (isRealCTA) {
        const ctaSlide = SLIDES[SLIDES.length - 1];
        if (ctaSlide && ctaSlide.category === 'CTA') {
          transitions.push({ slideIdx: SLIDES.length - 1, time: w.start });
          break;
        }
      }
    }
  }

  // 감지 결과 확인
  const detectedNews = transitions.filter(t => {
    const s = SLIDES[t.slideIdx];
    return s && s.category !== '인트로' && s.category !== 'CTA';
  }).length;

  if (detectedNews >= newsSlideCount) {
    console.log(`✅ 슬라이드 감지 완료: ${detectedNews}/${newsSlideCount}개`);
  } else if (detectedNews >= Math.ceil(newsSlideCount / 2)) {
    // 절반 이상 감지 → 감지된 것만 사용 (균등 분배보다 훨씬 나음)
    console.warn(`⚠️ ${detectedNews}/${newsSlideCount}개 감지 — 감지된 전환점만 사용`);
    // CTA 슬라이드 없으면 끝부분에 추가
    if (!transitions.some(t => SLIDES[t.slideIdx]?.category === 'CTA')) {
      const ctaSlide = SLIDES[SLIDES.length - 1];
      if (ctaSlide?.category === 'CTA') {
        transitions.push({ slideIdx: SLIDES.length - 1, time: Math.max(totalDur - 6, totalDur * 0.9) });
      }
    }
  } else {
    // 절반 미만 감지 → 균등 분배 fallback
    console.warn(`⚠️ 감지 불충분 (${detectedNews}/${newsSlideCount}) — 균등 분배 fallback`);
    const interval = totalDur / SLIDES.length;
    transitions.length = 0;
    for (let i = 0; i < SLIDES.length; i++) {
      transitions.push({ slideIdx: i, time: i * interval });
    }
  }

  return transitions;
}

// ─── 슬라이드 전환 + 단어 타이밍 (우선순위: slide-timings.json → word-timings.json → 스크립트 계산 → Whisper → 균등) ──
// slide-timings.json: 슬라이드 전환용 (정확한 수동/자동 지정값)
// word-timings.json: 단어별 노란 하이라이트용 (TTS mark 정확 타이밍)
const wordTimingsPath = path.join(DATE_DIR, 'word-timings.json');
const slideTimingsPath = path.join(DATE_DIR, 'slide-timings.json');
const scriptTxtPath_top = path.join(DATE_DIR, 'tts-script.txt');
let TRANSITIONS;
let WORD_TIMINGS = null;

// ── per-word 하이라이트 타이밍: Whisper alignment 우선 → word-timings.json 차선 ──
const scriptTxtForAlign = path.join(DATE_DIR, 'tts-script.txt');
if (whisperData && fs.existsSync(scriptTxtForAlign)) {
  // Whisper + 스크립트 정렬 → 화면엔 스크립트 텍스트, 타이밍은 Whisper
  const scriptText = fs.readFileSync(scriptTxtForAlign, 'utf8');
  const scriptWords = scriptText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(w => w.trim().length > 0);
  WORD_TIMINGS = alignScriptToWhisper(scriptWords, whisperFlatGlobal);
  console.log(`✅ Whisper+스크립트 정렬 완료 (스크립트 ${scriptWords.length}개 / Whisper ${whisperFlatGlobal.length}개)`);
} else if (fs.existsSync(wordTimingsPath)) {
  WORD_TIMINGS = JSON.parse(fs.readFileSync(wordTimingsPath, 'utf8'));
  console.log(`✅ word-timings.json 로드 (${WORD_TIMINGS.length}개 단어 타이밍, 하이라이트용)`);
}

if (fs.existsSync(slideTimingsPath)) {
  // Priority 0: slide-timings.json — 슬라이드 전환 정확 지정값
  const rawTimings = JSON.parse(fs.readFileSync(slideTimingsPath, 'utf8'));
  TRANSITIONS = rawTimings.map(t => ({ slideIdx: t.slideIdx, time: t.time }));
  console.log(`✅ slide-timings.json 사용 — 슬라이드 전환 (${TRANSITIONS.length}개)`);
} else if (WORD_TIMINGS && WORD_TIMINGS.length > 0) {
  // Priority 1: WORD_TIMINGS (Whisper alignment 또는 word-timings.json) → detectTransitionsFromScript
  const scriptText = fs.readFileSync(scriptTxtPath_top, 'utf8');
  const scriptWords = scriptText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(w => w.trim().length > 0);
  // .start 우선, .time 차선 (두 포맷 모두 지원)
  const wtMap = new Map(WORD_TIMINGS.map(wt => [wt.wordIdx, wt.start ?? wt.time]));
  const exactTimestamps = scriptWords.map((_, i) => {
    if (wtMap.has(i)) return wtMap.get(i);
    let prev = i - 1; while (prev >= 0 && !wtMap.has(prev)) prev--;
    let next = i + 1; while (next < scriptWords.length && !wtMap.has(next)) next++;
    const t0 = prev >= 0 ? wtMap.get(prev) : 0;
    const t1 = next < scriptWords.length ? wtMap.get(next) : totalDur;
    return t0 + (t1 - t0) * (i - prev) / (next - prev || 1);
  });
  TRANSITIONS = detectTransitionsFromScript(scriptWords, exactTimestamps, SLIDES, whisperFlatGlobal);
  console.log(`✅ WORD_TIMINGS 기반 슬라이드 전환 (${TRANSITIONS.length}개)`);
} else if (fs.existsSync(scriptTxtPath_top)) {
  // Priority 2: 스크립트 글자 수 비례 계산 (Whisper 불필요)
  const scriptText = fs.readFileSync(scriptTxtPath_top, 'utf8');
  const scriptWords = scriptText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(w => w.trim().length > 0);
  const wordTimestamps = calcScriptWordTimings(scriptWords, totalDur);
  TRANSITIONS = detectTransitionsFromScript(scriptWords, wordTimestamps, SLIDES, whisperFlatGlobal);
  console.log(`✅ 스크립트 기반 타이밍 사용 (${TRANSITIONS.length}개 전환)`);
  // 감지된 전환이 부족하면 균등 분배 보완
  const expectedNews = SLIDES.filter(s => s.category !== '인트로' && s.category !== 'CTA').length;
  const detectedNews = TRANSITIONS.filter(t => {
    const s = SLIDES[t.slideIdx]; return s && s.category !== '인트로' && s.category !== 'CTA';
  }).length;
  if (detectedNews < expectedNews) {
    console.warn(`⚠️ 스크립트 전환 감지 부족 (${detectedNews}/${expectedNews}) — 균등 보완`);
    const interval = totalDur / SLIDES.length;
    TRANSITIONS = SLIDES.map((_, i) => ({ slideIdx: i, time: i * interval }));
  }
} else if (whisperData) {
  // Priority 3: Whisper 전사 기반 (구형 fallback)
  TRANSITIONS = detectTransitions();
  console.log(`✅ Whisper 기반 타이밍 사용`);
} else {
  // Last resort: 균등 분배
  console.warn('⚠️ 타이밍 소스 없음 — 균등 분배 fallback');
  const interval = totalDur / SLIDES.length;
  TRANSITIONS = SLIDES.map((_, i) => ({ slideIdx: i, time: i * interval }));
}

console.log('슬라이드 전환 시점:');
TRANSITIONS.forEach(t => {
  const slide = SLIDES[t.slideIdx];
  console.log(`  [${t.slideIdx}] ${slide?.category || '?'}: ${t.time.toFixed(2)}s`);
});

function getSlideIdxAtTime(t) {
  let idx = 0;
  for (const tr of TRANSITIONS) { if (t >= tr.time) idx = tr.slideIdx; }
  return Math.min(idx, SLIDES.length - 1);
}

// ─── HTML 생성 ─────────────────────────────────────────────
function makeSlideHtml(slide) {
  return `<!DOCTYPE html><html><head><style>
@font-face{font-family:'KR';src:local('Apple SD Gothic Neo');}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;font-family:'Apple SD Gothic Neo','KR',sans-serif;background:${slide.bg};position:relative;overflow:hidden;}
.glow{position:absolute;top:30%;left:50%;transform:translateX(-50%);width:700px;height:700px;background:radial-gradient(circle,${slide.accent}18 0%,transparent 70%);}
.category-area{position:absolute;top:380px;left:0;right:0;text-align:center;padding:0 80px;}
.cat-icon{font-size:90px;margin-bottom:12px;line-height:1.1;}
.cat-title{font-size:52px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:8px;}
.cat-subtitle{font-size:28px;font-weight:700;color:${slide.accent};letter-spacing:1px;}
.cat-line{width:80px;height:4px;background:${slide.accent};border-radius:2px;margin:16px auto 0;}
.watermark{position:absolute;bottom:100px;left:0;right:0;text-align:center;color:rgba(255,255,255,0.2);font-size:18px;font-weight:600;letter-spacing:4px;}
</style></head><body>
<div class="glow"></div>
<div class="category-area">
  <div class="cat-icon">${slide.icon}</div>
  <div class="cat-title">${slide.title}</div>
  <div class="cat-subtitle">${slide.subtitle}</div>
  <div class="cat-line"></div>
</div>
<div class="watermark">DALKONNECT.COM</div>
</body></html>`;
}

// captionOpacity: 0.0 ~ 1.0 (그룹 전환 페이드에 사용)
function makeFrameHtml(bgDataURI, slide, segWords, activeIdx, captionOpacity = 1.0) {
  const wordsHTML = segWords.map((w, i) =>
    `<span class="${i === activeIdx ? 'active' : 'inactive'}">${w.word}</span>`
  ).join(' ');
  return `<!DOCTYPE html><html><head><style>
@font-face{font-family:'KR';src:local('Apple SD Gothic Neo');}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;overflow:hidden;font-family:'Apple SD Gothic Neo','KR',sans-serif;position:relative;}
.bg{position:absolute;inset:0;background:url('${bgDataURI}') center/cover no-repeat;}
.overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 0%,transparent 48%,rgba(0,0,0,0.3) 60%,rgba(0,0,0,0.75) 78%,rgba(0,0,0,0.92) 100%);}
.badge-wrap{position:absolute;top:72px;left:0;right:0;display:flex;justify-content:center;}
.badge{background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.18);border-radius:50px;padding:14px 44px;display:flex;align-items:center;gap:12px;}
.badge-dot{width:12px;height:12px;background:${slide.accent};border-radius:50%;box-shadow:0 0 8px ${slide.accent};}
.badge-text{color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;}
.caption-wrap{position:absolute;left:50px;right:50px;bottom:680px;text-align:center;opacity:${captionOpacity.toFixed(2)};}
.caption-words{font-size:58px;font-weight:900;line-height:1.5;word-break:keep-all;}
.active{color:#FFD700;text-shadow:0 0 25px rgba(255,215,0,0.45),0 2px 6px rgba(0,0,0,1);}
.inactive{color:#FFFFFF;text-shadow:0 2px 6px rgba(0,0,0,0.9);}
.watermark{position:absolute;bottom:100px;left:0;right:0;text-align:center;color:rgba(255,255,255,0.2);font-size:18px;font-weight:600;letter-spacing:4px;}
</style></head><body>
<div class="bg"></div><div class="overlay"></div>
<div class="badge-wrap"><div class="badge"><div class="badge-dot"></div><span class="badge-text">${slide.badge}</span></div></div>
<div class="caption-wrap"><div class="caption-words">${wordsHTML}</div></div>
<div class="watermark">DALKONNECT.COM</div>
</body></html>`;
}

// ─── 렌더링 ───────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const totalWords = chunkedSegments.reduce((s, g) => s + g.length, 0);
  console.log(`📝 ${chunkedSegments.length}개 세그먼트, ${totalWords}개 단어`);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  // 슬라이드 배경 렌더링
  console.log('\n🖼️  슬라이드 배경 생성...');
  const slidePage = await browser.newPage();
  await slidePage.setViewport({ width: 1080, height: 1920 });
  const slideDataURIs = [];
  for (let i = 0; i < SLIDES.length; i++) {
    await slidePage.setContent(makeSlideHtml(SLIDES[i]), { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 300));
    const tmpPath = path.join(DATE_DIR, `_slide-bg-${i}.png`);
    await slidePage.screenshot({ path: tmpPath });
    slideDataURIs.push('data:image/png;base64,' + fs.readFileSync(tmpPath).toString('base64'));
    console.log(`  슬라이드 ${i} (${SLIDES[i].category}) ✓`);
  }
  await slidePage.close();

  // ── 단어 평탄화 (공백 교정된 단어 제거) ──────────────────────
  const allWordsFlatRaw = [];
  for (const seg of chunkedSegments) {
    for (const w of seg) allWordsFlatRaw.push(w);
  }
  // 교정으로 빈 문자열이 된 단어(예: '으'→'') 제거
  const allWordsFlat = allWordsFlatRaw.filter(w => w.word.trim() !== '');

  // ── Display groups 빌드 ───────────────────────────────────────
  const MAX_GROUP_WORDS = 14; // 문장 기반 그룹 최대 단어 수 (2-3줄 분량)
  const DISPLAY_GROUP_SIZE = 10; // Whisper fallback 모드 그룹 크기
  const displayGroups = [];
  const scriptTxtPath = path.join(DATE_DIR, 'tts-script.txt');

  // 문장 경계에서 그룹 분할 (. ! ? 로 끝나는 단어 뒤에서 끊기)
  function splitIntoSentenceGroups(wordObjs, maxWords) {
    const groups = [];
    let cur = [];
    for (let i = 0; i < wordObjs.length; i++) {
      cur.push(wordObjs[i]);
      const isSentenceEnd = /[.!?]$/.test(wordObjs[i].word);
      const isAtMax = cur.length >= maxWords;
      const isLast = i === wordObjs.length - 1;
      if (isSentenceEnd || isAtMax || isLast) {
        groups.push(cur);
        cur = [];
      }
    }
    return groups;
  }

  if (fs.existsSync(scriptTxtPath)) {
    const scriptText = fs.readFileSync(scriptTxtPath, 'utf8');
    const scriptWords = scriptText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(w => w.trim().length > 0);

    // 단어별 타이밍: WORD_TIMINGS(.start) 또는 글자 수 비례 계산
    let wordStarts;
    if (WORD_TIMINGS && WORD_TIMINGS.length > 0) {
      console.log(`📝 WORD_TIMINGS 기반 표시 타이밍 사용 (${WORD_TIMINGS.length}개)`);
      // .start 필드 우선, 없으면 .time 필드 (word-timings.json 구형 포맷 호환)
      const wtMap = new Map(WORD_TIMINGS.map(wt => [wt.wordIdx, wt.start ?? wt.time]));
      wordStarts = scriptWords.map((_, i) => {
        if (wtMap.has(i)) return wtMap.get(i);
        let prev = i - 1;
        while (prev >= 0 && !wtMap.has(prev)) prev--;
        let next = i + 1;
        while (next < scriptWords.length && !wtMap.has(next)) next++;
        const t0 = prev >= 0 ? wtMap.get(prev) : 0;
        const t1 = next < scriptWords.length ? wtMap.get(next) : totalDur;
        return t0 + (t1 - t0) * (i - prev) / (next - prev || 1);
      });
    } else {
      console.log(`📝 스크립트 글자 수 비례 타이밍 사용`);
      wordStarts = calcScriptWordTimings(scriptWords, totalDur);
    }

    // 슬라이드별로 해당 시간 범위에 속하는 단어 수집 → 문장 단위 그룹 분할
    for (let ti = 0; ti < TRANSITIONS.length; ti++) {
      const slideStart = TRANSITIONS[ti].time;
      const slideEnd = ti + 1 < TRANSITIONS.length ? TRANSITIONS[ti + 1].time : totalDur;
      const slideIdx = TRANSITIONS[ti].slideIdx;

      const slideWordObjs = scriptWords
        .map((word, idx) => ({
          word,
          start: wordStarts[idx],
          end: idx + 1 < wordStarts.length ? wordStarts[idx + 1] : totalDur,
          flatIdx: idx,
        }))
        .filter(w => w.start >= slideStart - 0.05 && w.start < slideEnd - 0.05);

      if (slideWordObjs.length === 0) continue;

      const sentenceGroups = splitIntoSentenceGroups(slideWordObjs, MAX_GROUP_WORDS);
      for (const grpWords of sentenceGroups) {
        displayGroups.push({ slideIdx, words: grpWords });
      }
    }
    console.log(`✅ 문장 기반 표시 그룹: ${displayGroups.length}개`);
  } else {
    // ── Whisper 모드 (fallback — tts-script.txt 없을 때) ───────────
    let curGroup = null;
    for (let i = 0; i < allWordsFlat.length; i++) {
      const w = allWordsFlat[i];
      const si = getSlideIdxAtTime(w.start);
      if (!curGroup || si !== curGroup.slideIdx || curGroup.words.length >= DISPLAY_GROUP_SIZE) {
        if (curGroup && curGroup.words.length > 0) displayGroups.push(curGroup);
        curGroup = { slideIdx: si, words: [] };
      }
      curGroup.words.push({ ...w, flatIdx: i });
    }
    if (curGroup && curGroup.words.length > 0) displayGroups.push(curGroup);
  }

  // 자막 프레임 렌더링
  console.log('\n🎨 자막 프레임 생성...');
  const framePage = await browser.newPage();
  await framePage.setViewport({ width: 1080, height: 1920 });
  const frames = [];
  let frameIdx = 0;

  const PAUSE_THRESHOLD = 0.5;
  const WORD_DISPLAY = 0.4;

  // ── 절대 타임스탬프 방식: 각 프레임에 startTime 저장, duration은 마지막에 차이로 계산 ──
  // 이 방식은 sum(dur) = totalDur을 수학적으로 보장하여 드리프트 원천 차단

  for (let gi = 0; gi < displayGroups.length; gi++) {
    const grp = displayGroups[gi];
    const { slideIdx, words } = grp;
    const slide = SLIDES[slideIdx];

    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi];
      const wordStart = w.start;

      // rawDur: 이 단어의 실제 표시 시간 (pause 판단용으로만 사용)
      let rawDur;
      if (w.end !== undefined && w.end > w.start) {
        rawDur = w.end - w.start;
      } else {
        const nextFlatIdx = w.flatIdx + 1;
        const nextW = nextFlatIdx < allWordsFlat.length ? allWordsFlat[nextFlatIdx] : null;
        rawDur = nextW ? Math.max(nextW.start - w.start, 0.05) : Math.max(totalDur - w.start, 0.05);
      }

      await framePage.setContent(makeFrameHtml(slideDataURIs[slideIdx], slide, words, wi), { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 150));
      const filePath = path.join(FRAMES_DIR, `frame_${String(frameIdx).padStart(5, '0')}.png`);
      await framePage.screenshot({ path: filePath });

      if (rawDur > PAUSE_THRESHOLD) {
        // 긴 쉼: 하이라이트 WORD_DISPLAY초 표시 후 하이라이트 없는 프레임
        frames.push({ file: filePath, startTime: wordStart });
        frameIdx++;
        await framePage.setContent(makeFrameHtml(slideDataURIs[slideIdx], slide, words, -1), { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 150));
        const blankPath = path.join(FRAMES_DIR, `frame_${String(frameIdx).padStart(5, '0')}.png`);
        await framePage.screenshot({ path: blankPath });
        frames.push({ file: blankPath, startTime: wordStart + WORD_DISPLAY });
      } else {
        frames.push({ file: filePath, startTime: wordStart });
      }
      frameIdx++;
      if (frameIdx % 20 === 0) process.stdout.write(`\r  ${frameIdx} 프레임`);
    }
  }
  await browser.close();
  console.log(`\n✅ 프레임 ${frames.length}개 렌더 완료`);

  // ── 절대 타임스탬프 → duration 변환 (드리프트 원천 차단) ──────────
  frames.sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < frames.length - 1; i++) {
    frames[i].dur = Math.max(frames[i + 1].startTime - frames[i].startTime, 0.02);
  }
  frames[frames.length - 1].dur = Math.max(totalDur - frames[frames.length - 1].startTime, 0.02);

  const sumDur = frames.reduce((s, f) => s + f.dur, 0);
  console.log(`🔍 타이밍 검증: 프레임 합산 ${sumDur.toFixed(3)}s / 오디오 ${totalDur.toFixed(3)}s (차이: ${Math.abs(sumDur - totalDur).toFixed(3)}s)`);
  if (Math.abs(sumDur - totalDur) > 0.5) {
    console.warn(`⚠️ 타이밍 차이 ${Math.abs(sumDur - totalDur).toFixed(1)}s — 드리프트 가능성 있음`);
  }

  // concat.txt 생성
  const concatFile = path.join(DATE_DIR, 'concat.txt');
  const lines = frames.map(f => `file '${f.file}'\nduration ${f.dur.toFixed(4)}`);
  lines.push(`file '${frames[frames.length - 1].file}'`);
  fs.writeFileSync(concatFile, lines.join('\n') + '\n');

  // ffmpeg 합성
  console.log('\n🎬 ffmpeg 영상 합성...');
  execSync([
    'ffmpeg -y',
    `-f concat -safe 0 -i "${concatFile}"`,
    `-i "${VOICE}"`,
    `-i "${BGM}"`,
    `-filter_complex "[1:a]aresample=44100,pan=stereo|c0=c0|c1=c0[voice];[2:a]aloop=loop=-1:size=2e+09,volume=0.25[bgm];[voice][bgm]amix=inputs=2:duration=first:dropout_transition=3[aout]"`,
    `-map 0:v -map "[aout]"`,
    `-vf "fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"`,
    `-c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p`,
    `-c:a aac -b:a 192k -ar 44100 -ac 2 -shortest`,
    `"${FINAL}"`,
  ].join(' '), { stdio: 'inherit' });

  const size = (fs.statSync(FINAL).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅ ${FINAL} (${size}MB)`);

  // 임시 슬라이드 배경 삭제
  for (let i = 0; i < SLIDES.length; i++) {
    const p = path.join(DATE_DIR, `_slide-bg-${i}.png`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  console.log('🧹 임시 파일 삭제 완료');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
