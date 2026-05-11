-- Migration: 015_orders_tables.sql
-- Description: Create orders and order_items tables for the checkout and KDS flow

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  table_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'completed', 'cancelled'
  payment_method TEXT, -- e.g. 'vietqr', 'momo', 'cash'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  options JSONB, -- Array of selected options/variants
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Orders RLS Policies
-- Customers can insert orders anonymously
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Business owners can view their orders
CREATE POLICY "Business owners can view their orders"
  ON orders FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Business owners can update their orders (e.g. changing status)
CREATE POLICY "Business owners can update their orders"
  ON orders FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Order Items RLS Policies
-- Customers can insert order items anonymously
CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Business owners can view their order items
CREATE POLICY "Business owners can view their order items"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())));
