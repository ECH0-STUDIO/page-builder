-- ============================================================
-- 037_order_promo_slides.sql
-- Editable promo carousel slides for the fixed order page
-- ============================================================

ALTER TABLE public.publishing_settings
ADD COLUMN IF NOT EXISTS order_promo_slides jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.publishing_settings.order_promo_slides IS
  'Ordered promo carousel slides for /{slug}/order. Empty array = auto fallback from OG/hero/menu images.';
