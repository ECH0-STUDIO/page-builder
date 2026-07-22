-- ============================================================
-- 036_service_requests.sql
-- Guest "Call staff" / "Request check" signals for the order page
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  type text NOT NULL CHECK (type IN ('call_staff', 'request_check')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_service_requests_business_status
  ON public.service_requests (business_id, status);

CREATE INDEX IF NOT EXISTS idx_service_requests_business_created
  ON public.service_requests (business_id, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.service_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Guests can create requests (also used via service-role admin client)
CREATE POLICY "Anyone can insert service requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (true);

-- Owners + team can read
CREATE POLICY "Team can view service requests"
  ON public.service_requests FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

-- Owners + team can update (acknowledge / dismiss)
CREATE POLICY "Team can update service requests"
  ON public.service_requests FOR UPDATE
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

-- Realtime for dashboard alerts (ignore if publication missing / already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
