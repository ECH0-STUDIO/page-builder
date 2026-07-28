-- 045_business_google_maps_url.sql
-- Optional Google Maps URL for Contact map embed (preferred over address geocode).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS google_maps_url text;
