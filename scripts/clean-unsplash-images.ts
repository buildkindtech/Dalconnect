import { db } from "../server/db";
import { businesses, news } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Remove all Unsplash stock photos from businesses and news
 * Set to NULL - frontend will handle missing images with category icons
 */
async function cleanUnsplashImages() {
  console.log('🧹 Starting Unsplash image cleanup...\n');

  try {
    // Clean business images
    console.log('Cleaning business images (cover_url, logo_url, photos)...');
    const businessResult = await db
      .update(businesses)
      .set({
        cover_url: null,
        logo_url: null,
        photos: null
      })
      .where(
        sql`
          ${businesses.cover_url} LIKE '%unsplash%' 
          OR ${businesses.logo_url} LIKE '%unsplash%'
          OR ${businesses.photos}::text LIKE '%unsplash%'
        `
      )
      .returning({ id: businesses.id, name: businesses.name_en });

    console.log(`✅ Cleaned ${businessResult.length} businesses`);
    if (businessResult.length > 0) {
      console.log('Sample cleaned businesses:', businessResult.slice(0, 5).map(b => b.name));
    }

    // Clean news thumbnails
    console.log('\nCleaning news thumbnails...');
    const newsResult = await db
      .update(news)
      .set({
        thumbnail_url: null
      })
      .where(sql`${news.thumbnail_url} LIKE '%unsplash%'`)
      .returning({ id: news.id, title: news.title });

    console.log(`✅ Cleaned ${newsResult.length} news items`);
    if (newsResult.length > 0) {
      console.log('Sample cleaned news:', newsResult.slice(0, 3).map(n => n.title));
    }

    console.log('\n✨ Unsplash cleanup complete!');
    console.log('Next step: Run fetch-google-photos.ts to replace with real business photos');
    
  } catch (error) {
    console.error('❌ Error cleaning images:', error);
    throw error;
  }
}

cleanUnsplashImages().then(() => process.exit(0)).catch(() => process.exit(1));
