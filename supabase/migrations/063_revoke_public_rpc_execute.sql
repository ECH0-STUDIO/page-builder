-- ============================================================
-- 063_revoke_public_rpc_execute.sql
-- Take privileged RPCs off the public REST API.
--
-- Supabase grants EXECUTE on every new function in `public` to anon and
-- authenticated through default privileges. Those are explicit role grants, so
-- `REVOKE ALL ON FUNCTION ... FROM PUBLIC` — the pattern 043 used — does not
-- remove them. Every SECURITY DEFINER helper below is therefore reachable at
-- /rest/v1/rpc/<name> with the anon key, which ships in the client bundle.
--
-- The worst of these:
--   fulfill_credit_order    — marks a pending order paid and credits the
--                             balance. Start a checkout, read your own
--                             order_code, call this instead of paying.
--   bill_page_views_due     — force-charges any business by id.
--   increment_page_view*    — same, via the view counter.
--   purge_orders_outside_retention — deletes order history on demand.
--   get_user_id_by_email    — reads auth.users; email enumeration.
--   increment_discount_uses — burns discount codes.
--
-- All of these are only ever called server-side with the service-role key
-- (payos webhook, /api/view, /api/cron/*, credits actions), or not at all, so
-- revoking anon and authenticated changes no working code path.
--
-- Deliberately NOT revoked:
--   get_slug_by_custom_domain — proxy.ts calls it with the anon key.
--   check_slug_available      — called with the user client during onboarding.
--   has_business_role, is_business_member, is_business_published,
--   is_owner_of_business      — evaluated inside RLS policy expressions as the
--                               querying role, so revoking EXECUTE would break
--                               RLS and take every storefront down.
-- ============================================================

REVOKE ALL ON FUNCTION public.fulfill_credit_order(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_credit_order(bigint) TO service_role;

REVOKE ALL ON FUNCTION public.bill_page_views_due(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bill_page_views_due(uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.purge_orders_outside_retention() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_orders_outside_retention() TO service_role;

REVOKE ALL ON FUNCTION public.increment_discount_uses(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_discount_uses(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;

-- Both overloads of each page-view helper.
REVOKE ALL ON FUNCTION public.increment_page_view(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view(uuid, date) TO service_role;

REVOKE ALL ON FUNCTION public.increment_page_view(uuid, date, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view(uuid, date, text) TO service_role;

REVOKE ALL ON FUNCTION public.increment_page_view_and_bill(uuid, date, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view_and_bill(uuid, date, integer) TO service_role;

REVOKE ALL ON FUNCTION public.increment_page_view_and_bill(uuid, date, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view_and_bill(uuid, date, integer, text) TO service_role;

-- Trigger functions. Triggers fire as the table owner and never consult these
-- grants, so removing REST access costs nothing.
REVOKE ALL ON FUNCTION public.create_default_credits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_default_storage_subscription() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Pin search_path on the SECURITY DEFINER helpers that still lack it, so a
-- caller cannot shadow `public` and change what the function resolves to.
ALTER FUNCTION public.is_business_member(uuid) SET search_path = public;
ALTER FUNCTION public.increment_discount_uses(uuid) SET search_path = public;
ALTER FUNCTION public.increment_page_view(uuid, date) SET search_path = public;
ALTER FUNCTION public.get_user_id_by_email(text) SET search_path = public;
ALTER FUNCTION public.create_default_credits() SET search_path = public;
ALTER FUNCTION public.create_default_storage_subscription() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.increment_page_view(uuid, date, text) SET search_path = public;
