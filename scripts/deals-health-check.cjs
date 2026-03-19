#!/usr/bin/env node
/**
 * DalKonnect 딜 페이지 헬스체크 + 자동 수정
 * 매일 5am CST 실행
 * 
 * 체크 항목:
 * 1. 만료된 딜 자동 삭제
 * 2. 활성 딜 < 15개 → auto-collect-deals.cjs 실행
 * 3. 시온마트 딜 < 5개 → auto-update-zion.cjs 실행  
 * 4. Groupon 딜 < 3개 → auto-update-groupon.cjs 실행
 * 5. DB 연결 에러 → 알림
 */

const { execSync, spawnSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const SCRIPT_DIR = __dirname;

let alerts = [];
let fixes = [];

function runScript(scriptName) {
  console.log(`\n🔧 ${scriptName} 실행 중...`);
  const result = spawnSync('node', [`${SCRIPT_DIR}/${scriptName}`], { 
    timeout: 120000, 
    encoding: 'utf8',
    env: { ...process.env }
  });
  if (result.status === 0) {
    fixes.push(`✅ ${scriptName} 성공`);
    console.log(result.stdout || '  완료');
  } else {
    alerts.push(`❌ ${scriptName} 실패: ${(result.stderr || result.stdout || '').slice(0, 100)}`);
    console.log(`  실패: ${result.stderr || ''}`);
  }
  return result.status === 0;
}

async function main() {
  console.log(`\n🏥 딜 헬스체크 시작: ${new Date().toLocaleString('ko-KR', { timeZone: 'America/Chicago' })}\n`);
  
  try {
    // 1. 만료된 딜 자동 삭제
    const expired = await pool.query(`DELETE FROM deals WHERE expires_at < NOW() RETURNING id, title`);
    if (expired.rowCount > 0) {
      console.log(`🗑️  만료 딜 ${expired.rowCount}개 삭제:`);
      expired.rows.forEach(r => console.log(`  - ${r.title}`));
      fixes.push(`🗑️ 만료 딜 ${expired.rowCount}개 정리`);
    }
    
    // 2. 활성 딜 현황 체크
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE source = 'zionmarket.com') as zion,
        COUNT(*) FILTER (WHERE source = 'groupon.com') as groupon,
        COUNT(*) FILTER (WHERE source = 'manual') as manual
      FROM deals WHERE expires_at > NOW()
    `);
    
    const { total, zion, groupon } = stats.rows[0];
    console.log(`\n📊 활성 딜 현황:`);
    console.log(`  전체: ${total}개`);
    console.log(`  시온마트: ${zion}개`);
    console.log(`  Groupon: ${groupon}개`);
    console.log(`  기타: ${stats.rows[0].manual}개`);
    
    // 3. 자동 수정
    let needsRepair = false;
    
    // 시온마트 딜이 5개 미만이면 (목요일에 자동으로 실행됨, 그 외에도 부족하면 재실행)
    const today = new Date().getDay(); // 4 = Thursday
    if (parseInt(zion) < 5) {
      console.log(`\n⚠️ 시온마트 딜 부족 (${zion}개 < 5개) → 자동 수집 시도`);
      runScript('auto-update-zion.cjs');
      needsRepair = true;
    }
    
    // Groupon 딜이 3개 미만이면 재수집
    if (parseInt(groupon) < 3) {
      console.log(`\n⚠️ Groupon 딜 부족 (${groupon}개 < 3개) → 자동 수집 시도`);
      runScript('auto-update-groupon.cjs');
      needsRepair = true;
    }
    
    // 전체 딜이 15개 미만이면 auto-collect 실행
    if (parseInt(total) < 15 && !needsRepair) {
      console.log(`\n⚠️ 전체 딜 부족 (${total}개 < 15개) → 자동 수집 시도`);
      runScript('auto-collect-deals.cjs');
    }
    
    // 4. 최종 현황 보고
    const final = await pool.query(`SELECT COUNT(*) as cnt FROM deals WHERE expires_at > NOW()`);
    console.log(`\n📦 최종 활성 딜: ${final.rows[0].cnt}개`);
    
    if (fixes.length > 0) {
      console.log('\n🔧 자동 수정 내역:');
      fixes.forEach(f => console.log(`  ${f}`));
    }
    
    if (alerts.length > 0) {
      console.log('\n🚨 알림:');
      alerts.forEach(a => console.log(`  ${a}`));
    }
    
    console.log('\n✅ 헬스체크 완료\n');
    await pool.end();
    process.exit(alerts.length > 0 ? 1 : 0);
    
  } catch(e) {
    console.error('❌ DB 연결 오류:', e.message);
    await pool.end();
    process.exit(1);
  }
}

main();
