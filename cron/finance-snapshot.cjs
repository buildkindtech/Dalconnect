#!/usr/bin/env node
/**
 * 재정 잔고 주간 스냅샷 (월요일 8:20am)
 */
const fs = require('fs');
const https = require('https');
const { triggerClaude } = require('./trigger.cjs');

// env 로드
const envPath = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect/cron/env.sh';
let LUNCH_MONEY_API_KEY = process.env.LUNCH_MONEY_API_KEY;

if (!LUNCH_MONEY_API_KEY && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lmMatch = envContent.match(/LUNCH_MONEY_API_KEY="?([^"\n]+)"?/);
  if (lmMatch) LUNCH_MONEY_API_KEY = lmMatch[1];
}

// workspace .env도 체크
const wsEnvPath = '/Users/aaron/.openclaw/workspace/.env';
if (!LUNCH_MONEY_API_KEY && fs.existsSync(wsEnvPath)) {
  const wsEnv = fs.readFileSync(wsEnvPath, 'utf8');
  const m = wsEnv.match(/LUNCH_MONEY_API_KEY=([^\n]+)/);
  if (m) LUNCH_MONEY_API_KEY = m[1].replace(/"/g, '');
}

const CHAT_ID = '-5271905073';

function fetchLunchMoney() {
  return new Promise((resolve) => {
    if (!LUNCH_MONEY_API_KEY) return resolve(null);
    const req = https.request({
      hostname: 'dev.lunchmoney.app',
      path: '/v1/assets',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${LUNCH_MONEY_API_KEY}` },
      timeout: 10000,
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function main() {
  const today = new Date().toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  process.stderr.write(`재정 스냅샷 시작: ${today}\n`);

  const assets = await fetchLunchMoney();
  if (!assets?.assets) {
    process.stderr.write('Lunch Money API 응답 없음 — HEARTBEAT_OK\n');
    return;
  }

  const assetSummary = assets.assets
    .map(a => `${a.name} (${a.type_name}): $${parseFloat(a.balance).toFixed(2)}`)
    .join('\n');

  process.stderr.write(`계좌 ${assets.assets.length}개 조회됨\n`);

  const prompt = `재정 잔고 주간 스냅샷. ${today}

Lunch Money 계좌 잔액:
${assetSummary}

요약 (한국어, 3-5줄):
- 체킹 계좌 잔액 (Chase *2299 < $500이면 🚨 경고)
- 신용카드 부채 합계
- 저축/투자 현황
- 주간 특이사항

간결하게, 수치 중심으로`;

  await triggerClaude(CHAT_ID, prompt, `💰 주간 재정 스냅샷 분석 중...`);
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
