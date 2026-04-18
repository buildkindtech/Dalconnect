#!/usr/bin/env node
/**
 * autoresearch 테스트 하네스
 * 캐시된 뉴스 데이터로 TTS 프롬프트만 실행
 * 사용법: node run-harness.cjs <exp-name> [날짜]
 *
 * 날짜 기본값: 2026-04-13 (캐시된 데이터)
 */
const fs = require('fs');
const path = require('path');
const { askAI } = require('../cron/ai.cjs');

const EXP = process.argv[2] || 'exp-test';
const DATE = process.argv[3] || '2026-04-13';

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';
const DATE_DIR = path.join(BASE, 'memory', 'morning-reels', DATE);
const AR_DIR = path.join(BASE, 'autoresearch-morning-briefing');
const OUT_DIR = path.join(AR_DIR, 'runs', EXP);

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 캐시된 뉴스 로드 ──────────────────────────────────────────
const selectedPath = path.join(DATE_DIR, 'selected-news.json');
if (!fs.existsSync(selectedPath)) {
  console.error(`❌ ${selectedPath} 없음`);
  process.exit(1);
}
const selected = JSON.parse(fs.readFileSync(selectedPath, 'utf8'));
console.log(`📰 뉴스 ${selected.length}개 로드 (${DATE})`);

// ── 날짜 + 날씨 (고정값 사용) ────────────────────────────────
const today = { label: '4월 13일 월요일', dateStr: DATE };
const weather = { minF: 67, maxF: 89, desc: '흐림' };

// ── 프롬프트 빌드 (현재 버전 — 실험마다 이 부분을 변경) ──────
const newsListText = selected.map((n, i) =>
  `${i+1}. [${n.category}] ${n.title}`
).join('\n');

// ===== PROMPT START (실험마다 이 블록만 교체) =====
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
- 뉴스 순서: 위에 번호 매긴 순서 그대로 작성 (순서 절대 바꾸지 말 것)
- 각 뉴스 2~3문장, 달라스 한인 관점에서 생동감 있게
- 숫자/영어는 한글 발음으로 (예: I-35E → 아이삼십오이, DFW → 디에프더블유)
- 마무리: "오늘 달커넥트 뉴스 여기까지입니다. 더 자세한 내용은 달커넥트닷컴에서 만나보세요. [요일] 되세요. 감사합니다."
- 스크립트 텍스트만 출력, 다른 설명 없이`;
// ===== PROMPT END =====

console.log(`🤖 Gemini 실행 중... (${EXP})`);
const start = Date.now();

askAI(ttsPrompt, { maxTokens: 4000, temperature: 0.5, thinkingBudget: 0 })
  .then(result => {
    const ttsScript = result.trim();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // 저장
    const outPath = path.join(OUT_DIR, 'tts-script.txt');
    fs.writeFileSync(outPath, ttsScript);
    fs.writeFileSync(path.join(OUT_DIR, 'prompt.txt'), ttsPrompt);
    fs.writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify({
      exp: EXP, date: DATE, news_count: selected.length,
      char_count: ttsScript.length, elapsed_sec: parseFloat(elapsed),
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`✅ 완료 (${elapsed}s) — ${ttsScript.length}자`);
    console.log(`📁 저장: ${outPath}`);
    console.log('\n--- 스크립트 미리보기 ---');
    console.log(ttsScript.slice(0, 400) + '...');
  })
  .catch(e => {
    console.error('❌ Gemini 오류:', e.message);
    process.exit(1);
  });
