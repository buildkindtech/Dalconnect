import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function enrichFeatured() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🌟 Setting featured businesses (top 2 per category by rating)...');

    // First, reset all featured flags
    await pool.query('UPDATE businesses SET featured = false');
    console.log('✅ Reset all featured flags');

    // Get all categories
    const categoriesResult = await pool.query(`
      SELECT DISTINCT category 
      FROM businesses 
      WHERE category IS NOT NULL
      ORDER BY category
    `);

    const categories = categoriesResult.rows.map(r => r.category);
    console.log(`📊 Found ${categories.length} categories`);

    let totalFeatured = 0;

    // For each category, set top 2 by rating as featured
    for (const category of categories) {
      const result = await pool.query(`
        UPDATE businesses
        SET featured = true
        WHERE id IN (
          SELECT id FROM businesses
          WHERE category = $1
          ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST, created_at ASC
          LIMIT 2
        )
        RETURNING name_en, rating
      `, [category]);

      if (result.rows.length > 0) {
        console.log(`  ✨ ${category}: ${result.rows.map(r => `${r.name_en} (${r.rating})`).join(', ')}`);
        totalFeatured += result.rows.length;
      }
    }

    console.log(`\n🎉 Total featured businesses: ${totalFeatured}`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

enrichFeatured();
