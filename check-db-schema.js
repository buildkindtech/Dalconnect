import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_4PuSVOLIE0Gw@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function checkSchema() {
  try {
    // 테이블 스키마 확인
    console.log('=== News table schema ===');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'news' 
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    schemaResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 샘플 데이터 조회
    console.log('\n=== Sample news data ===');
    const sampleResult = await pool.query('SELECT * FROM news LIMIT 3');
    
    console.log(`Found ${sampleResult.rows.length} sample records:`);
    sampleResult.rows.forEach((row, index) => {
      console.log(`\nRecord ${index + 1}:`);
      Object.keys(row).forEach(key => {
        const value = row[key];
        const displayValue = typeof value === 'string' && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : value;
        console.log(`  ${key}: ${displayValue}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();