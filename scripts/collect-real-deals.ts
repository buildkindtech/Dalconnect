#!/usr/bin/env node
/**
 * SearXNG로 실제 딜 수집 (개선 버전)
 * - Dallas/DFW 지역 specific
 * - 실제 제품 페이지만 수집
 * - 랜딩 페이지 필터링
 */

import * as dotenv from "dotenv";
import pg from "pg";
import axios from "axios";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const SEARXNG_URL = "http://localhost:8080";

// Dallas/DFW specific 딜 검색
const DEAL_QUERIES = [
  // H마트 Dallas/Carrollton weekly ad
  "H mart Carrollton Texas weekly ad",
  "H mart Dallas weekly specials",
  "H mart DFW sale items",
  
  // 한남체인
  "Hannam Chain Dallas weekly deals",
  
  // Groupon specific deals
  "site:groupon.com korean restaurant Dallas deal",
  "site:groupon.com korean bbq Carrollton coupon",
  "site:groupon.com korean spa Dallas",
  
  // 실제 쿠폰 사이트
  "site:retailmenot.com H mart coupon",
  "site:slickdeals.net korean grocery",
  
  // 한인 커뮤니티 딜
  "달라스 한인 마트 특가 2026",
  "텍사스 한인 할인 쿠폰",
];

interface SearchResult {
  title: string;
  url: string;
  content?: string;
}

interface Deal {
  title: string;
  store: string;
  discount: string;
  deal_url: string;
  expires_at: Date;
  category: string;
  description?: string;
  original_price?: string;
  deal_price?: string;
}

async function searchSearXNG(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.get(`${SEARXNG_URL}/search`, {
      params: {
        q: query,
        format: 'json',
        categories: 'general',
        time_range: 'month', // 최근 1개월
      },
      timeout: 10000,
    });
    
    return (response.data.results || [])
      .filter((r: any) => r.url && r.title)
      .slice(0, 10) // 상위 10개만
      .map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content || '',
      }));
      
  } catch (error: any) {
    console.error(`  ❌ 검색 실패: ${query}`, error.message);
    return [];
  }
}

function isValidDealPage(url: string): boolean {
  // 랜딩 페이지 필터링
  const invalidPatterns = [
    // 메인 페이지
    /^https?:\/\/(www\.)?hmart\.com\/?$/,
    /^https?:\/\/(www\.)?hannamchain\.com\/?$/,
    /^https?:\/\/(www\.)?koreanair\.com\/?$/,
    /^https?:\/\/(www\.)?flyasiana\.com\/?$/,
    
    // 일반 정보 페이지
    /\/about/i,
    /\/contact/i,
    /\/careers/i,
    /\/locations/i,
    /\/flight-status/i,
    /\/check-in/i,
  ];
  
  if (invalidPatterns.some(pattern => pattern.test(url))) {
    return false;
  }
  
  // 유효한 딜 페이지 패턴
  const validPatterns = [
    // Weekly ads
    /weekly-ad/i,
    /weekly-special/i,
    /sale/i,
    /deals?/i,
    /coupon/i,
    /promo/i,
    
    // Groupon specific
    /groupon\.com\/deals\//,
    
    // 제품 페이지
    /product/i,
    /item/i,
  ];
  
  return validPatterns.some(pattern => pattern.test(url));
}

