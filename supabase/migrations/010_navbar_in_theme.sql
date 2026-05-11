-- 010_navbar_in_theme.sql
-- Adds navbar_config JSONB to theme_settings so the navbar is a global
-- page setting (always present) rather than an optional block.

ALTER TABLE public.theme_settings
  ADD COLUMN IF NOT EXISTS navbar_config jsonb
    DEFAULT '{
      "links": [],
      "logo_type": "business_name",
      "sticky": true,
      "background_color": "#ffffff",
      "text_color": "#111111"
    }'::jsonb;
