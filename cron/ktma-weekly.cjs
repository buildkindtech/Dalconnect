#!/usr/bin/env node
/**
 * KTMA Weekly Growth Report (월요일 9am)
 */
const fs = require('fs');
const { triggerClaude } = require('./trigger.cjs');

const CHAT_ID = '-4932223926';
const MEM_DIR = '/Users/aaron/.openclaw/workspace/memory';

function readFileSafe(path) {
  try { return fs.readFileSync(path, 'utf8'); } catch { return null; }
}

function getWeekRange() {
  const today = new Date();
  const mon = new Date(today);
  mon.setDate(today.getDate() - today.getDay() + 1);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
  return `${fmt(mon)}~${fmt(sun)}`;
}

async function main() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
  const weekRange = getWeekRange();
  process.stderr.write(`[${dateStr}] KTMA 주간 리포트 시작\n`);

  // 데이터 수집
  const ktmaMem = readFileSafe(`${MEM_DIR}/groups/ktma.md`) || '메모리 없음';
  const martialMem = readFileSafe(`${MEM_DIR}/projects/martialos.md`) || '';
  const hubProjects = readFileSafe(`${MEM_DIR}/groups/hub-projects.md`) || '';

  // 이번 주 일지 수집 (월~일)
  const weekNotes = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1 + i);
    const dateKey = d.toISOString().slice(0, 10);
    const note = readFileSafe(`${MEM_DIR}/${dateKey}.md`);
    if (note) weekNotes.push(`[${dateKey}] ${note.slice(0, 400)}`);
  }

  const prompt = `KTMA 주간 성장 리포트. ${dateStr} (이번주: ${weekRange})

KTMA 그룹 메모리:
${ktmaMem.slice(0, 1500)}

이번 주 일지 (있는 것만):
${weekNotes.join('\n\n').slice(0, 1500) || '기록 없음'}

아래 형식으로 주간 리포트 작성 (한국어, 반말):

📊 **KTMA 주간 리포트** (${weekRange})

**이번 주 완료한 것:**
- ...

**진행 중:**
- ...

**219→500명 목표 진행:**
- ...

**다음 주 우선순위:**
1. ...

데이터가 부족하면 메모리 기반으로 최대한 작성. 300자 내외.`;

  await triggerClaude(CHAT_ID, prompt, `📊 KTMA 주간 리포트 (${weekRange}) 생성 중...`);
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
