-- ============================================================
-- 050_security_rbac_tightening.sql
-- Restrict analytics/logs to owners/managers; lock billing RPCs to service_role.
-- ============================================================

-- ─── Page views: owner + manager only ────────────────────────────────────────

DROP POLICY IF EXISTS "Team members can view page views" ON public.page_views;
DROP POLICY IF EXISTS "Business owners can read their own page views" ON public.page_views;

CREATE POLICY "Owners and managers can view page views"
  ON public.page_views FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager']::text[]));

-- ─── Order event log: staff may write (live board) but not read history ────────

DROP POLICY IF EXISTS "Team can view order events" ON public.order_events;

CREATE POLICY "Owners and managers can view order events"
  ON public.order_events FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager']::text[]));

-- ─── Billing RPCs: service_role only (API routes / admin client) ─────────────

REVOKE ALL ON FUNCTION public.increment_page_view(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_page_view(uuid, date) TO service_role;

REVOKE ALL ON FUNCTION public.increment_page_view_and_bill(uuid, date, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_page_view_and_bill(uuid, date, integer) TO service_role;

REVOKE ALL ON FUNCTION public.bill_page_views_due(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bill_page_views_due(uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.increment_discount_uses(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_discount_uses(uuid) TO service_role;
