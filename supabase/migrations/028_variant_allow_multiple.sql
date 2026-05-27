-- Add allow_multiple boolean to variant groups
ALTER TABLE public.menu_item_variant_groups 
ADD COLUMN allow_multiple BOOLEAN NOT NULL DEFAULT false;
