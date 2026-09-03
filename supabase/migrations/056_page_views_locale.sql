-- ============================================================
-- PAGE VIEWS BY LOCALE — analytics dimension (billing unchanged)
-- ============================================================
-- Unique key becomes (business_id, viewed_at, locale).
-- Billing RPCs still sum(count) across all locales → one credit pool.

alter table public.page_views
  add column if not exists locale text not null default '';

comment on column public.page_views.locale is
  'Storefront content locale for this view (e.g. vi, en). Empty string = unknown/legacy.';

-- Replace daily unique with locale-aware unique
alter table public.page_views
  drop constraint if exists page_views_business_id_viewed_at_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'page_views_business_id_viewed_at_locale_key'
  ) then
    alter table public.page_views
      add constraint page_views_business_id_viewed_at_locale_key
      unique (business_id, viewed_at, locale);
  end if;
end $$;

create index if not exists page_views_business_locale_idx
  on public.page_views (business_id, locale, viewed_at desc);

-- ============================================================
-- RPC: increment by locale (legacy helper)
-- ============================================================
create or replace function public.increment_page_view(
  p_business_id uuid,
  p_date date,
  p_locale text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.page_views (business_id, viewed_at, locale, count)
  values (p_business_id, p_date, coalesce(p_locale, ''), 1)
  on conflict (business_id, viewed_at, locale)
  do update set count = page_views.count + 1;
end;
$$;

-- ============================================================
-- RPC: increment + bill (locale for analytics; billing still aggregate)
-- ============================================================
create or replace function public.increment_page_view_and_bill(
  p_business_id uuid,
  p_date date,
  p_views_per_credit integer default 500,
  p_locale text default ''
)
returns table(credits_charged integer, total_views bigint, views_billed integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_billed integer;
  v_balance integer;
  v_due integer;
  v_charge integer;
begin
  if p_views_per_credit is null or p_views_per_credit < 1 then
    p_views_per_credit := 500;
  end if;

  insert into public.page_views (business_id, viewed_at, locale, count)
  values (p_business_id, p_date, coalesce(p_locale, ''), 1)
  on conflict (business_id, viewed_at, locale)
  do update set count = page_views.count + 1;

  -- Aggregate across locales — single shared credit pool
  select coalesce(sum(count), 0) into v_total
  from public.page_views
  where business_id = p_business_id;

  insert into public.credit_balances (business_id, balance, views_billed_total)
  values (p_business_id, 0, 0)
  on conflict (business_id) do nothing;

  select balance, views_billed_total
  into v_balance, v_billed
  from public.credit_balances
  where business_id = p_business_id
  for update;

  v_due := greatest(0, (v_total / p_views_per_credit) - (v_billed / p_views_per_credit));
  v_charge := least(v_due, greatest(v_balance, 0));

  if v_charge > 0 then
    update public.credit_balances
    set
      balance = balance - v_charge,
      views_billed_total = views_billed_total + (v_charge * p_views_per_credit),
      updated_at = now()
    where business_id = p_business_id;

    insert into public.credit_transactions (business_id, amount, description)
    values (
      p_business_id,
      -v_charge,
      format('Lượt xem trang — %s Credits (%s lượt / %s)',
        v_charge,
        v_charge * p_views_per_credit,
        p_views_per_credit)
    );

    v_billed := v_billed + (v_charge * p_views_per_credit);
  end if;

  return query select v_charge::integer, v_total, v_billed;
end;
$$;

-- Grants (match 050_security_rbac_tightening)
revoke all on function public.increment_page_view(uuid, date, text) from public;
grant execute on function public.increment_page_view(uuid, date, text) to service_role;

revoke all on function public.increment_page_view_and_bill(uuid, date, integer, text) from public;
grant execute on function public.increment_page_view_and_bill(uuid, date, integer, text) to service_role;
