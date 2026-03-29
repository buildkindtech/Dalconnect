/**
 * DalKonnect 크론잡 모니터 + 자동 복구
 * - 핵심 작업 누락 여부 체크
 * - 실패 시 자동 복구 실행
 * - 달커넥트 텔레그램 방에 보고
 * 
 * 실행: node scripts/monitor-and-recover.cjs
 * 크론: 매일 8am / 1pm / 8pm CST
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { execSync, exec } = require('child_process');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8183049940:AAFj2xDvOImb_RGaDml7gVyMti1PZU5Vbfk';
const CHAT_ID = '-5280678324';

const now = new Date();
const hourCST = parseInt(new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', hour12: false, timeZone: 'America/Chicago'
}).format(now));

async function sendTelegram(msg) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' });
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const data = await res.json();
    if (!data.ok) console.error('텔레그램 에러:', data.description);
  } catch (e) {
    console.error('텔레그램 전송 실패:', e.message);
  }
}

function runScript(cmd, label) {
  try {
    console.log(`▶ ${label} 실행 중...`);
    const out = execSync(`cd /Users/aaron/.openclaw/workspace-manager/projects/dalconnect && ${cmd}`, {
      timeout: 300000, // 5분
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`✅ ${label} 완료`);
    return { ok: true, output: out?.slice(-200) || '' };
  } catch (e) {
    console.error(`❌ ${label} 실패:`, e.message?.slice(0, 100));
    return { ok: false, error: e.message?.slice(0, 100) };
  }
}

async function checkNewsCollection() {
  // 지난 3시간 이내 뉴스 수집됐는지 확인
  const r = await pool.query(`
    SELECT COUNT(*) as cnt, MAX(created_at) as latest
    FROM news
    WHERE created_at > NOW() - INTERVAL '3 hours'
  `);
  const cnt = parseInt(r.rows[0].cnt);
  const latest = r.rows[0].latest;
  return { ok: cnt > 10, cnt, latest };
}

async function checkTranslation() {
  // 번역 안 된 뉴스 있는지 (6시간 이내 수집된 것 중, 영어 본문)
  const r = await pool.query(`
    SELECT COUNT(*) as cnt FROM news
    WHERE created_at > NOW() - INTERVAL '6 hours'
    AND content IS NOT NULL
    AND LENGTH(content) > 30
    AND content !~ '[가-힣]{10,}'
  `);
  const cnt = parseInt(r.rows[0].cnt);
  return { needsWork: cnt > 5, cnt };
}

async function checkEnrich() {
  // 내용 짧은 뉴스 있는지
  const r = await pool.query(`
    SELECT COUNT(*) as cnt FROM news
    WHERE created_at > NOW() - INTERVAL '6 hours'
    AND (content IS NULL OR LENGTH(content) < 50)
  `);
  const cnt = parseInt(r.rows[0].cnt);
  return { needsWork: cnt > 10, cnt };
}

async function main() {
  console.log(`\n🔍 DalKonnect 모니터 실행 (${now.toLocaleString('ko-KR', { timeZone: 'America/Chicago' })})\n`);

  const issues = [];
  const fixed = [];

  try {
    // 1. 뉴스 수집 체크
    const news = await checkNewsCollection();
    if (!news.ok) {
      console.log(`❌ 뉴스 수집 부족 (최근 3시간 ${news.cnt}건)`);
      issues.push(`뉴스 수집 부족 (${news.cnt}건/3시간)`);
      const result = runScript('node scripts/auto-news-update.cjs', '뉴스 수집');
      if (result.ok) fixed.push('뉴스 수집 완료');
      else issues.push(`뉴스 수집 자동 복구 실패: ${result.error}`);
    } else {
      console.log(`✅ 뉴스 수집 정상 (최근 3시간 ${news.cnt}건)`);
    }

    // 2. enrich 체크
    const enrich = await checkEnrich();
    if (enrich.needsWork) {
      console.log(`⚠️ 내용 보강 필요 (${enrich.cnt}건)`);
      const result = runScript('node scripts/enrich-news-ai.cjs --limit=50', '뉴스 보강');
      if (result.ok) fixed.push(`뉴스 보강 완료 (${enrich.cnt}건)`);
    } else {
      console.log(`✅ 뉴스 내용 정상`);
    }

    // 3. 번역 체크
    const trans = await checkTranslation();
    if (trans.needsWork) {
      console.log(`⚠️ 번역 필요 (${trans.cnt}건)`);
      const result = runScript('node scripts/translate-english-v2.cjs 50', '번역');
      if (result.ok) fixed.push(`번역 완료 (${trans.cnt}건)`);
    } else {
      console.log(`✅ 번역 정상`);
    }

    // 4. deep-clean (항상 가볍게 실행)
    runScript('node scripts/deep-clean-news.cjs', '뉴스 정리');

    // 5. 뉴스카드 시간대 체크 (12pm 전후 1pm 체크 시, 5pm 전후 8pm 체크 시)
    if (hourCST >= 13 && hourCST <= 14) {
      // 12pm 카드 포스팅 됐는지 — 여기서는 그냥 수집/보강만
      console.log('📸 12pm 윈도우 — 뉴스카드 자동 처리는 크론에 위임');
    }

    // 보고 메시지 작성
    if (issues.length === 0 && fixed.length === 0) {
      // 이상 없으면 8am 체크 때만 간단 보고 (1pm/8pm은 조용히)
      if (hourCST >= 8 && hourCST <= 9) {
        const totalNews = await pool.query('SELECT COUNT(*) as cnt FROM news WHERE created_at > NOW() - INTERVAL \'24 hours\'');
        await sendTelegram(`✅ *달커넥트 상태 정상* (오전 ${hourCST}시)\n• 오늘 뉴스: +${totalNews.rows[0].cnt}건\n• 크론잡: 정상`);
      }
    } else {
      // 문제 있었으면 항상 보고
      let msg = `🚨 *달커넥트 크론 이상 감지 + 자동 복구*\n\n`;
      if (issues.length > 0) {
        msg += `*발견된 문제:*\n`;
        issues.forEach(i => msg += `• ${i}\n`);
        msg += '\n';
      }
      if (fixed.length > 0) {
        msg += `*자동 복구 완료:*\n`;
        fixed.forEach(f => msg += `✅ ${f}\n`);
      }
      msg += `\n_(${new Date().toLocaleTimeString('ko-KR', { timeZone: 'America/Chicago' })})_`;
      await sendTelegram(msg);
    }

  } catch (e) {
    console.error('모니터 에러:', e.message);
    await sendTelegram(`❌ *달커넥트 모니터 에러*\n${e.message?.slice(0, 200)}`);
  } finally {
    await pool.end();
  }

  console.log('\n✅ 모니터 완료\n');
}

main().catch(console.error);
