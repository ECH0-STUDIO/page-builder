-- ============================================================
-- 057_publishing_settings_public_read.sql
-- Close the open SELECT policy on publishing_settings.
--
-- 002_rls_policies.sql created "Anyone can view publishing settings" USING (true)
-- so the storefront could check published status. 027_comprehensive_rbac.sql later
-- added a team-scoped SELECT policy but never dropped the open one, and Postgres
-- ORs permissive policies — so the anon key could read every tenant's row,
-- including unpublished drafts, analytics/pixel IDs, Search Console tokens and
-- custom domains.
--
-- Storefront reads only ever use rows where published (landing) or order_published
-- (order page) is true, so restricting anon to those rows keeps every public page
-- working. Dashboard reads are unaffected: has_business_role() already matches the
-- business owner via businesses.owner_id as well as business_members.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view publishing settings" ON public.publishing_settings;

CREATE POLICY "Public can view live storefront settings"
  ON public.publishing_settings FOR SELECT
  TO anon, authenticated
  USING (published = true OR order_published = true);
