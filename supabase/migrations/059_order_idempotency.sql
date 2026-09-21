-- ============================================================
-- 059_order_idempotency.sql
-- Give order creation an idempotency key.
--
-- createOrderAction is an unauthenticated endpoint (diners have no account)
-- that inserts a new row on every call. A double-tap on "Place order", or a
-- retry on flaky venue Wi-Fi, produces duplicate tickets on the kitchen board.
--
-- The client now sends one token per checkout attempt. The unique index makes
-- a replay collide instead of inserting, and the action returns the original
-- order. Nullable + partial index so older clients that send no token keep
-- working unchanged.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_token uuid;

CREATE UNIQUE INDEX IF NOT EXISTS orders_client_token_key
  ON public.orders (client_token)
  WHERE client_token IS NOT NULL;

-- The per-business and per-table flood checks in createOrderAction are already
-- covered by idx_orders_business_created (business_id, created_at DESC) from
-- 034. Adding another one here just doubled the write cost of every insert.
