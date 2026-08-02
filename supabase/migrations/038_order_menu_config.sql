-- ============================================================
-- 038_order_menu_config.sql
-- Independent menu config for the fixed order page (/{slug}/order)
-- null = legacy fallback (all items + landing menu_grid styling)
-- ============================================================

ALTER TABLE public.publishing_settings
ADD COLUMN IF NOT EXISTS order_menu_config jsonb;

COMMENT ON COLUMN public.publishing_settings.order_menu_config IS
  'MenuGridConfig for /{slug}/order. NULL = auto fallback (all items). Goes live on save.';
