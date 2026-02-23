-- Add city column to newsletter_subscribers table
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS city VARCHAR(50) DEFAULT 'dallas';

-- Create index for faster city-based queries
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_city ON newsletter_subscribers(city);
