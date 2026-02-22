import { db } from "../db";
import { businesses, news } from "@/shared/schema";
import { MOCK_BUSINESSES, MOCK_NEWS } from "../client/src/data/mockData";

async function seed() {
  console.log("🌱 Seeding database...");
  
  try {
    // Clear existing data
    console.log("  Clearing existing data...");
    await db.delete(businesses);
    await db.delete(news);
    
    // Insert businesses
    console.log("  Inserting businesses...");
    for (const business of MOCK_BUSINESSES) {
      await db.insert(businesses).values({
        id: business.id,
        name_en: business.name_en,
        name_ko: business.name_ko,
        category: business.category,
        description: business.description,
        address: business.address,
        city: business.city,
        phone: business.phone,
        email: business.email,
        website: business.website,
        hours: business.hours,
        logo_url: business.logo_url,
        cover_url: business.cover_url,
        photos: business.photos,
        tier: business.tier,
        featured: business.featured,
        claimed: business.claimed,
        rating: business.rating.toString(),
        review_count: business.review_count
      });
    }
    console.log(`  ✅ Inserted ${MOCK_BUSINESSES.length} businesses`);
    
    // Insert news
    console.log("  Inserting news...");
    for (const newsItem of MOCK_NEWS) {
      await db.insert(news).values({
        id: newsItem.id,
        title: newsItem.title,
        url: newsItem.url,
        content: newsItem.content,
        category: newsItem.category,
        published_date: new Date(newsItem.published_date),
        source: newsItem.source,
        thumbnail_url: newsItem.thumbnail_url
      });
    }
    console.log(`  ✅ Inserted ${MOCK_NEWS.length} news items`);
    
    console.log("\n🎉 Seeding complete!");
    console.log(`  Total: ${MOCK_BUSINESSES.length} businesses + ${MOCK_NEWS.length} news`);
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
