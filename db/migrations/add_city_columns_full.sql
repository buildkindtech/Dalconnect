-- Add city columns to all relevant tables for multi-city support

-- 1. Add city column to news table
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS city VARCHAR(50) DEFAULT 'dallas';

CREATE INDEX IF NOT EXISTS idx_news_city ON news(city);

-- 2. Add city column to blogs table
ALTER TABLE blogs 
ADD COLUMN IF NOT EXISTS city VARCHAR(50) DEFAULT 'dallas';

CREATE INDEX IF NOT EXISTS idx_blogs_city ON blogs(city);

-- 3. Add city column to listings table (marketplace)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS city VARCHAR(50) DEFAULT 'dallas';

CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);

-- 4. Add city column to community_posts table
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS city VARCHAR(50) DEFAULT 'dallas';

CREATE INDEX IF NOT EXISTS idx_community_posts_city ON community_posts(city);

-- 5. Add city column to charts table
ALTER TABLE charts 
ADD COLUMN IF NOT EXISTS city VARCHAR(50) DEFAULT 'dallas';

CREATE INDEX IF NOT EXISTS idx_charts_city ON charts(city);

-- 6. Update businesses table to ensure all existing records have 'dallas' as city
UPDATE businesses 
SET city = 'dallas' 
WHERE city IS NULL OR city = '';

-- 7. Newsletter subscribers city column (from existing migration)
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS city VARCHAR(50) DEFAULT 'dallas';

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_city ON newsletter_subscribers(city);

-- Update existing data to have default city
UPDATE news SET city = 'dallas' WHERE city IS NULL OR city = '';
UPDATE blogs SET city = 'dallas' WHERE city IS NULL OR city = '';
UPDATE listings SET city = 'dallas' WHERE city IS NULL OR city = '';
UPDATE community_posts SET city = 'dallas' WHERE city IS NULL OR city = '';
UPDATE charts SET city = 'dallas' WHERE city IS NULL OR city = '';
UPDATE newsletter_subscribers SET city = 'dallas' WHERE city IS NULL OR city = '';