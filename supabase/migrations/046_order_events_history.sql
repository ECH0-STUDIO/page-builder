-- 046_order_events_history.sql
-- Audit log for live orders, team RLS on orders, retention helper, web push subscriptions.

-- ─── order_events (append-only audit) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('order', 'order_item', 'service_request')),
  entity_id UUID,
  action TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_role TEXT,
  reason TEXT,
  before jsonb,
  after jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_business_created
  ON public.order_events (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_events_order_created
  ON public.order_events (business_id, order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_business_created
  ON public.orders (business_id, created_at DESC);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Team can read events; only owner/manager for history UI (enforced in app too)
DROP POLICY IF EXISTS "Team can view order events" ON public.order_events;
CREATE POLICY "Team can view order events"
  ON public.order_events FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']::text[]));

-- Inserts go through service role / server actions (admin client); allow authenticated team insert as fallback
DROP POLICY IF EXISTS "Team can insert order events" ON public.order_events;
CREATE POLICY "Team can insert order events"
  ON public.order_events FOR INSERT
  WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']::text[]));

-- ─── Broaden orders / order_items RLS for team (owner was only before) ────────
DROP POLICY IF EXISTS "Business owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Business owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Team can view orders" ON public.orders;
DROP POLICY IF EXISTS "Team can update orders" ON public.orders;

CREATE POLICY "Team can view orders"
  ON public.orders FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']::text[]));

CREATE POLICY "Team can update orders"
  ON public.orders FOR UPDATE
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']::text[]));

DROP POLICY IF EXISTS "Business owners can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Team can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Team can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Team can delete order items" ON public.order_items;

CREATE POLICY "Team can view order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND public.has_business_role(o.business_id, ARRAY['owner', 'manager', 'staff']::text[])
    )
  );

CREATE POLICY "Team can update order items"
  ON public.order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND public.has_business_role(o.business_id, ARRAY['owner', 'manager', 'staff']::text[])
    )
  );

CREATE POLICY "Team can delete order items"
  ON public.order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND public.has_business_role(o.business_id, ARRAY['owner', 'manager', 'staff']::text[])
    )
  );

-- ─── Hard-delete retention: current month + previous 3 calendar months ────────
CREATE OR REPLACE FUNCTION public.purge_orders_outside_retention()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz;
  deleted_count integer;
BEGIN
  -- First day of (current month − 3 months), UTC
  cutoff := date_trunc('month', (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')) - INTERVAL '3 months';

  DELETE FROM public.order_events
  WHERE created_at < cutoff;

  DELETE FROM public.service_requests
  WHERE created_at < cutoff;

  WITH doomed AS (
    SELECT id FROM public.orders WHERE created_at < cutoff
  )
  DELETE FROM public.orders o
  USING doomed d
  WHERE o.id = d.id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_orders_outside_retention() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_orders_outside_retention() TO service_role;

-- ─── Web Push subscriptions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, business_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_business
  ON public.push_subscriptions (business_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']::text[])
  );

-- Realtime for orders (service_requests already published in earlier migrations)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
