-- 043_lock_down_credit_billing.sql
-- Go-live hardening for credit billing tables.
--
-- Early migrations added policies named "Service Role can manage …" with
-- USING (true) and no TO service_role restriction. Combined with broad
-- table grants to anon/authenticated, those policies let any client mint
-- or rewrite credit balances/orders. Drop them — service_role bypasses RLS.
-- Also deactivate the seeded 100% off TESTFREE promo.

DROP POLICY IF EXISTS "Service Role can manage credit balances" ON public.credit_balances;
DROP POLICY IF EXISTS "Service Role can manage credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Service Role can manage orders" ON public.credit_orders;
DROP POLICY IF EXISTS "Service Role can manage storage subscriptions" ON public.storage_subscriptions;

-- Members may SELECT (existing RBAC policies). Writes go through service role / SECURITY DEFINER RPCs only.
-- Ensure owners cannot UPDATE balances/orders directly via the Data API.
DROP POLICY IF EXISTS "Only owners can insert credit orders" ON public.credit_orders;

-- Keep owner insert for creating pending checkout rows from the user client if needed;
-- purchases currently use the admin client, so owner INSERT is optional. Re-create
-- a tight insert policy for owners (pending orders only via app actions using admin).
-- Intentionally omit INSERT/UPDATE/DELETE policies for authenticated on ledger tables.

UPDATE public.discount_codes
SET is_active = false
WHERE code = 'TESTFREE';

-- Atomic fulfill helper: mark pending order paid and credit balance in one transaction.
CREATE OR REPLACE FUNCTION public.fulfill_credit_order(p_order_code bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.credit_orders%ROWTYPE;
BEGIN
  SELECT *
  INTO v_order
  FROM public.credit_orders
  WHERE order_code = p_order_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_order.status = 'paid' THEN
    RETURN true; -- already fulfilled (idempotent)
  END IF;

  IF v_order.status IS DISTINCT FROM 'pending' THEN
    RETURN false;
  END IF;

  UPDATE public.credit_orders
  SET status = 'paid'
  WHERE id = v_order.id;

  INSERT INTO public.credit_balances (business_id, balance)
  VALUES (v_order.business_id, v_order.amount_credits)
  ON CONFLICT (business_id) DO UPDATE
  SET balance = public.credit_balances.balance + EXCLUDED.balance;

  IF v_order.discount_code_id IS NOT NULL THEN
    PERFORM public.increment_discount_uses(v_order.discount_code_id);
  END IF;

  INSERT INTO public.credit_transactions (business_id, amount, description)
  VALUES (
    v_order.business_id,
    v_order.amount_credits,
    'PayOS Payment (Order ' || p_order_code::text || ')'
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_credit_order(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_credit_order(bigint) TO service_role;
