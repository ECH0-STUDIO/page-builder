-- ============================================================
-- DIAGNOSTIC — run this in Supabase SQL editor, share results
-- ============================================================

-- 1. Who is in auth.users?
select id, email, created_at, email_confirmed_at
from auth.users
order by created_at desc;

-- 2. Who is in profiles?
select id, email, created_at
from public.profiles
order by created_at desc;

-- 3. Are there any businesses?
select id, owner_id, name, created_at
from public.businesses;
