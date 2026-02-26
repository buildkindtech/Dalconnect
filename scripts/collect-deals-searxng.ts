#!/usr/bin/env node
/**
 * SearXNG로 실제 딜 수집
 * 로컬: http://localhost:8080
 */

import * as dotenv from "dotenv";
import pg from "pg";
import axios from "axios";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const SEARXNG_URL = "http://localhost:8080";

// 딜 검색 쿼리 (한/영)
const DEAL_QUERIES = [
  // 한인 마트
  "H mart weekly ad Dallas Texas 2026",
  "한남체인 weekly special Dallas",
  "Zion market weekly ad Texas",
  "korean grocery deals DFW",
  
  // Groupon/딜 사이트
  "Groupon korean restaurant Dallas",
  "korean BBQ deals Dallas coupon",
  "korean beauty deals Dallas",
  
  // 항공권
  "Korean Air Dallas Seoul deals 2026",
  "Asiana Airlines DFW ICN sale",
  
  // 일반 딜
  "korean deals Dallas 2026",
  "한인 특가 텍사스",
];

interface SearchResult {
  title: string;
  url: string;
  content?: string;
  publishedDate?: string;
}

interface Deal {
  title: string;
  store: string;
  discount: string;
  deal_url: string;
  expires_at: Date;
  category: string;
  description?: string;
}

async function searchSearXNG(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.get(`${SEARXNG_URL}/search`, {
      params: {
        q: query,
        format: 'json',
        categories: 'general',
        time_range: 'week', // 최근 1주일
      },
      timeout: 10000,
    });
    
    return (response.data.results || [])
      .filter((r: any) => r.url && r.title)
      .map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        publishedDate: r.publishedDate,
      }));
      
  } catch (error: any) {
    console.error(`  ❌ 검색 실패: ${query}`, error.message);
    return [];
  }
}

function extractDealFromResult(result: SearchResult, query: string): Deal | null {
  const title = result.title;
  const url = result.url;
  const content = result.content || '';
  
  // URL 필터: 신뢰할 수 있는 사이트만
  const trustedDomains = [
    'hmart.com',
    'hannamchain.com',
    'groupon.com',
    'koreanair.com',
    'flyasiana.com',
    'slickdeals.net',
    'retailmenot.com',
  ];
  
  const isTrusted = trustedDomains.some(domain => url.includes(domain));
  if (!isTrusted) return null;
  
  // 할인율 추출 (정규식)
  const discountMatch = (title + ' ' + content).match(/(\d+)%\s*(off|할인|discount)/i);
  const discount = discountMatch ? `${discountMatch[1]}% OFF` : '특가';
  
  // 스토어 추출
  let store = 'Unknown';
  if (url.includes('hmart.com')) store = 'H마트';
  else if (url.includes('hannamchain.com')) store = '한남체인';
  else if (url.includes('groupon.com')) store = 'Groupon';
  else if (url.includes('koreanair.com')) store = '대한항공';
  else if (url.includes('flyasiana.com')) store = '아시아나항공';
  
  // 카테고리 추출
  let category = 'general';
  if (query.includes('grocery') || query.includes('마트')) category = 'grocery';
  else if (query.includes('restaurant') || query.includes('BBQ')) category = 'restaurant';
  else if (query.includes('flight') || query.includes('항공')) category = 'flight';
  else if (query.includes('beauty')) category = 'beauty';
  
  // 만료일: 기본 2주 후
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  
  return {
    title: title.substring(0, 200), // 제목 길이 제한
    store,
    discount,
    deal_url: url,
    expires_at: expiresAt,
    category,
    description: content?.substring(0, 300),
  };
}

async function saveDeal(deal: Deal): Promise<boolean> {
  try {
    // 중복 체크 (URL 기준)
    const existing = await pool.query(
      'SELECT id FROM deals WHERE deal_url = $1',
      [deal.deal_url]
    );
    
    if (existing.rows.length > 0) {
      console.log(`  ⏭️  중복: ${deal.title}`);
      return false;
    }
    
    // 저장
    await pool.query(`
      INSERT INTO deals (
        title, store, discount, deal_url, 
        expires_at, category, description, source, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      deal.title,
      deal.store,
      deal.discount,
      deal.deal_url,
      deal.expires_at,
      deal.category,
      deal.description,
      'searxng',
      false, // 수동 검증 필요
    ]);
    
    console.log(`  ✅ ${deal.title}`);
    console.log(`     스토어: ${deal.store} | 할인: ${deal.discount}`);
    console.log(`     URL: ${deal.deal_url}`);
    
    return true;
    
  } catch (error: any) {
    console.error(`  ❌ 저장 실패: ${deal.title}`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 SearXNG로 실제 딜 수집 시작\n');
  console.log('='.repeat(70));
  
  let totalFound = 0;
  let totalSaved = 0;
  
  for (const query of DEAL_QUERIES) {
    console.log(`\n🔎 검색: "${query}"`);
    
    const results = await searchSearXNG(query);
    console.log(`   찾음: ${results.length}개 결과`);
    
    for (const result of results) {
      const deal = extractDealFromResult(result, query);
      
      if (deal) {
        totalFound++;
        const saved = await saveDeal(deal);
        if (saved) totalSaved++;
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 수집 완료:`);
  console.log(`   발견: ${totalFound}개 딜`);
  console.log(`   저장: ${totalSaved}개 (중복 제외)`);
  
  if (totalSaved === 0) {
    console.log(`\n⚠️  새로운 딜을 찾지 못했습니다.`);
    console.log(`   권장사항:`);
    console.log(`   1. 검색 쿼리 개선 (더 구체적으로)`);
    console.log(`   2. 시간대 변경 (마트 weekly ad 업데이트 시간)`);
    console.log(`   3. 크라우드소싱 병행`);
  }
  
  await pool.end();
}

// SearXNG 상태 확인
async function checkSearXNG(): Promise<boolean> {
  try {
    const response = await axios.get(SEARXNG_URL, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

(async () => {
  console.log('🔍 SearXNG 상태 확인...');
  const isRunning = await checkSearXNG();
  
  if (!isRunning) {
    console.error('❌ SearXNG가 실행 중이 아닙니다!');
    console.error('   실행: docker start searxng');
    console.error('   또는: docker run -d -p 8080:8080 searxng/searxng');
    process.exit(1);
  }
  
  console.log('✅ SearXNG 정상 작동 중\n');
  
  await main();
})().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
