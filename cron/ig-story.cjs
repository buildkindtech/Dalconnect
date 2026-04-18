#!/usr/bin/env node
/**
 * DalKonnect IG 스토리 후보 선정 (매일 2pm)
 *
 * DB에서 후보 선정 → Claude via trigger로 스토리 카피 생성
 */
const { Client } = require('pg');
const { triggerClaude } = require('./trigger.cjs');

const CHAT_ID = '-5280678324'; // DalKonnect
const DATABASE_URL = 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  process.stderr.write(`[${today}] IG 스토리 후보 선정 시작\n`);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // 평점 높은 업소 OR 오늘 인기 뉴스 선택
  const { rows: bizRows } = await client.query(`
    SELECT name, category, address, rating, description
    FROM businesses
    WHERE rating >= 4.0 AND description IS NOT NULL AND LENGTH(description) > 50
    ORDER BY RANDOM() LIMIT 3
  `).catch(() => ({ rows: [] }));

  const { rows: newsRows } = await client.query(`
    SELECT title, category, content
    FROM news
    WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND title IS NOT NULL
    ORDER BY created_at DESC LIMIT 3
  `).catch(() => ({ rows: [] }));

  await client.end();

  const bizList = bizRows.map(b => `업소: ${b.name} (${b.category}) — 평점 ${b.rating} — ${b.description?.slice(0, 100)}`).join('\n');
  const newsList = newsRows.map(n => `뉴스: ${n.title}`).join('\n');

  const prompt = `달커넥트 IG 스토리 투표 콘텐츠 선정. 오늘: ${today}

후보 업소들:
${bizList || '없음'}

오늘 뉴스:
${newsList || '없음'}

가장 달라스 한인 커뮤니티에 반응이 좋을 것 하나를 골라서 IG 스토리 투표 카피를 작성하라:

형식:
📍 [업소명 or 뉴스 제목]
[한 줄 소개]
[투표 질문: 예 "방문해봤나요?", "어떻게 생각하나요?"]
👍 [찬성 옵션] / 👎 [반대 옵션]

50자 이내, 임팩트 있게`;

  await triggerClaude(CHAT_ID, prompt, `📱 IG 스토리 후보 선정 (${today})...`);
  process.stderr.write('IG 스토리 트리거 완료\n');
}

main().catch(e => { process.stderr.write(`❌ ${e.message}\n`); process.exit(1); });
