#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createCommunityTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating community tables...');
    
    // Create community posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        nickname VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT '자유게시판',
        tags JSON DEFAULT '[]',
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT false,
        ip_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created community_posts table');
    
    // Create community comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id VARCHAR NOT NULL,
        parent_id VARCHAR,
        nickname VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        ip_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES community_comments(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Created community_comments table');
    
    // Create community trends table
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_trends (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        period VARCHAR(20) NOT NULL,
        trending_topics JSONB,
        popular_keywords JSONB,
        recommended_content JSONB,
        analyzed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created community_trends table');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_category ON community_posts(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_pinned ON community_posts(is_pinned, created_at DESC)');
    
    console.log('✅ Created indexes');
    console.log('🎉 Community tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createCommunityTables().catch(console.error);