-- Bilingual menu content: store per-locale strings in JSONB.
-- Legacy name/description columns remain for backward compatibility and CSV export.

ALTER TABLE public.menu_categories
  ADD COLUMN IF NOT EXISTS name_i18n jsonb;

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS name_i18n jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n jsonb;

-- Backfill from existing single-language fields
UPDATE public.menu_categories
SET name_i18n = jsonb_build_object('vi', name, 'en', name)
WHERE name_i18n IS NULL AND name IS NOT NULL AND name <> '';

UPDATE public.menu_items
SET
  name_i18n = jsonb_build_object('vi', name, 'en', name),
  description_i18n = CASE
    WHEN description IS NOT NULL AND description <> '' THEN jsonb_build_object('vi', description, 'en', description)
    ELSE NULL
  END
WHERE name_i18n IS NULL AND name IS NOT NULL AND name <> '';
