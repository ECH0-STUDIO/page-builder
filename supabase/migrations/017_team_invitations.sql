-- 017_team_invitations.sql

-- Create the team_invitations table
create table public.team_invitations (
    id uuid default gen_random_uuid() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    email text not null,
    role text not null check (role in ('manager', 'staff')),
    token uuid default gen_random_uuid() not null,
    status text default 'pending' check (status in ('pending', 'accepted')) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default timezone('utc'::text, now() + interval '7 days') not null
);

-- Indexes for fast lookups
create index idx_team_invitations_business_id on public.team_invitations(business_id);
create index idx_team_invitations_email on public.team_invitations(email);
create index idx_team_invitations_token on public.team_invitations(token);

-- RLS Policies
alter table public.team_invitations enable row level security;

-- Policy 1: Only business owners can view invitations for their business
create policy "Business owners can view invitations"
on public.team_invitations for select
using (
    exists (
        select 1 from public.businesses
        where id = team_invitations.business_id
        and owner_id = auth.uid()
    )
);

-- Policy 2: Only business owners can insert invitations
create policy "Business owners can insert invitations"
on public.team_invitations for insert
with check (
    exists (
        select 1 from public.businesses
        where id = business_id
        and owner_id = auth.uid()
    )
);

-- Policy 3: Only business owners can delete invitations
create policy "Business owners can delete invitations"
on public.team_invitations for delete
using (
    exists (
        select 1 from public.businesses
        where id = team_invitations.business_id
        and owner_id = auth.uid()
    )
);

-- Wait, for the acceptance flow, a non-owner (or even non-logged-in user initially, though they will log in)
-- needs to verify the token. 
-- Since they log in first, and then hit the API, the API can use the service_role key to verify and accept the token.
-- So we don't strictly need an RLS policy for the invitee to read/update the invitation. The server action will use createAdminClient().
