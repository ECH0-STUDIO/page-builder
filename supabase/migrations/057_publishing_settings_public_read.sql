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
-- working.
--
-- Dashboard reads are unaffected. The live FOR ALL policy on this table is
-- "Owners and members can manage publishing settings", whose USING clause is
-- `b.owner_id = auth.uid() OR is_business_member(b.id)`. FOR ALL covers SELECT,
-- so owners and team members keep full read access without the open policy.
-- (Note: the live policy set has drifted from these migration files — 027's
-- has_business_role policy is not actually present on the database.)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view publishing settings" ON public.publishing_settings;

CREATE POLICY "Public can view live storefront settings"
  ON public.publishing_settings FOR SELECT
  TO anon, authenticated
  USING (published = true OR order_published = true);
