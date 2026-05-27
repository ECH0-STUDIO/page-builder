-- ============================================================
-- 026_fix_analytics_team_rls.sql
-- Fix Row Level Security so team members can view analytics and billing
-- ============================================================

-- Fix page_views so team members can view
drop policy if exists "Owners can view page views" on public.page_views;
create policy "Owners and members can view page views"
  on public.page_views for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = page_views.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- Fix storage_subscriptions so owners are explicitly allowed
drop policy if exists "Users can view their business storage subscription" on public.storage_subscriptions;
create policy "Owners and members can view storage subscriptions"
  on public.storage_subscriptions for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = storage_subscriptions.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- Fix credit_balances
drop policy if exists "Users can view their business credit balances" on public.credit_balances;
create policy "Owners and members can view credit balances"
  on public.credit_balances for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = credit_balances.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- Fix credit_transactions
drop policy if exists "Users can view their business credit transactions" on public.credit_transactions;
create policy "Owners and members can view credit transactions"
  on public.credit_transactions for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = credit_transactions.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- Fix credit_orders
drop policy if exists "Users can view their business orders" on public.credit_orders;
create policy "Owners and members can view orders"
  on public.credit_orders for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = credit_orders.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );
