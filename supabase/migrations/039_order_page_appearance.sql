-- ============================================================
-- 039_order_page_appearance.sql
-- Background color / image for the fixed order page
-- ============================================================

ALTER TABLE public.publishing_settings
ADD COLUMN IF NOT EXISTS order_background_color text,
ADD COLUMN IF NOT EXISTS order_background_image_url text;

COMMENT ON COLUMN public.publishing_settings.order_background_color IS
  'Order page shell background colour (optional)';
COMMENT ON COLUMN public.publishing_settings.order_background_image_url IS
  'Order page full-bleed background image (optional)';
