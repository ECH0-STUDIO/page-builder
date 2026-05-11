-- Add analytics IDs to publishing_settings
ALTER TABLE publishing_settings 
ADD COLUMN IF NOT EXISTS google_analytics_id text,
ADD COLUMN IF NOT EXISTS facebook_pixel_id text,
ADD COLUMN IF NOT EXISTS tiktok_pixel_id text;

-- Add footer_config to theme_settings
ALTER TABLE theme_settings
ADD COLUMN IF NOT EXISTS footer_config jsonb;
