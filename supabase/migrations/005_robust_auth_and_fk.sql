-- ============================================================
-- 005_robust_auth_and_fk.sql
--
-- Root cause analysis:
-- The handle_new_user trigger fires AFTER INSERT on auth.users.
-- If it throws (e.g. duplicate email in profiles, or profiles
-- table didn't exist yet when user first signed up), PostgreSQL
-- rolls back the entire transaction → the user record never
-- actually lands in auth.users → business insert FK fails.
--
-- This migration:
-- 1. Makes the handle_new_user trigger idempotent (UPSERT)
-- 2. Drops the email UNIQUE constraint on profiles (auth
--    already enforces one-email-per-account; double-enforcing
--    causes trigger rollbacks)
-- 3. Moves the businesses FK from auth.users → profiles so
--    it goes through the public schema (avoids any schema
--    permission edge-cases with auth schema)
-- 4. Adds a "backfill" that inserts profiles for any auth
--    users who don't have one yet
-- ============================================================

-- ── 1. Remove email uniqueness from profiles (auth enforces it)
alter table public.profiles
  drop constraint if exists profiles_email_key;

-- ── 2. Make trigger function idempotent with UPSERT
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do update
    set
      email      = excluded.email,
      full_name  = coalesce(excluded.full_name, profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
      updated_at = now();
  return new;
exception
  when others then
    -- Never block user creation due to a profile insert failure
    return new;
end;
$$;

-- ── 3. Backfill: create profiles for any auth users missing one
insert into public.profiles (id, email)
select
  u.id,
  u.email
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- ── 4. Move businesses FK from auth.users → public.profiles
--      (same UUID, just different schema — avoids auth schema access issues)
alter table public.businesses
  drop constraint if exists businesses_owner_id_fkey;

alter table public.businesses
  add constraint businesses_owner_id_fkey
  foreign key (owner_id)
  references public.profiles(id)
  on delete cascade;
