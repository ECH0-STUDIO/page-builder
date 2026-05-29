-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Update credit_orders to support discounts
ALTER TABLE credit_orders
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- RLS for discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Only admins/service role can access discount_codes directly, no public RLS needed

-- Function to increment discount uses safely
CREATE OR REPLACE FUNCTION increment_discount_uses(d_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discount_codes
  SET used_count = used_count + 1
  WHERE id = d_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a default test discount code (100% off) for production testing
INSERT INTO discount_codes (code, discount_type, discount_value, max_uses)
VALUES ('TESTFREE', 'percent', 100, 100)
ON CONFLICT (code) DO NOTHING;
