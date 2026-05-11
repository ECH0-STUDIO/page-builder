-- 009_theme_heading_font.sql
-- Splits font control into heading + body fonts

ALTER TABLE public.theme_settings
  ADD COLUMN IF NOT EXISTS heading_font_family text DEFAULT 'Inter';