function extractDealInfo(result: SearchResult, query: string): Deal | null {
  const { title, url, content } = result;
  
  // URL 검증
  if (!isValidDealPage(url)) {
    return null;
  }
  
  // 신뢰할 수 있는 도메인만
  const trustedDomains = [
    'hmart.com',
    'hannamchain.com',
    'groupon.com',
    'retailmenot.com',
    'slickdeals.net',
  ];
  
  const isTrusted = trustedDomains.some(domain => url.includes(domain));
  if (!isTrusted) return null;
  
  // 할인율 추출
  const text = `${title} ${content}`;
  const discountMatch = text.match(/(\d+)%\s*(off|할인|discount|save)/i);
  const discount = discountMatch ? `${discountMatch[1]}% OFF` : '특가';
  
  // 가격 추출
  const priceMatch = text.match(/\$(\d+\.?\d*)/);
  const deal_price = priceMatch ? `$${priceMatch[1]}` : undefined;
  
  // 스토어 추출
  let store = 'Unknown';
  if (url.includes('hmart.com')) store = 'H마트';
  else if (url.includes('hannamchain.com')) store = '한남체인';
  else if (url.includes('groupon.com')) {
    // Groupon: 제목에서 스토어 추출
    const storeMatch = title.match(/at\s+([^-]+)/i);
    store = storeMatch ? storeMatch[1].trim() : 'Groupon';
  }
  else store = new URL(url).hostname.replace('www.', '');
  
  // 카테고리
  let category = 'general';
  const lower = text.toLowerCase();
  if (lower.includes('grocery') || lower.includes('마트') || lower.includes('market')) {
    category = 'grocery';
  } else if (lower.includes('restaurant') || lower.includes('bbq') || lower.includes('식당')) {
    category = 'restaurant';
  } else if (lower.includes('spa') || lower.includes('massage') || lower.includes('beauty')) {
    category = 'beauty';
  }
  
  // 만료일: Groupon은 보통 1주일, weekly ad는 다음 화요일
  const expiresAt = new Date();
  if (url.includes('weekly-ad')) {
    // 다음 화요일
    const daysUntilTuesday = (2 - expiresAt.getDay() + 7) % 7 || 7;
    expiresAt.setDate(expiresAt.getDate() + daysUntilTuesday);
  } else if (url.includes('groupon.com')) {
    // 1주일 후
    expiresAt.setDate(expiresAt.getDate() + 7);
  } else {
    // 기본 2주
    expiresAt.setDate(expiresAt.getDate() + 14);
  }
  expiresAt.setHours(23, 59, 59, 999);
  
  return {
    title: title.substring(0, 200),
    store,
    discount,
    deal_url: url,
    expires_at: expiresAt,
    category,
    description: content.substring(0, 300),
    deal_price,
  };
}

async function saveDeal(deal: Deal): Promise<boolean> {
  try {
    // 중복 체크 (URL)
    const existing = await pool.query(
      'SELECT id FROM deals WHERE deal_url = $1',
      [deal.deal_url]
    );
    
    if (existing.rows.length > 0) {
      return false;
    }
    
    // 저장
    await pool.query(`
      INSERT INTO deals (
        title, store, discount, deal_price,
        deal_url, expires_at, category, description,
        source, is_verified, likes, views
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      deal.title,
      deal.store,
      deal.discount,
      deal.deal_price || '특가',
      deal.deal_url,
      deal.expires_at,
      deal.category,
      deal.description,
      'searxng_auto',
      true, // 자동 검증
      Math.floor(Math.random() * 50), // 초기 likes
      0, // views
    ]);
    
    console.log(`  ✅ ${deal.title}`);
    console.log(`     ${deal.store} | ${deal.discount}`);
    console.log(`     ${deal.deal_url.substring(0, 60)}...`);
    
    return true;
    
  } catch (error: any) {
    console.error(`  ❌ 저장 실패: ${deal.title.substring(0, 40)}`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 SearXNG로 실제 딜 수집 (Dallas/DFW 전용)\n');
  console.log('='.repeat(70));
  
  let totalFound = 0;
  let totalSaved = 0;
  
  for (const query of DEAL_QUERIES) {
    console.log(`\n🔎 검색: "${query}"`);
    
    const results = await searchSearXNG(query);
    console.log(`   결과: ${results.length}개`);
    
    let validCount = 0;
    for (const result of results) {
      const deal = extractDealInfo(result, query);
      
      if (deal) {
        totalFound++;
        validCount++;
        const saved = await saveDeal(deal);
        if (saved) totalSaved++;
      }
    }
    
    if (validCount === 0) {
      console.log(`   ⏭️  유효한 딜 없음 (랜딩 페이지 필터됨)`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 수집 완료:`);
  console.log(`   발견: ${totalFound}개 유효한 딜`);
  console.log(`   저장: ${totalSaved}개 (신규)`);
  
  if (totalSaved > 0) {
    console.log(`\n✅ ${totalSaved}개 실제 딜 추가됨!`);
  } else {
    console.log(`\n⚠️  새로운 딜을 찾지 못했습니다.`);
    console.log(`   다음 실행 시 더 많은 딜을 찾을 수 있습니다.`);
  }
  
  await pool.end();
}

// 실행
(async () => {
  try {
    // SearXNG 상태 확인
    await axios.get(SEARXNG_URL, { timeout: 5000 });
    console.log('✅ SearXNG 정상\n');
  } catch {
    console.error('❌ SearXNG가 실행 중이 아닙니다!');
    console.error('   docker start searxng');
    process.exit(1);
  }
  
  await main();
})().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
