-- 044_default_locale_vi.sql
-- Vietnamese is the primary product language. Align new-row defaults.

ALTER TABLE public.profiles
  ALTER COLUMN language SET DEFAULT 'vi';

ALTER TABLE public.profiles
  ALTER COLUMN currency SET DEFAULT 'VND';

ALTER TABLE public.publishing_settings
  ALTER COLUMN language SET DEFAULT 'vi';
