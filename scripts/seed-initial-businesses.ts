#!/usr/bin/env tsx
/**
 * Seed initial Korean businesses for DalConnect
 * Mock data until Google Maps API is configured
 */

import { db } from "../server/db";
import { businesses } from "../shared/schema";

const INITIAL_BUSINESSES = [
  // 한식당
  { name: "Seoul Garden Restaurant", category: "한식당", city: "Carrollton", address: "2625 Old Denton Rd #412, Carrollton, TX 75007", phone: "(972) 242-7744", featured: true },
  { name: "Kogi BBQ House", category: "한식당", city: "Dallas", address: "2540 Royal Ln #246, Dallas, TX 75229", phone: "(214) 351-0999", featured: true },
  { name: "Komart Korean Restaurant", category: "한식당", city: "Carrollton", address: "3033 Old Denton Rd, Carrollton, TX 75007", phone: "(972) 245-5588" },
  { name: "Sura Korean Restaurant", category: "한식당", city: "Dallas", address: "2714 Royal Ln #101, Dallas, TX 75229", phone: "(972) 869-0977" },
  { name: "New York Tofu House", category: "한식당", city: "Carrollton", address: "2625 Old Denton Rd #410, Carrollton, TX 75007", phone: "(972) 245-5599" },
  
  // 미용실
  { name: "Grace Hair Salon", category: "미용실", city: "Carrollton", address: "2540 Old Denton Rd #114, Carrollton, TX 75007", phone: "(972) 416-7700", featured: true },
  { name: "Jenny's Beauty Salon", category: "미용실", city: "Dallas", address: "2625 Royal Ln, Dallas, TX 75229", phone: "(214) 905-5588" },
  { name: "Seoul Hair & Nail", category: "미용실", city: "Carrollton", address: "3033 Old Denton Rd #250, Carrollton, TX 75007", phone: "(972) 820-0077" },
  
  // 한인마트
  { name: "H Mart Carrollton", category: "한인마트", city: "Carrollton", address: "2625 Old Denton Rd, Carrollton, TX 75007", phone: "(972) 242-8777", featured: true },
  { name: "99 Ranch Market", category: "한인마트", city: "Carrollton", address: "3201 Old Denton Rd #136, Carrollton, TX 75007", phone: "(972) 245-0066" },
  
  // 교회
  { name: "Dallas Korean Church", category: "교회", city: "Dallas", address: "12400 Marsh Ln, Dallas, TX 75234", phone: "(972) 488-2200", featured: false },
  { name: "First Korean Baptist Church", category: "교회", city: "Carrollton", address: "1908 N Josey Ln, Carrollton, TX 75006", phone: "(972) 242-5467" },
  
  // 병원
  { name: "Korean Medical Clinic", category: "병원", city: "Carrollton", address: "2540 Old Denton Rd #108, Carrollton, TX 75007", phone: "(972) 245-1004" },
  { name: "DFW Korean Dental", category: "치과", city: "Dallas", address: "2714 Royal Ln #210, Dallas, TX 75229", phone: "(972) 484-0505", featured: true },
];

async function main() {
  console.log("🌱 Seeding initial Korean businesses...\n");

  let added = 0;
  let skipped = 0;

  for (const biz of INITIAL_BUSINESSES) {
    try {
      // Check if already exists
      const existing = await db.query.businesses.findFirst({
        where: (businesses, { eq, and }) =>
          and(
            eq(businesses.name, biz.name),
            eq(businesses.address, biz.address)
          ),
      });

      if (existing) {
        console.log(`⏭️  Skipping: ${biz.name} (already exists)`);
        skipped++;
        continue;
      }

      await db.insert(businesses).values({
        ...biz,
        description: `${biz.category} in ${biz.city}`,
        verified: true,
      });

      console.log(`✅ Added: ${biz.name} (${biz.category})`);
      added++;
    } catch (error) {
      console.error(`❌ Failed to add ${biz.name}:`, error);
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
