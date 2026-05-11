-- 011_block_anchor_id.sql
-- Adds a user-friendly anchor ID to each page block so users can
-- link to specific sections via scroll-to navigation.
-- e.g. block_anchor_id = 'menu' → scrolls to #menu

ALTER TABLE public.page_blocks
  ADD COLUMN IF NOT EXISTS block_anchor_id text DEFAULT NULL;
