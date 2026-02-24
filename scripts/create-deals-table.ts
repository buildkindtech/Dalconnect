#!/usr/bin/env tsx

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL!;

async function createDealsTable() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    console.log('Creating deals table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS deals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,  -- 'grocery', 'flight', 'restaurant', 'shopping', 'beauty', 'tech', 'coupon'
        store VARCHAR(100),  -- 'H마트', 'Costco', 'Amazon', '대한항공' 등
        original_price VARCHAR(50),  -- '$29.99'
        deal_price VARCHAR(50),  -- '$19.99'
        discount VARCHAR(50),  -- '33% OFF' 또는 'FREE'
        coupon_code VARCHAR(100),
        deal_url TEXT,
        image_url TEXT,
        expires_at TIMESTAMP,
        is_verified BOOLEAN DEFAULT true,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        source VARCHAR(100),  -- 'auto-scrape', 'user-submit', 'editorial'
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Deals table created successfully');
    
    // Create indexes
    console.log('Creating indexes...');
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_deals_category ON deals(category);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_deals_created ON deals(created_at DESC);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_deals_expires ON deals(expires_at);');
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating deals table:', error);
  } finally {
    await pool.end();
  }
}

createDealsTable();