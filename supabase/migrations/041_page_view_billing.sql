-- ============================================================
-- PAGE VIEW BILLING — 1 credit per 500 views
-- ============================================================
-- Tracks how many views have already been billed so we can charge
-- incrementally without re-billing historical traffic.

alter table public.credit_balances
  add column if not exists views_billed_total integer not null default 0
  check (views_billed_total >= 0);

comment on column public.credit_balances.views_billed_total is
  'Number of page views already covered by credit charges (watermark).';

-- Seed watermark to current totals so we only bill NEW views going forward.
update public.credit_balances cb
set views_billed_total = coalesce((
  select sum(pv.count)::integer
  from public.page_views pv
  where pv.business_id = cb.business_id
), 0)
where cb.views_billed_total = 0;

-- ============================================================
-- Atomic: increment daily view + bill any newly crossed 500-blocks
-- ============================================================
create or replace function public.increment_page_view_and_bill(
  p_business_id uuid,
  p_date date,
  p_views_per_credit integer default 500
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

  insert into public.page_views (business_id, viewed_at, count)
  values (p_business_id, p_date, 1)
  on conflict (business_id, viewed_at)
  do update set count = page_views.count + 1;

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

-- Reconcile unpaid views without incrementing (dashboard safety net)
create or replace function public.bill_page_views_due(
  p_business_id uuid,
  p_views_per_credit integer default 500
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
