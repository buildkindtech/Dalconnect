#!/usr/bin/env tsx
/**
 * Seed initial Korean businesses for DalConnect
 */

import { db } from "../server/db";
import { businesses } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const INITIAL_BUSINESSES = [
  // 한식당
  { name_en: "Seoul Garden Restaurant", name_ko: "서울가든", category: "한식당", city: "Carrollton", address: "2625 Old Denton Rd #412, Carrollton, TX 75007", phone: "(972) 242-7744", featured: true },
  { name_en: "Kogi BBQ House", name_ko: "고기 BBQ", category: "한식당", city: "Dallas", address: "2540 Royal Ln #246, Dallas, TX 75229", phone: "(214) 351-0999", featured: true },
  { name_en: "Komart Korean Restaurant", name_ko: "코마트 한식당", category: "한식당", city: "Carrollton", address: "3033 Old Denton Rd, Carrollton, TX 75007", phone: "(972) 245-5588", featured: false },
  { name_en: "Sura Korean Restaurant", name_ko: "수라 한식당", category: "한식당", city: "Dallas", address: "2714 Royal Ln #101, Dallas, TX 75229", phone: "(972) 869-0977", featured: false },
  { name_en: "New York Tofu House", name_ko: "뉴욕 순두부", category: "한식당", city: "Carrollton", address: "2625 Old Denton Rd #410, Carrollton, TX 75007", phone: "(972) 245-5599", featured: false },
  
  // 미용실
  { name_en: "Grace Hair Salon", name_ko: "그레이스 헤어살롱", category: "미용실", city: "Carrollton", address: "2540 Old Denton Rd #114, Carrollton, TX 75007", phone: "(972) 416-7700", featured: true },
  { name_en: "Jenny's Beauty Salon", name_ko: "제니 뷰티살롱", category: "미용실", city: "Dallas", address: "2625 Royal Ln, Dallas, TX 75229", phone: "(214) 905-5588", featured: false },
  { name_en: "Seoul Hair & Nail", name_ko: "서울 헤어 & 네일", category: "미용실", city: "Carrollton", address: "3033 Old Denton Rd #250, Carrollton, TX 75007", phone: "(972) 820-0077", featured: false },
  
  // 한인마트
  { name_en: "H Mart Carrollton", name_ko: "H Mart 캐럴턴", category: "한인마트", city: "Carrollton", address: "2625 Old Denton Rd, Carrollton, TX 75007", phone: "(972) 242-8777", featured: true },
  { name_en: "99 Ranch Market", name_ko: "99 Ranch", category: "한인마트", city: "Carrollton", address: "3201 Old Denton Rd #136, Carrollton, TX 75007", phone: "(972) 245-0066", featured: false },
  
  // 교회
  { name_en: "Dallas Korean Church", name_ko: "달라스 한인교회", category: "교회", city: "Dallas", address: "12400 Marsh Ln, Dallas, TX 75234", phone: "(972) 488-2200", featured: false },
  { name_en: "First Korean Baptist Church", name_ko: "제일 한인 침례교회", category: "교회", city: "Carrollton", address: "1908 N Josey Ln, Carrollton, TX 75006", phone: "(972) 242-5467", featured: false },
  
  // 병원
  { name_en: "Korean Medical Clinic", name_ko: "한인 내과", category: "병원", city: "Carrollton", address: "2540 Old Denton Rd #108, Carrollton, TX 75007", phone: "(972) 245-1004", featured: false },
  { name_en: "DFW Korean Dental", name_ko: "DFW 한인 치과", category: "치과", city: "Dallas", address: "2714 Royal Ln #210, Dallas, TX 75229", phone: "(972) 484-0505", featured: true },
];

async function main() {
  console.log("🌱 Seeding initial Korean businesses...\n");

  let added = 0;
  let skipped = 0;

  for (const biz of INITIAL_BUSINESSES) {
    try {
      // Check if already exists
      const existing = await db
        .select()
        .from(businesses)
        .where(
          and(
            eq(businesses.name_en, biz.name_en),
            eq(businesses.address, biz.address!)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Skipping: ${biz.name_en} (already exists)`);
        skipped++;
        continue;
      }

      await db.insert(businesses).values({
        ...biz,
        description: `${biz.category} in ${biz.city}`,
      });

      console.log(`✅ Added: ${biz.name_en} (${biz.category})`);
      added++;
    } catch (error) {
      console.error(`❌ Failed to add ${biz.name_en}:`, error);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Seeding Complete");
  console.log("=".repeat(50));
  console.log(`✅ Added: ${added} businesses`);
  console.log(`⏭️  Skipped: ${skipped} duplicates`);
  console.log(`📈 Total in DB: ${added + skipped}`);
}

main().catch(console.error);
