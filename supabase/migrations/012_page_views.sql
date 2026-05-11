-- ============================================================
-- PAGE VIEWS — lightweight daily visit counter
-- ============================================================
-- One row per (business, date). count is incremented via upsert.
-- No personal data stored — just a daily integer per business.

create table public.page_views (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  viewed_at     date not null default current_date,
  count         integer not null default 1,
  unique (business_id, viewed_at)
);

create index page_views_business_id_idx on public.page_views(business_id);
create index page_views_viewed_at_idx   on public.page_views(business_id, viewed_at desc);

-- RLS: only the owning user can read their analytics,
-- but the increment happens via a service-role API route (bypasses RLS).
alter table public.page_views enable row level security;

create policy "Business owners can read their own page views"
  on public.page_views
  for select
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

-- ============================================================
-- RPC: atomic daily view increment
-- ============================================================
create or replace function public.increment_page_view(p_business_id uuid, p_date date)
returns void
language plpgsql
security definer  -- runs as owner, bypasses RLS
as $$
begin
  insert into public.page_views (business_id, viewed_at, count)
  values (p_business_id, p_date, 1)
  on conflict (business_id, viewed_at)
  do update set count = page_views.count + 1;
end;
$$;
