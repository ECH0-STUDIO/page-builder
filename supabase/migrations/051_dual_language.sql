-- Dual language storefront (VI + EN): feature flag, setup status, variant i18n

ALTER TABLE public.publishing_settings
  ADD COLUMN IF NOT EXISTS dual_language_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dual_language_setup_status text NOT NULL DEFAULT 'idle';

ALTER TABLE public.publishing_settings
  DROP CONSTRAINT IF EXISTS publishing_settings_dual_language_setup_status_check;

ALTER TABLE public.publishing_settings
  ADD CONSTRAINT publishing_settings_dual_language_setup_status_check
  CHECK (dual_language_setup_status IN ('idle', 'running', 'ready', 'failed'));

COMMENT ON COLUMN public.publishing_settings.dual_language_enabled IS
  'When true, storefront supports primary + secondary locale content (VI/EN).';
COMMENT ON COLUMN public.publishing_settings.dual_language_setup_status IS
  'Setup progress when enabling dual language: idle | running | ready | failed.';
COMMENT ON COLUMN public.publishing_settings.language IS
  'Primary storefront locale (vi | en) — SEO canonical and default /{slug} content.';

-- Variant group / option text i18n
ALTER TABLE public.menu_item_variant_groups
  ADD COLUMN IF NOT EXISTS name_i18n jsonb;

ALTER TABLE public.menu_item_variant_options
  ADD COLUMN IF NOT EXISTS label_i18n jsonb;

UPDATE public.menu_item_variant_groups vg
SET name_i18n = jsonb_build_object('vi', vg.name, 'en', vg.name)
WHERE name_i18n IS NULL AND vg.name IS NOT NULL;

UPDATE public.menu_item_variant_options vo
SET label_i18n = jsonb_build_object('vi', vo.label, 'en', vo.label)
WHERE label_i18n IS NULL AND vo.label IS NOT NULL;

-- Align enabled_locales with primary until dual is explicitly enabled
UPDATE public.publishing_settings ps
SET enabled_locales = ARRAY[COALESCE(NULLIF(ps.language, ''), 'vi')]::text[]
WHERE dual_language_enabled = false;
