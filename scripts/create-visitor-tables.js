import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creating site_stats table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_stats (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        page_views INT DEFAULT 0,
        unique_visitors INT DEFAULT 0,
        UNIQUE(date)
      )
    `);
    console.log('✅ site_stats table created');

    console.log('🔧 Creating visitor_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitor_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        visitor_hash VARCHAR(64) NOT NULL,
        page VARCHAR(200),
        referrer VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ visitor_logs table created');

    console.log('🔧 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_visitor_date ON visitor_logs(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_visitor_hash ON visitor_logs(visitor_hash)`);
    console.log('✅ Indexes created');

    console.log('📊 Inserting initial data...');
    
    // 오늘
    await client.query(`
      INSERT INTO site_stats (date, page_views, unique_visitors)
      VALUES (CURRENT_DATE, 50, 35)
      ON CONFLICT (date) DO UPDATE 
      SET page_views = EXCLUDED.page_views, unique_visitors = EXCLUDED.unique_visitors
    `);
    
    // 어제
    await client.query(`
      INSERT INTO site_stats (date, page_views, unique_visitors)
      VALUES (CURRENT_DATE - INTERVAL '1 day', 30, 20)
      ON CONFLICT (date) DO UPDATE 
      SET page_views = EXCLUDED.page_views, unique_visitors = EXCLUDED.unique_visitors
    `);
    
    // 일주일 전부터 데이터 채우기
    await client.query(`
      INSERT INTO site_stats (date, page_views, unique_visitors) VALUES
        (CURRENT_DATE - INTERVAL '2 days', 45, 32),
        (CURRENT_DATE - INTERVAL '3 days', 60, 40),
        (CURRENT_DATE - INTERVAL '4 days', 55, 38),
        (CURRENT_DATE - INTERVAL '5 days', 40, 28),
        (CURRENT_DATE - INTERVAL '6 days', 35, 25),
        (CURRENT_DATE - INTERVAL '7 days', 50, 35)
      ON CONFLICT (date) DO NOTHING
    `);
    
    console.log('✅ Initial data inserted');

    // 총 통계 확인
    const result = await client.query(`
      SELECT 
        SUM(page_views) as total_views,
        SUM(unique_visitors) as total_unique
      FROM site_stats
    `);
    
    console.log(`\n📈 Total statistics:`);
    console.log(`   Total page views: ${result.rows[0].total_views}`);
    console.log(`   Total unique visitors: ${result.rows[0].total_unique}`);
    
    // 오늘 통계 확인
    const today = await client.query(`
      SELECT page_views, unique_visitors
      FROM site_stats
      WHERE date = CURRENT_DATE
    `);
    
    if (today.rows.length > 0) {
      console.log(`\n📊 Today's statistics:`);
      console.log(`   Page views: ${today.rows[0].page_views}`);
      console.log(`   Unique visitors: ${today.rows[0].unique_visitors}`);
    }
    
    console.log('\n✨ All done!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTables().catch(console.error);
