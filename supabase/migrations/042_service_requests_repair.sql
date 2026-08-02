-- ============================================================
-- 042_service_requests_repair.sql
-- Idempotent repair for Call staff / Request check
-- Also creates has_business_role if missing (from 027 RBAC)
-- ============================================================

-- 1) Role helper (needed by team RLS policies)
CREATE OR REPLACE FUNCTION public.has_business_role(b_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = b_id AND b.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = b_id
    AND bm.user_id = auth.uid()
    AND bm.role = ANY(allowed_roles)
  );
$$;

-- 2) Table
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
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']::text[]));

DROP POLICY IF EXISTS "Team can update service requests" ON public.service_requests;
CREATE POLICY "Team can update service requests"
  ON public.service_requests FOR UPDATE
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']::text[]));

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

NOTIFY pgrst, 'reload schema';
