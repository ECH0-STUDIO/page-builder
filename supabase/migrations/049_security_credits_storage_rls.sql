-- ============================================================
-- 049_security_credits_storage_rls.sql
-- Restrict credits visibility to owners/managers; scope storage to business paths.
-- ============================================================

-- ─── Credits: owner + manager only (not staff) ───────────────────────────────

DROP POLICY IF EXISTS "Team members can view credit balances" ON public.credit_balances;
DROP POLICY IF EXISTS "Team members can view credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Team members can view credit orders" ON public.credit_orders;
DROP POLICY IF EXISTS "Team members can view storage subscriptions" ON public.storage_subscriptions;
DROP POLICY IF EXISTS "Only owners can insert credit orders" ON public.credit_orders;

CREATE POLICY "Owners and managers can view credit balances"
  ON public.credit_balances FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager']::text[]));

CREATE POLICY "Owners and managers can view credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager']::text[]));

CREATE POLICY "Owners and managers can view credit orders"
  ON public.credit_orders FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager']::text[]));

CREATE POLICY "Owners and managers can view storage subscriptions"
  ON public.storage_subscriptions FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager']::text[]));

CREATE POLICY "Owners and managers can insert credit orders"
  ON public.credit_orders FOR INSERT
  WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'manager']::text[]));

-- ─── Storage: business-scoped writes (owner + manager only) ───────────────────

-- Logos
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Owners and managers can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can update logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can delete logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

-- Menu images
DROP POLICY IF EXISTS "Anyone can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

CREATE POLICY "Anyone can view menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

CREATE POLICY "Owners and managers can upload menu images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'menu-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can update menu images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'menu-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can delete menu images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'menu-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

-- Page builder images
DROP POLICY IF EXISTS "Anyone can view page images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload page images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update page images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete page images" ON storage.objects;

CREATE POLICY "Anyone can view page images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'page-images');

CREATE POLICY "Owners and managers can upload page images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'page-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can update page images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'page-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can delete page images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'page-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

-- Favicons bucket (referenced by gallery; create if missing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'favicons',
  'favicons',
  true,
  204800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view favicons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload favicons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update favicons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete favicons" ON storage.objects;
DROP POLICY IF EXISTS "Owners and managers can upload favicons" ON storage.objects;
DROP POLICY IF EXISTS "Owners and managers can update favicons" ON storage.objects;
DROP POLICY IF EXISTS "Owners and managers can delete favicons" ON storage.objects;

CREATE POLICY "Anyone can view favicons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'favicons');

CREATE POLICY "Owners and managers can upload favicons"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'favicons'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can update favicons"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'favicons'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );

CREATE POLICY "Owners and managers can delete favicons"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'favicons'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.has_business_role((storage.foldername(name))[1]::uuid, ARRAY['owner', 'manager']::text[])
  );
