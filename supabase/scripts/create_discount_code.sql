-- Platform admin: create a discount code for a business owner (run in Supabase SQL editor)
-- 100% off = free credit purchase at checkout

INSERT INTO discount_codes (code, discount_type, discount_value, max_uses, is_active)
VALUES ('YOURCODE', 'percent', 100, 10, true)
ON CONFLICT (code) DO NOTHING;

-- Examples:
-- 50% off one purchase:
-- INSERT INTO discount_codes (code, discount_type, discount_value, max_uses) VALUES ('HALF50', 'percent', 50, 100);
--
-- Fixed 10,000 VND off:
-- INSERT INTO discount_codes (code, discount_type, discount_value, max_uses) VALUES ('SAVE10K', 'fixed', 10000, 50);
