import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function createTables() {
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    
    // Create business_claims table
    console.log('📋 Creating business_claims table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_claims (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        business_id VARCHAR REFERENCES businesses(id),
        owner_name VARCHAR(100) NOT NULL,
        owner_email VARCHAR(200) NOT NULL,
        owner_phone VARCHAR(20) NOT NULL,
        verification_code VARCHAR(6),
        verification_expires TIMESTAMP,
        verified BOOLEAN DEFAULT false,
        tier VARCHAR(20) DEFAULT 'free',
        stripe_customer_id VARCHAR(100),
        stripe_subscription_id VARCHAR(100),
        password_hash VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(business_id),
        UNIQUE(owner_email)
      );
    `);
    console.log('✅ business_claims table created');

    // Create indexes
    console.log('📋 Creating indexes for business_claims...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_claims_email ON business_claims(owner_email);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_claims_business ON business_claims(business_id);
    `);
    console.log('✅ Indexes created');

    // Create business_submissions table
    console.log('📋 Creating business_submissions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_submissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name_ko VARCHAR(200),
        name_en VARCHAR(200) NOT NULL,
        category VARCHAR(50) NOT NULL,
        address VARCHAR(300) NOT NULL,
        city VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(200),
        website VARCHAR(300),
        description TEXT,
        owner_name VARCHAR(100) NOT NULL,
        owner_email VARCHAR(200) NOT NULL,
        owner_phone VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ business_submissions table created');

    console.log('\n🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables()
  .then(() => {
    console.log('\n✨ Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to setup database:', error);
    process.exit(1);
  });
