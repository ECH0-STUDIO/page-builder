-- Add language and currency to profiles table
ALTER TABLE public.profiles
ADD COLUMN language text NOT NULL DEFAULT 'en',
ADD COLUMN currency text NOT NULL DEFAULT 'USD';
