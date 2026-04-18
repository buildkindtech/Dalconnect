#!/usr/bin/env node
/**
 * Morning Project Sync (매일 4am)
 * 그룹 메모리 + 어제 일지 읽어서 완료/미완료 태스크 요약 → Claude via trigger
 */
const fs = require('fs');
const path = require('path');
const { triggerClaude } = require('./trigger.cjs');

const CHAT_ID = '7966628100'; // Aaron DM
const MEM_DIR = '/Users/aaron/.openclaw/workspace/memory';
const GROUPS_DIR = path.join(MEM_DIR, 'groups');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = daysAgo(1);
  process.stderr.write(`[${today}] Morning Project Sync 시작\n`);

  // 어제 일지
  const yesterdayNote = readFileSafe(`${MEM_DIR}/${yesterday}.md`) || '';

  // 핵심 그룹 메모리만 (너무 많으면 토큰 낭비)
  const KEY_GROUPS = ['dalconnect', 'monarch', 'ktma', 'hub-finances', 'personal'];
  const groupSummaries = KEY_GROUPS.map(g => {
    const content = readFileSafe(path.join(GROUPS_DIR, `${g}.md`));
    if (!content) return null;
    // State 섹션만 추출 (짧게)
    const stateMatch = content.match(/## State\n([\s\S]{0,500}?)(?=\n##|$)/);
    return stateMatch ? `[${g}] ${stateMatch[1].trim()}` : `[${g}] ${content.slice(0, 200)}`;
  }).filter(Boolean).join('\n\n');

  if (!yesterdayNote && !groupSummaries) {
    process.stderr.write('데이터 없음 — 전송 생략\n');
    return;
  }

  const prompt = `Morning Project Sync. 오늘: ${today}

어제(${yesterday}) 일지:
${yesterdayNote.slice(0, 1500) || '기록 없음'}

프로젝트 현재 상태:
${groupSummaries.slice(0, 1500)}

오늘 아침 브리핑 (한국어, 간결하게):
- 어제 완료된 것 (✅ 있으면)
- 오늘 최우선 할 것 (최대 3개)
- 주의 필요한 이슈 (있으면)

150자 이내로.`;

  await triggerClaude(CHAT_ID, prompt, `🌅 Morning Sync (${today})...`);
  process.stderr.write('Morning Sync 트리거 완료\n');
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
