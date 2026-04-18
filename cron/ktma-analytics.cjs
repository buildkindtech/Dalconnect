#!/usr/bin/env node
/**
 * KTMA Daily Analytics (매일 8:10am)
 */
const https = require('https');
const { triggerClaude } = require('./trigger.cjs');

const CHAT_ID = '-4932223926';

function fetchJSON(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 10000 }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.stringify(JSON.parse(d))); }
        catch { resolve(d.slice(0, 200)); }
      });
    }).on('error', (e) => resolve(`연결 실패: ${e.message}`))
      .on('timeout', () => resolve('타임아웃'));
  });
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  process.stderr.write(`[${today}] KTMA 분석 시작\n`);

  const [ga4, social, revenue] = await Promise.all([
    fetchJSON('https://mykoreantiger.com/api/admin/analytics'),
    fetchJSON('https://mykoreantiger.com/api/admin/social'),
    fetchJSON('https://mykoreantiger.com/api/admin/revenue'),
  ]);

  process.stderr.write(`GA4: ${ga4.slice(0, 80)}\n`);
  process.stderr.write(`SOCIAL: ${social.slice(0, 80)}\n`);
  process.stderr.write(`REVENUE: ${revenue.slice(0, 80)}\n`);

  // API 전부 실패 시 조용히 종료
  const allFailed = [ga4, social, revenue].every(r =>
    r.includes('실패') || r.includes('타임아웃') || r.includes('error')
  );
  if (allFailed) {
    process.stderr.write('API 전부 불응 — 전송 안 함\n');
    return;
  }

  const prompt = `KTMA (Korean Tiger Martial Arts) 데일리 분석 요약. 오늘: ${today}

API 데이터:
GA4 (웹 방문): ${ga4.slice(0, 400)}
소셜 (FB/IG): ${social.slice(0, 400)}
매출 (Stripe): ${revenue.slice(0, 400)}

한국어로 3-5줄 간결 요약:
- 오늘 핵심 지표 수치
- 눈에 띄는 변화 (있으면)
- 주의 필요 항목 (있으면)

데이터가 없거나 연결 실패면 "SILENT_OK" 만 출력`;

  await triggerClaude(CHAT_ID, prompt, `📊 KTMA 일일 현황 (${today}) 분석 중...`);
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
