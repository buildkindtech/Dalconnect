#!/usr/bin/env node
/**
 * DalKonnect 업소 클로즈업 (화/목/토 4pm)
 *
 * DB에서 평점 4.0+ 업소 선정 → Claude via trigger로 캐러셀 카피 생성
 */
const { Client } = require('pg');
const { triggerClaude } = require('./trigger.cjs');

const CHAT_ID = '-5280678324';
const DATABASE_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];
  process.stderr.write(`[${today}] 업소 클로즈업 시작 (${dayName}요일)\n`);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // 전략 데이터에서 선호 카테고리 가져오기
  let categoryBoost = '';
  try {
    const strategy = JSON.parse(require('fs').readFileSync(
      require('path').join(__dirname, '../data/strategy.json'), 'utf8'
    ));
    // closeup 저장율 높을 때 저장 잘 되는 카테고리 (캡션 분석)
    const perf = JSON.parse(require('fs').readFileSync(
      require('path').join(__dirname, '../data/content-performance.json'), 'utf8'
    ));
    const closeupPosts = Object.values(perf).filter(p => p.content_type === 'closeup' && (p.saves || 0) > 0);
    if (closeupPosts.length >= 3) {
      // 저장 많이 받은 캡션에서 카테고리 힌트 추출
      const cats = closeupPosts
        .sort((a, b) => (b.saves || 0) - (a.saves || 0))
        .slice(0, 3)
        .map(p => {
          const c = (p.caption || '').toLowerCase();
          if (c.includes('음식') || c.includes('맛집') || c.includes('restaurant')) return '음식점';
          if (c.includes('미용') || c.includes('헤어')) return '미용';
          if (c.includes('학원') || c.includes('교육')) return '교육';
          return null;
        }).filter(Boolean);
      if (cats.length) {
        categoryBoost = ` AND category = ANY(ARRAY[${cats.map(c => `'${c}'`).join(',')}])`;
        process.stderr.write(`📊 전략 기반 우선 카테고리: ${cats.join(', ')}\n`);
      }
    }
  } catch (_) {}

  // 평점 4.0+ 업소 중 최근에 피처링 안 된 곳 선택
  const { rows } = await client.query(`
    SELECT id, name, category, address, rating, phone, description, website
    FROM businesses
    WHERE rating >= 4.0
      AND description IS NOT NULL AND LENGTH(description) > 80
      ${categoryBoost}
    ORDER BY rating DESC, RANDOM()
    LIMIT 1
  `).catch(() => ({ rows: [] }));

  await client.end();

  if (!rows.length) {
    process.stderr.write('DB 업소 없음 — 스킵\n');
    return;
  }

  const biz = rows[0];
  process.stderr.write(`선정 업소: ${biz.name} (${biz.category}) 평점 ${biz.rating}\n`);

  const prompt = `달커넥트 업소 클로즈업 캐러셀 카피 작성.

업소 정보:
- 이름: ${biz.name}
- 카테고리: ${biz.category}
- 주소: ${biz.address}
- 평점: ${biz.rating}/5.0
- 소개: ${biz.description}
- 전화: ${biz.phone || '없음'}
- 웹사이트: ${biz.website || '없음'}

캐러셀 5장 카피 작성 (한국어):
슬라이드1: 업소명 + 한 줄 핵심 소개
슬라이드2: 대표 메뉴/서비스 3가지
슬라이드3: 달라스 한인이 좋아하는 이유
슬라이드4: 위치/연락처/영업시간 요약
슬라이드5: CTA ("지금 방문해보세요!" 등)

각 슬라이드 30자 이내. 임팩트 있게.`;

  await triggerClaude(CHAT_ID, prompt, `🏪 업소 클로즈업 후보 선정 중 — ${biz.name}`);
  process.stderr.write('업소 클로즈업 트리거 완료\n');
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
