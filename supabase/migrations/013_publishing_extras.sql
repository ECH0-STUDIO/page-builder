-- ============================================================
-- PUBLISHING EXTRAS — favicon, webclip, language, GSC tag
-- ============================================================

alter table public.publishing_settings
  add column if not exists favicon_url          text,
  add column if not exists apple_touch_icon_url text,
  add column if not exists language             text not null default 'en',
  add column if not exists gsc_verification     text;  -- Google Search Console meta tag content
