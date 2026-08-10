-- Featured / today's specials pin on menu items (order page strip + still in category).

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.menu_items.is_featured IS 'When true, dish appears in Featured strip on the order page and remains in its category';

CREATE INDEX IF NOT EXISTS menu_items_business_featured_idx
  ON public.menu_items (business_id)
  WHERE is_featured = true;
