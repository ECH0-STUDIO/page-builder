-- Backfill legacy publishing_settings.language (schema default was 'en' before 044).
-- Product primary is Vietnamese. Keep 'en' only when dual language is on with EN as primary.

UPDATE public.publishing_settings
SET language = 'vi'
WHERE language IS NULL
   OR language = ''
   OR (language = 'en' AND dual_language_enabled = false);

COMMENT ON COLUMN public.publishing_settings.language IS
  'Primary storefront locale (vi | en). Default vi. Secondary lives at /{locale}/{slug} when dual is on.';
