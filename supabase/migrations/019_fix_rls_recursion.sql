-- ============================================================
-- 019_fix_rls_recursion.sql
-- Fixes the infinite recursion bug in business_members RLS
-- ============================================================

-- 1. Drop the buggy policy that causes infinite recursion
drop policy if exists "Users can read members of their business" on public.business_members;

-- 2. Use our existing `is_business_member` function which is SECURITY DEFINER.
-- Since it runs as admin, it won't trigger RLS on business_members, completely
-- avoiding the infinite recursion loop!
create policy "Users can read members of their business"
on public.business_members for select
using (
  public.is_business_member(business_id)
  or
  business_id in (
    select id from public.businesses where owner_id = auth.uid()
  )
);
