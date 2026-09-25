-- Landing SEO follows the same draft/live split as page blocks.
-- The builder writes seo_* immediately; the public store reads published_seo
-- until the next landing publish. Null means "no divergence yet" — live keeps
-- using the columns.

ALTER TABLE public.publishing_settings
  ADD COLUMN IF NOT EXISTS published_seo jsonb;

COMMENT ON COLUMN public.publishing_settings.published_seo IS
  'Last published SEO snapshot (title, description, images, tracking ids, seo_i18n). Null until the first meta edit after go-live.';
