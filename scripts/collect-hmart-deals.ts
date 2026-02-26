#!/usr/bin/env node
/**
 * H마트 Weekly Ad 실제 딜 수집
 * 소스: https://www.hmart.com/weekly-ads
 */

import * as dotenv from "dotenv";
import pg from "pg";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

interface Deal {
  title: string;
  store: string;
  original_price?: string;
  deal_price: string;
  discount: string;
  deal_url: string;
  expires_at: Date;
  category: string;
}

async function scrapeHMartDeals(): Promise<Deal[]> {
  console.log("🛒 H마트 Weekly Ad 수집 시작...\n");
  
  try {
    // H마트 weekly ads 페이지
    const response = await axios.get("https://www.hmart.com/weekly-ads", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const foundDeals: Deal[] = [];
    
    // H마트는 PDF 형태로 제공하는 경우가 많음
    // 실제 구현 시 PDF 다운로드 + OCR 필요
    
    console.log("⚠️  H마트는 PDF/이미지 형태로 제공됩니다.");
    console.log("   실제 구현에는 PDF OCR 필요 (Tesseract, Google Vision API 등)\n");
    
    // 임시: 다음 화요일을 만료일로 설정
    const nextTuesday = new Date();
    nextTuesday.setDate(nextTuesday.getDate() + ((2 - nextTuesday.getDay() + 7) % 7 || 7));
    nextTuesday.setHours(23, 59, 59, 999);
    
    // TODO: 실제 PDF 파싱 구현
    
    return foundDeals;
    
  } catch (error: any) {
    console.error("❌ H마트 스크래핑 실패:", error.message);
    return [];
  }
}

async function scrapeGrouponDeals(): Promise<Deal[]> {
  console.log("💰 Groupon Dallas Korean 딜 수집 시작...\n");
  
  const foundDeals: Deal[] = [];
  
  try {
    // Groupon API (affiliate program 필요)
    // https://www.groupon.com/browse/dallas?query=korean
    
    const response = await axios.get("https://www.groupon.com/browse/dallas", {
      params: { query: "korean" },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Groupon 딜 파싱 (실제 HTML 구조에 맞게 수정 필요)
    $('[data-testid="deal-card"]').each((i, elem) => {
      const title = $(elem).find('h3').text().trim();
      const price = $(elem).find('.price').text().trim();
      const discount = $(elem).find('.discount').text().trim();
      const url = $(elem).find('a').attr('href');
      
      if (title && url) {
        foundDeals.push({
          title,
          store: "Groupon",
          deal_price: price || "특가",
          discount: discount || "할인",
          deal_url: url.startsWith('http') ? url : `https://www.groupon.com${url}`,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
          category: "restaurant" // 또는 자동 분류
        });
      }
    });
    
    console.log(`✅ Groupon 딜 ${foundDeals.length}개 발견\n`);
    
  } catch (error: any) {
    console.error("❌ Groupon 스크래핑 실패:", error.message);
  }
  
  return foundDeals;
}

async function scrapeFacebookDeals(): Promise<Deal[]> {
  console.log("📱 Facebook 한인 그룹 딜 수집 (계획)...\n");
  
  console.log("⚠️  Facebook 스크래핑은 복잡합니다:");
  console.log("   1. Facebook Graph API 필요 (앱 승인)");
  console.log("   2. Public 그룹만 가능");
  console.log("   3. 또는 RSS 피드 사용");
  console.log("   4. 수동 큐레이션이 더 현실적\n");
  
  // TODO: Facebook Graph API 연동
  
  return [];
}

async function main() {
  console.log("🎯 DalConnect 실제 딜 수집 시작\n");
  console.log("=".repeat(60));
  
  const allDeals: Deal[] = [];
  
  // 1. H마트
  const hmartDeals = await scrapeHMartDeals();
  allDeals.push(...hmartDeals);
  
  // 2. Groupon
  const grouponDeals = await scrapeGrouponDeals();
  allDeals.push(...grouponDeals);
  
  // 3. Facebook (나중에)
  // const facebookDeals = await scrapeFacebookDeals();
  // allDeals.push(...facebookDeals);
  
  console.log("=".repeat(60));
  console.log(`\n📊 총 ${allDeals.length}개 실제 딜 발견\n`);
  
  if (allDeals.length > 0) {
    console.log("💾 DB에 저장 중...\n");
    
    for (const deal of allDeals) {
      try {
        await pool.query(`
          INSERT INTO deals (
            title, store, original_price, deal_price, discount,
            deal_url, expires_at, category, source, is_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          deal.title,
          deal.store,
          deal.original_price,
          deal.deal_price,
          deal.discount,
          deal.deal_url,
          deal.expires_at,
          deal.category,
          'scraper',
          true
        ]);
        console.log(`✅ ${deal.title}`);
      } catch (error: any) {
        console.error(`❌ 저장 실패: ${deal.title}`, error.message);
      }
    }
    
    console.log(`\n🎉 ${allDeals.length}개 딜 저장 완료!\n`);
  } else {
    console.log("⚠️  수집된 딜이 없습니다.\n");
    console.log("다음 단계:");
    console.log("1. H마트 PDF OCR 구현");
    console.log("2. Groupon HTML 구조 확인");
    console.log("3. Facebook Graph API 연동");
    console.log("4. 또는 크라우드소싱 시작\n");
  }
  
  await pool.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
