-- Paid storefront locales (Translation UI model)
-- Primary locale stays on publishing_settings.language (free).
-- Extra locales are billed monthly via credits.

CREATE TABLE IF NOT EXISTS public.business_locales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  locale text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled')),
  activated_at timestamptz NOT NULL DEFAULT now(),
  next_bill_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, locale)
);

CREATE INDEX IF NOT EXISTS business_locales_business_id_idx
  ON public.business_locales (business_id);

CREATE INDEX IF NOT EXISTS business_locales_active_idx
  ON public.business_locales (business_id, status)
  WHERE status = 'active';

COMMENT ON TABLE public.business_locales IS
  'Purchased storefront content locales (extra languages). Primary language is publishing_settings.language.';
COMMENT ON COLUMN public.business_locales.next_bill_at IS
  'When the next monthly LOCALE_CREDITS_PER_MONTH charge is due.';

ALTER TABLE public.business_locales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can view business locales" ON public.business_locales;
CREATE POLICY "Team can view business locales"
  ON public.business_locales FOR SELECT
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

DROP POLICY IF EXISTS "Owners and managers can manage business locales" ON public.business_locales;
CREATE POLICY "Owners and managers can manage business locales"
  ON public.business_locales FOR ALL
  USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_locales TO authenticated;
GRANT ALL ON public.business_locales TO service_role;
