import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function createListingsTable() {
  try {
    console.log('Creating listings table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        price NUMERIC(10,2),
        price_type VARCHAR(20) DEFAULT 'fixed',
        category VARCHAR(50) NOT NULL,
        condition VARCHAR(20),
        photos JSONB DEFAULT '[]'::jsonb,
        contact_method VARCHAR(20) DEFAULT 'phone',
        contact_info VARCHAR(200),
        author_name VARCHAR(100),
        author_phone VARCHAR(20),
        location VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
      );
    `);
    
    console.log('✅ Listings table created successfully');
    
    // Create indexes
    console.log('Creating indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
    `);
    
    console.log('✅ Indexes created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating listings table:', error);
    process.exit(1);
  }
}

createListingsTable();
