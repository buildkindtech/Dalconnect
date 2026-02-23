import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Category mapping for cleanup
const categoryMapping: Record<string, string> = {
  '식당': 'Korean Restaurant',
  '한식당': 'Korean Restaurant',
  'Restaurant': 'Korean Restaurant',
  '기타': 'Other',
  // Add more mappings as needed
};

async function cleanupCategories() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🧹 Cleaning up categories...');

    // Get current category distribution
    const beforeResult = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM businesses
      GROUP BY category
      ORDER BY count DESC
    `);

    console.log('\n📊 Before cleanup:');
    beforeResult.rows.forEach(r => console.log(`  ${r.category}: ${r.count}`));

    let updated = 0;

    // Apply mappings
    for (const [oldCategory, newCategory] of Object.entries(categoryMapping)) {
      const result = await pool.query(
        'UPDATE businesses SET category = $1 WHERE category = $2 RETURNING id',
        [newCategory, oldCategory]
      );
      
      if (result.rows.length > 0) {
        console.log(`  ✅ Updated ${result.rows.length} businesses: "${oldCategory}" → "${newCategory}"`);
        updated += result.rows.length;
      }
    }

    // Get updated distribution
    const afterResult = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM businesses
      GROUP BY category
      ORDER BY count DESC
    `);

    console.log('\n📊 After cleanup:');
    afterResult.rows.forEach(r => console.log(`  ${r.category}: ${r.count}`));

    console.log(`\n✅ Total updated: ${updated} businesses`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

cleanupCategories();
