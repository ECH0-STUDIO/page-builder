-- Ensure footer_config exists on theme_settings (may be missing if 014 was not applied)
ALTER TABLE public.theme_settings
  ADD COLUMN IF NOT EXISTS footer_config jsonb;
