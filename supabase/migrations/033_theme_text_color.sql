-- Add default text colour to theme settings
ALTER TABLE public.theme_settings
ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '#111111';
