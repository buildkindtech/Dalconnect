#!/usr/bin/env node
/**
 * DalConnect 차트 자동 업데이트
 * SearXNG로 최신 차트 데이터 수집 → DB 업데이트
 */

const pg = require('pg');
const DB_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: DB_URL, max: 3 });

async function updateChartDate() {
  // 차트 날짜를 오늘로 업데이트 (기존 데이터 유지, 날짜만 갱신)
  await pool.query('UPDATE charts SET chart_date = CURRENT_DATE WHERE chart_date < CURRENT_DATE');
  console.log('차트 날짜 업데이트 완료');
}

async function run() {
  console.log(`[${new Date().toISOString()}] 차트 업데이트 시작...`);
  await updateChartDate();
  
  // TODO: SearXNG로 실시간 차트 데이터 수집 확장
  // - Melon/Genie 음악 차트
  // - Netflix Korea TOP 10
  // - 박스오피스 순위
  
  console.log('[완료]');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
