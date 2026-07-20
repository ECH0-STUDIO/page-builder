-- ============================================================
-- 040_order_carousel_aspect.sql
-- Desktop / mobile aspect ratios for order-page promo carousel
-- ============================================================

ALTER TABLE public.publishing_settings
ADD COLUMN IF NOT EXISTS order_carousel_aspect_desktop text NOT NULL DEFAULT '16/9',
ADD COLUMN IF NOT EXISTS order_carousel_aspect_mobile text NOT NULL DEFAULT 'same';

COMMENT ON COLUMN public.publishing_settings.order_carousel_aspect_desktop IS
  'Carousel aspect ratio on desktop: 16/9 | 21/9 | 4/3 | 1/1';
COMMENT ON COLUMN public.publishing_settings.order_carousel_aspect_mobile IS
  'Carousel aspect on mobile: same | 16/9 | 4/3 | 1/1 (same = use desktop)';
