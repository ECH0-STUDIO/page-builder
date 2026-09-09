-- ============================================================
-- 061_order_only_publishing.sql
-- Make the "order page published, landing page not" combination actually work.
--
-- 035 gave the order page its own publish flag, and the dashboard exposes it as
-- a separate toggle, but is_business_published() still only looked at
-- `published`. Every public policy built on that helper — businesses,
-- menu_categories, menu_items, variants, theme_settings, payment_settings —
-- therefore hid everything for an order-only store, so /{slug}/order 404'd even
-- though the owner had published it.
--
-- Nothing that is visible today becomes hidden: this only widens the predicate.
-- The landing route still gates on `published` in application code
-- ([slug]/page.tsx), so an order-only store keeps returning 404 for its landing
-- page. Explore (explore-directory.ts:64) and the sitemap filter on
-- `published = true` explicitly, so order-only stores stay out of both.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_business_published(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.publishing_settings
    WHERE business_id = p_business_id
      AND (published = true OR order_published = true)
  );
$$;
