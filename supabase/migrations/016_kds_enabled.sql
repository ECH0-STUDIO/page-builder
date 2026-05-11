-- 016_kds_enabled.sql
-- Adds a kds_enabled boolean column to businesses.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS kds_enabled BOOLEAN DEFAULT true;
