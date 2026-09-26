-- ============================================================
-- 066_rls_initplan_and_fk_indexes.sql
--
-- auth.uid() inside a policy is re-run for every row. Wrapping it as
-- (select auth.uid()) makes Postgres compute it once per query. The
-- condition is the same, so who can read or write each row does not change.
--
-- Foreign keys without an index make deletes and joins scan. These five
-- are the ones the database flagged. Existing indexes are left in place.
-- ============================================================

DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
           c.relname AS table_name,
           p.polname AS policy_name,
           pg_get_expr(p.polqual, p.polrelid) AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        coalesce(pg_get_expr(p.polqual, p.polrelid), '') ~ 'auth\.(uid|jwt|role)\(\)'
        OR coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ~ 'auth\.(uid|jwt|role)\(\)'
      )
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_qual := regexp_replace(new_qual, 'auth\.role\(\)', '(select auth.role())', 'g');
      new_qual := replace(new_qual, '(select (select auth.uid()))', '(select auth.uid())');
      new_qual := replace(new_qual, '(select (select auth.jwt()))', '(select auth.jwt())');
      new_qual := replace(new_qual, '(select (select auth.role()))', '(select auth.role())');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(new_check, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      new_check := regexp_replace(new_check, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_check := regexp_replace(new_check, 'auth\.role\(\)', '(select auth.role())', 'g');
      new_check := replace(new_check, '(select (select auth.uid()))', '(select auth.uid())');
      new_check := replace(new_check, '(select (select auth.jwt()))', '(select auth.jwt())');
      new_check := replace(new_check, '(select (select auth.role()))', '(select auth.role())');
    END IF;

    IF new_qual IS NOT NULL AND new_qual IS DISTINCT FROM r.qual THEN
      EXECUTE 'ALTER POLICY ' || quote_ident(r.policy_name)
        || ' ON ' || quote_ident(r.schema_name) || '.' || quote_ident(r.table_name)
        || ' USING (' || new_qual || ')';
    END IF;

    IF new_check IS NOT NULL AND new_check IS DISTINCT FROM r.with_check THEN
      EXECUTE 'ALTER POLICY ' || quote_ident(r.policy_name)
        || ' ON ' || quote_ident(r.schema_name) || '.' || quote_ident(r.table_name)
        || ' WITH CHECK (' || new_check || ')';
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS credit_orders_business_id_idx
  ON public.credit_orders (business_id);

CREATE INDEX IF NOT EXISTS credit_orders_discount_code_id_idx
  ON public.credit_orders (discount_code_id);

-- (business_id, order_id) does not cover a lookup by order_id alone.
CREATE INDEX IF NOT EXISTS order_events_order_id_idx
  ON public.order_events (order_id);

CREATE INDEX IF NOT EXISTS order_events_actor_user_id_idx
  ON public.order_events (actor_user_id);

CREATE INDEX IF NOT EXISTS order_items_item_id_idx
  ON public.order_items (item_id);
