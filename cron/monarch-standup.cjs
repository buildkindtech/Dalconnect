#!/usr/bin/env node
/**
 * Monarch Standup — 로컬 라우터 trigger 버전
 */
const fs = require('fs');
const { triggerClaude } = require('./trigger.cjs');

const CHAT_ID = '-5052982119';
const MEMORY_FILE = '/Users/aaron/.openclaw/workspace/memory/monarch-standup.md';

async function main() {
  const memory = fs.readFileSync(MEMORY_FILE, 'utf8');
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  const prompt = `아래는 Monarch Moulding GM Abe의 스탠드업 메모리 파일이다.

${memory}

오늘(${today}) 스탠드업 시작 메시지를 작성해줘.
규칙:
- "오늘 할 일" 항목에 번호 붙여서 나열
- "캐리오버" 항목도 있으면 포함
- 마지막에 "다 했어? 번호로 답해줘" 추가
- 한국어로, 자연스럽게
- HTML 태그 없이 일반 텍스트

메시지만 출력 (다른 설명 없이)`;

  await triggerClaude(CHAT_ID, prompt, `📋 Monarch 스탠드업 시작...`);
  process.stderr.write('Monarch 스탠드업 트리거 완료\n');
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
