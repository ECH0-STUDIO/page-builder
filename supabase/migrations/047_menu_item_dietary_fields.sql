-- Independent dietary fields on menu items (separate from freeform tags).
-- spicy_level: 0 = not spicy, 1 = mild, 2 = medium, 3 = hot

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_vegetarian boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spicy_level smallint NOT NULL DEFAULT 0;

ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_spicy_level_check;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_spicy_level_check
  CHECK (spicy_level >= 0 AND spicy_level <= 3);

COMMENT ON COLUMN public.menu_items.is_vegetarian IS 'Guest-facing vegetarian indicator (independent of tags)';
COMMENT ON COLUMN public.menu_items.spicy_level IS '0 none, 1 mild, 2 medium, 3 hot';

-- Migrate common tag spellings into the new columns, then strip those tags.
UPDATE public.menu_items
SET is_vegetarian = true
WHERE is_vegetarian = false
  AND tags IS NOT NULL
  AND (
    tags && ARRAY['Vegetarian', 'vegetarian', 'Vegetarian ', 'Chay', 'chay']::text[]
  );

UPDATE public.menu_items
SET spicy_level = GREATEST(spicy_level, 2)
WHERE spicy_level = 0
  AND tags IS NOT NULL
  AND (
    tags && ARRAY['Spicy', 'spicy', 'Cay', 'cay']::text[]
  );

UPDATE public.menu_items
SET tags = ARRAY(
  SELECT t FROM unnest(COALESCE(tags, '{}'::text[])) AS t
  WHERE lower(trim(t)) NOT IN ('vegetarian', 'spicy', 'chay', 'cay')
)
WHERE tags IS NOT NULL
  AND (
    tags && ARRAY['Vegetarian', 'vegetarian', 'Spicy', 'spicy', 'Chay', 'chay', 'Cay', 'cay']::text[]
  );
