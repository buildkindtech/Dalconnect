#!/usr/bin/env node
/**
 * Devotion 매일 QT (매일 5am)
 * 생명의 삶 본문 fetch → 오스왈드 챔버스 스타일 묵상글 생성 → Devotion 방 전송
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const { triggerClaude } = require('./trigger.cjs');

const CHAT_ID = '-1003732131830';
const GUIDELINES_PATH = '/Users/aaron/.openclaw/workspace/memory/devotion-guidelines.md';

function fetchUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', () => resolve('')).on('timeout', () => resolve(''));
  });
}

function getKoreanDate() {
  const d = new Date();
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${days[d.getDay()]}`;
}

async function main() {
  const today = getKoreanDate();
  process.stderr.write(`[${today}] Devotion QT 시작\n`);

  // 생명의 삶 페이지 fetch
  const html = await fetchUrl('https://www.duranno.com/qt/view/bible.asp');
  let qtContent = '';
  if (html) {
    // 제목과 성경 본문 추출 (기본 파싱)
    const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);
    qtContent = bodyText;
    process.stderr.write(`생명의 삶 fetch 성공 (${html.length}자)\n`);
  } else {
    process.stderr.write('생명의 삶 fetch 실패 — 기본 묵상으로 진행\n');
    qtContent = `오늘 날짜: ${today}. 두란노 사이트 접근 불가. 시편 23편 기준으로 묵상글 작성.`;
  }

  // 묵상 지침 읽기
  const guidelines = fs.existsSync(GUIDELINES_PATH)
    ? fs.readFileSync(GUIDELINES_PATH, 'utf8').slice(0, 2000)
    : '오스왈드 챔버스 스타일: 역설적 오프닝, 깊은 통찰, 위로보다 각성, 한국어';

  const prompt = `오늘 날짜: ${today}

두란노 생명의 삶 페이지 내용:
${qtContent.slice(0, 2000)}

묵상 작성 지침:
${guidelines}

위 지침을 따라 오늘의 묵상글을 작성하라. 요구사항:
- 성경 본문 구절 포함 (개역개정)
- 오스왈드 챔버스 스타일 (역설적 오프닝, 각성이 목적)
- 한국어, 300~500자
- 날짜 제목 포함
- 상태 보고 없이 묵상글 본문만 출력`;

  await triggerClaude(CHAT_ID, prompt, `✝️ 오늘의 묵상 (${today}) 작성 중...`);
  process.stderr.write('Devotion 트리거 완료\n');
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
