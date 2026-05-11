-- 012_payment_settings.sql
-- Adds a payment_settings JSONB column to businesses.
-- Stores VietQR config: { bank_code, account_number, account_name, note_template }
-- No separate table needed — payment settings are 1:1 with a business.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{}';
