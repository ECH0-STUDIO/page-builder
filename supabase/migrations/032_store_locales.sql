-- Multi-locale store: enabled languages, per-locale SEO, menu visibility

ALTER TABLE publishing_settings
  ADD COLUMN IF NOT EXISTS enabled_locales text[] NOT NULL DEFAULT '{vi,en}';

ALTER TABLE publishing_settings
  ADD COLUMN IF NOT EXISTS seo_i18n jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Menu text i18n (idempotent if 031 already applied)
ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS name_i18n jsonb;

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS name_i18n jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n jsonb;

-- Per-locale visibility (NULL = visible in all enabled locales)
ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS visible_locales text[];

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS visible_locales text[];

-- Backfill menu i18n from legacy columns
UPDATE menu_categories
SET name_i18n = jsonb_build_object('vi', name, 'en', name)
WHERE name_i18n IS NULL AND name IS NOT NULL;

UPDATE menu_items
SET
  name_i18n = jsonb_build_object('vi', name, 'en', name),
  description_i18n = CASE
    WHEN description IS NOT NULL AND description <> ''
    THEN jsonb_build_object('vi', description, 'en', description)
    ELSE NULL
  END
WHERE name_i18n IS NULL AND name IS NOT NULL;
