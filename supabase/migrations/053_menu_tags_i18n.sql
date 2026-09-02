-- Per-locale display names for custom menu item tags (preset tags use i18n dictionary)

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS tags_i18n jsonb;

COMMENT ON COLUMN public.menu_items.tags_i18n IS
  'Map of tag key → { vi, en, _customized } for custom tag labels; preset tags use app i18n.';
