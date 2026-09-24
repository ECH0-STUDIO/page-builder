-- ============================================================
-- 062_hot_path_indexes.sql
-- Composite indexes for the three ordered reads that run most often.
--
-- Existing indexes cover business_id alone, so these queries filter using the
-- index and then sort in memory. Adding the sort key lets Postgres read the
-- rows already ordered. Cheap now, and these are exactly the tables that grow.
-- ============================================================

-- The credits page and the balance widget both read the ledger newest-first
-- (credits.ts:60, credits.ts:158, credits-internal.ts:134) and no index has
-- created_at at all.
CREATE INDEX IF NOT EXISTS credit_transactions_business_created_idx
  ON public.credit_transactions (business_id, created_at DESC);

-- Every storefront and order page load reads both of these ordered by sort_order.
CREATE INDEX IF NOT EXISTS menu_categories_business_sort_idx
  ON public.menu_categories (business_id, sort_order);

CREATE INDEX IF NOT EXISTS menu_items_business_sort_idx
  ON public.menu_items (business_id, sort_order);
