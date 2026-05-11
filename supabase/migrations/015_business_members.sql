-- ============================================================
-- BUSINESS MEMBERS (Team Management)
-- ============================================================
create table public.business_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, user_id)
);

create index business_members_business_id_idx on public.business_members(business_id);
create index business_members_user_id_idx on public.business_members(user_id);

-- Enable RLS
alter table public.business_members enable row level security;

-- RLS Policies for business_members
-- 1. Users can read members of businesses they belong to
create policy "Users can read members of their business"
on public.business_members for select
using (
  business_id in (
    select business_id from public.business_members where user_id = auth.uid()
  )
  or
  business_id in (
    select id from public.businesses where owner_id = auth.uid()
  )
);

-- Note: In the future, we will update all other tables' RLS policies 
-- to allow access if a user is a member of the business. For now, 
-- we are just laying the foundation for Team Management.
