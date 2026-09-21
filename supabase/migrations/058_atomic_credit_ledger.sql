-- ============================================================
-- 058_atomic_credit_ledger.sql
-- Make credit debits and grants atomic.
--
-- deductCreditsInternal / grantCreditsInternal read the balance, adjust it in
-- JavaScript and write it back. The CHECK (balance >= 0) on credit_balances
-- stops the balance going negative but does not stop a lost update: two
-- concurrent billing calls can both read the same balance, both write, and
-- both log a transaction — charging the customer twice while the balance and
-- the ledger silently disagree.
--
-- These helpers do the whole thing under a row lock, matching the pattern
-- already used by fulfill_credit_order in 043_lock_down_credit_billing.sql.
-- ============================================================

-- Debit. Returns ok = false (and leaves the ledger untouched) when the
-- business cannot cover the amount.
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_business_id uuid,
  p_amount integer,
  p_description text
)
RETURNS TABLE (ok boolean, balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    SELECT cb.balance INTO v_balance
    FROM public.credit_balances cb
    WHERE cb.business_id = p_business_id;
    RETURN QUERY SELECT true, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  SELECT cb.balance INTO v_balance
  FROM public.credit_balances cb
  WHERE cb.business_id = p_business_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN QUERY SELECT false, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  -- The row is locked above, so v_balance is current. Using it instead of
  -- reading the column again also avoids colliding with the RETURNS TABLE
  -- output parameter that is also named `balance` (otherwise every deduction
  -- fails with 42702 "column reference balance is ambiguous").
  UPDATE public.credit_balances cb
  SET balance = v_balance - p_amount,
      updated_at = now()
  WHERE cb.business_id = p_business_id;

  INSERT INTO public.credit_transactions (business_id, amount, description)
  VALUES (p_business_id, -p_amount, p_description);

  RETURN QUERY SELECT true, v_balance - p_amount;
END;
$$;

-- Grant / refund. Creates the balance row when a business has none.
CREATE OR REPLACE FUNCTION public.grant_credits_atomic(
  p_business_id uuid,
  p_amount integer,
  p_description text
)
RETURNS TABLE (ok boolean, balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    SELECT cb.balance INTO v_balance
    FROM public.credit_balances cb
    WHERE cb.business_id = p_business_id;
    RETURN QUERY SELECT true, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  INSERT INTO public.credit_balances AS cb (business_id, balance)
  VALUES (p_business_id, p_amount)
  ON CONFLICT (business_id) DO UPDATE
  SET balance = cb.balance + EXCLUDED.balance,
      updated_at = now()
  RETURNING cb.balance INTO v_balance;

  INSERT INTO public.credit_transactions (business_id, amount, description)
  VALUES (p_business_id, p_amount, p_description);

  RETURN QUERY SELECT true, v_balance;
END;
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to anon
-- and authenticated, and those are explicit grants that REVOKE ... FROM PUBLIC
-- does not remove (this is why 043's revoke on fulfill_credit_order never took
-- effect). Without naming the roles, grant_credits_atomic would be reachable at
-- /rest/v1/rpc/grant_credits_atomic with the public anon key — anyone could mint
-- credits. Revoke from the roles by name.
REVOKE ALL ON FUNCTION public.deduct_credits_atomic(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits_atomic(uuid, integer, text) TO service_role;

REVOKE ALL ON FUNCTION public.grant_credits_atomic(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits_atomic(uuid, integer, text) TO service_role;
