-- ============================================================
-- 008_block_extra_styling.sql
-- Adds per-block spacing + custom CSS to page_blocks
-- Run this in the Supabase SQL editor.
-- ============================================================

ALTER TABLE public.page_blocks
  ADD COLUMN IF NOT EXISTS spacing jsonb
    DEFAULT '{"padding_top":0,"padding_right":0,"padding_bottom":0,"padding_left":0,"margin_top":0,"margin_bottom":0}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_css text
    DEFAULT '';
