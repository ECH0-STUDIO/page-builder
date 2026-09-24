-- Order page drafts must not replace the live order page until Publish.
-- Landing already does this with has_unpublished_changes + published_blocks.

ALTER TABLE public.publishing_settings
  ADD COLUMN IF NOT EXISTS order_has_unpublished_changes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_order jsonb;

COMMENT ON COLUMN public.publishing_settings.order_has_unpublished_changes IS
  'True after an order-page draft save until that order page is published.';

COMMENT ON COLUMN public.publishing_settings.published_order IS
  'Last published order-page appearance. Public /order reads this, not the draft columns.';

-- Keep currently live order pages unchanged: snapshot today's columns as published.
UPDATE public.publishing_settings
SET published_order = jsonb_build_object(
  'order_background_color', order_background_color,
  'order_background_image_url', order_background_image_url,
  'order_promo_slides', COALESCE(order_promo_slides, '[]'::jsonb),
  'order_carousel_aspect_desktop', COALESCE(order_carousel_aspect_desktop, '16/9'),
  'order_carousel_aspect_mobile', COALESCE(order_carousel_aspect_mobile, 'same'),
  'order_menu_config', order_menu_config
)
WHERE order_published = true
  AND published_order IS NULL;
