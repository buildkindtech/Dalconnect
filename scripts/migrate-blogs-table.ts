import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Migrate blogs table to add tags and target_age fields
 */
async function migrateBlogsTable() {
  console.log('🔄 Migrating blogs table...\n');

  try {
    // Add tags column (JSONB array)
    await db.execute(sql`
      ALTER TABLE blogs 
      ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb
    `);
    console.log('✅ Added tags column');

    // Add target_age column
    await db.execute(sql`
      ALTER TABLE blogs 
      ADD COLUMN IF NOT EXISTS target_age VARCHAR(50) DEFAULT 'all'
    `);
    console.log('✅ Added target_age column');

    // Add cover_url column (alias for cover_image)
    await db.execute(sql`
      ALTER TABLE blogs 
      ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)
    `);
    console.log('✅ Added cover_url column');

    // Update existing cover_url from cover_image if null
    await db.execute(sql`
      UPDATE blogs 
      SET cover_url = cover_image 
      WHERE cover_url IS NULL AND cover_image IS NOT NULL
    `);
    console.log('✅ Migrated existing cover images');

    console.log('\n✨ Blog table migration complete!');

  } catch (error) {
    console.error('❌ Error migrating blogs table:', error);
    throw error;
  }
}

migrateBlogsTable().then(() => process.exit(0)).catch(() => process.exit(1));
