-- ============================================================
-- 006_slug_check_function.sql
--
-- Problem: The /api/check-slug route uses the anon/authenticated
-- Supabase client, which applies RLS. The "Owners can manage
-- their businesses" policy means each user can only see their
-- OWN slugs. So user B cannot detect that user A already has
-- slug "the-best-cafe" → false "available" → duplicate key error.
--
-- Fix: A SECURITY DEFINER function that checks slug uniqueness
-- across ALL businesses, bypassing RLS.
-- ============================================================

create or replace function public.check_slug_available(
  p_slug      text,
  p_exclude_id uuid default null
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from public.businesses
    where slug = lower(trim(p_slug))
      and (p_exclude_id is null or id != p_exclude_id)
  );
$$;

-- Grant execute to authenticated and anon roles
grant execute on function public.check_slug_available(text, uuid) to authenticated, anon;
