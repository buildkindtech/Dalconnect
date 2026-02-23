import { db } from "../server/db";
import { news } from "../shared/schema";
import { sql, lt } from "drizzle-orm";

/**
 * Clean up old and fake news from the database
 * Keep only recent news from trusted sources
 */
async function cleanNews() {
  console.log('🧹 Cleaning up old and untrusted news...\n');

  try {
    // Trusted Korean news sources
    const trustedSources = [
      'koreadaily.com',
      'koreatimes.com',
      'koreatimestx.com',
      'koreadailyhouston.com',
      'koreatimesusa.com'
    ];

    // Get all news
    const allNews = await db.select().from(news);
    console.log(`Total news items: ${allNews.length}`);

    // Date threshold: Keep news from last 6 months only
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let deleteCount = 0;
    const toDelete: string[] = [];

    for (const item of allNews) {
      let shouldDelete = false;
      let reason = '';

      // Check 1: Old news (older than 6 months)
      if (item.published_date && new Date(item.published_date) < sixMonthsAgo) {
        shouldDelete = true;
        reason = 'too old';
      }

      // Check 2: No published date
      if (!item.published_date) {
        shouldDelete = true;
        reason = 'no date';
      }

      // Check 3: Not from trusted source
      const isTrusted = trustedSources.some(source => 
        item.url?.toLowerCase().includes(source.toLowerCase()) ||
        item.source?.toLowerCase().includes(source.toLowerCase())
      );

      if (!isTrusted) {
        shouldDelete = true;
        reason = 'untrusted source';
      }

      // Check 4: Suspicious patterns (likely fake news)
      if (item.title?.includes('lorem ipsum') || 
          item.title?.includes('test') ||
          item.url?.includes('example.com')) {
        shouldDelete = true;
        reason = 'fake/test news';
      }

      if (shouldDelete) {
        toDelete.push(item.id);
        console.log(`❌ Deleting: "${item.title?.substring(0, 60)}..." (${reason})`);
        deleteCount++;
      }
    }

    // Delete in batch
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        await db.delete(news).where(sql`${news.id} = ${id}`);
      }
      console.log(`\n✅ Deleted ${deleteCount} news items`);
    } else {
      console.log('\n✅ No news items to delete - all clean!');
    }

    // Show remaining news
    const remaining = await db.select().from(news);
    console.log(`\n📊 Remaining news items: ${remaining.length}`);
    
    if (remaining.length > 0) {
      console.log('\nRecent trusted news:');
      remaining.slice(0, 5).forEach(item => {
        console.log(`  • ${item.title?.substring(0, 80)}...`);
        console.log(`    ${item.source} | ${item.published_date ? new Date(item.published_date).toLocaleDateString('ko-KR') : 'No date'}`);
      });
    }

    console.log('\n✨ News cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error cleaning news:', error);
    throw error;
  }
}

cleanNews().then(() => process.exit(0)).catch(() => process.exit(1));
