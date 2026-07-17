-- ============================================================
-- 035_order_published.sql
-- Independent publish flag for the fixed order page (/{slug}/order)
-- Landing page continues to use publishing_settings.published
-- ============================================================

ALTER TABLE public.publishing_settings
ADD COLUMN IF NOT EXISTS order_published boolean NOT NULL DEFAULT false;

-- Existing live stores keep their order page online
UPDATE public.publishing_settings
SET order_published = published
WHERE order_published IS DISTINCT FROM published;
