-- Custom domain verification + billing tracking
ALTER TABLE public.publishing_settings
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_billed_until TIMESTAMPTZ;

-- Resolve business slug from a verified custom domain (used by edge proxy)
CREATE OR REPLACE FUNCTION public.get_slug_by_custom_domain(p_domain text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.slug
  FROM public.businesses b
  JOIN public.publishing_settings ps ON ps.business_id = b.id
  WHERE lower(ps.custom_domain) = lower(p_domain)
    AND ps.custom_domain_verified = true
    AND ps.published = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_slug_by_custom_domain(text) TO anon, authenticated, service_role;

-- Owners should also see credit balances (not only business_members)
DROP POLICY IF EXISTS "Users can view their business credit balances" ON public.credit_balances;
CREATE POLICY "Users can view their business credit balances"
  ON public.credit_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = credit_balances.business_id
        AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = credit_balances.business_id
        AND bm.user_id = auth.uid()
    )
  );

-- Owners should also see credit transactions
DROP POLICY IF EXISTS "Users can view their business credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their business credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = credit_transactions.business_id
        AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = credit_transactions.business_id
        AND bm.user_id = auth.uid()
    )
  );

-- Owners should also see storage subscriptions
DROP POLICY IF EXISTS "Users can view their business storage subscription" ON public.storage_subscriptions;
CREATE POLICY "Users can view their business storage subscription"
  ON public.storage_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = storage_subscriptions.business_id
        AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = storage_subscriptions.business_id
        AND bm.user_id = auth.uid()
    )
  );
