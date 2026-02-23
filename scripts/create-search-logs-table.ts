import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function createSearchLogsTable() {
  try {
    console.log('Creating search_logs table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS search_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        query VARCHAR(200) NOT NULL,
        results_count INTEGER DEFAULT 0,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ search_logs table created successfully');
    
    // Create indexes for performance
    console.log('Creating indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_logs_results_count ON search_logs(results_count);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);
    `);
    
    console.log('✅ Indexes created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating search_logs table:', error);
    process.exit(1);
  }
}

createSearchLogsTable();
