-- ============================================================
-- 042_service_requests_repair.sql
-- Idempotent repair: grants + schema reload for PostgREST
-- Fixes: "Could not find the table 'public.service_requests' in the schema cache"
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

-- set_updated_at may not exist on older projects — only attach if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at ON public.service_requests;
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.service_requests
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$;

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert service requests" ON public.service_requests;
CREATE POLICY "Anyone can insert service requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Team can view service requests" ON public.service_requests;
CREATE POLICY "Team can view service requests"
  ON public.service_requests FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

DROP POLICY IF EXISTS "Team can update service requests" ON public.service_requests;
CREATE POLICY "Team can update service requests"
  ON public.service_requests FOR UPDATE
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

-- Critical: expose table to API roles (missing grants → schema cache miss)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.service_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.service_requests TO authenticated;
GRANT ALL ON TABLE public.service_requests TO service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
