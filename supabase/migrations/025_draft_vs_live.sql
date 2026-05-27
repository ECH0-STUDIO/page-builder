-- ============================================================
-- 025_draft_vs_live.sql
-- Add snapshot columns for Draft vs Live page builder separation
-- ============================================================

ALTER TABLE public.publishing_settings
ADD COLUMN IF NOT EXISTS has_unpublished_changes boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS published_blocks jsonb,
ADD COLUMN IF NOT EXISTS published_theme jsonb;
