-- ============================================================
-- 004_fix_rls_recursion.sql
-- Fix infinite recursion in RLS policies caused by circular
-- subqueries between businesses ↔ publishing_settings.
--
-- Solution: two SECURITY DEFINER functions that bypass RLS
-- when checking ownership/published state.
-- ============================================================

-- ── Helper 1: does current user own this business? (bypasses RLS)
create or replace function public.is_owner_of_business(p_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = p_business_id
      and owner_id = auth.uid()
  );
$$;

-- ── Helper 2: is this business published? (bypasses RLS)
create or replace function public.is_business_published(p_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.publishing_settings
    where business_id = p_business_id
      and published = true
  );
$$;

-- ================================================================
-- BUSINESSES — fix the policy that queries publishing_settings
-- ================================================================
drop policy if exists "Anyone can view published marketplace businesses" on public.businesses;

create policy "Anyone can view published marketplace businesses"
  on public.businesses for select
  using (public.is_business_published(id));

-- ================================================================
-- THEME SETTINGS
-- ================================================================
drop policy if exists "Owners can manage theme settings" on public.theme_settings;
drop policy if exists "Anyone can view theme settings of published businesses" on public.theme_settings;

create policy "Owners can manage theme settings"
  on public.theme_settings for all
  using (public.is_owner_of_business(business_id));

create policy "Anyone can view theme settings of published businesses"
  on public.theme_settings for select
  using (public.is_business_published(business_id));

-- ================================================================
-- PUBLISHING SETTINGS
-- ================================================================
drop policy if exists "Owners can manage publishing settings" on public.publishing_settings;

create policy "Owners can manage publishing settings"
  on public.publishing_settings for all
  using (public.is_owner_of_business(business_id));

-- "Anyone can view publishing settings" stays as-is (using true)

-- ================================================================
-- PAGE BLOCKS
-- ================================================================
drop policy if exists "Owners can manage page blocks" on public.page_blocks;
drop policy if exists "Anyone can view blocks of published businesses" on public.page_blocks;

create policy "Owners can manage page blocks"
  on public.page_blocks for all
  using (public.is_owner_of_business(business_id));

create policy "Anyone can view blocks of published businesses"
  on public.page_blocks for select
  using (public.is_business_published(business_id));

-- ================================================================
-- MENU CATEGORIES
-- ================================================================
drop policy if exists "Owners can manage menu categories" on public.menu_categories;
drop policy if exists "Anyone can view menu categories of published businesses" on public.menu_categories;

create policy "Owners can manage menu categories"
  on public.menu_categories for all
  using (public.is_owner_of_business(business_id));

create policy "Anyone can view menu categories of published businesses"
  on public.menu_categories for select
  using (public.is_business_published(business_id));

-- ================================================================
-- MENU ITEMS
-- ================================================================
drop policy if exists "Owners can manage menu items" on public.menu_items;
drop policy if exists "Anyone can view menu items of published businesses" on public.menu_items;

create policy "Owners can manage menu items"
  on public.menu_items for all
  using (public.is_owner_of_business(business_id));

create policy "Anyone can view menu items of published businesses"
  on public.menu_items for select
  using (public.is_business_published(business_id));

-- ================================================================
-- VARIANT GROUPS (no direct business_id, go through menu_items)
-- ================================================================
drop policy if exists "Owners can manage variant groups" on public.menu_item_variant_groups;
drop policy if exists "Anyone can view variant groups of published businesses" on public.menu_item_variant_groups;

create policy "Owners can manage variant groups"
  on public.menu_item_variant_groups for all
  using (
    exists (
      select 1 from public.menu_items mi
      where mi.id = item_id
        and public.is_owner_of_business(mi.business_id)
    )
  );

create policy "Anyone can view variant groups of published businesses"
  on public.menu_item_variant_groups for select
  using (
    exists (
      select 1 from public.menu_items mi
      where mi.id = item_id
        and public.is_business_published(mi.business_id)
    )
  );

-- ================================================================
-- VARIANT OPTIONS
-- ================================================================
drop policy if exists "Owners can manage variant options" on public.menu_item_variant_options;
drop policy if exists "Anyone can view variant options of published businesses" on public.menu_item_variant_options;

create policy "Owners can manage variant options"
  on public.menu_item_variant_options for all
  using (
    exists (
      select 1
      from public.menu_item_variant_groups vg
      join public.menu_items mi on mi.id = vg.item_id
      where vg.id = group_id
        and public.is_owner_of_business(mi.business_id)
    )
  );

create policy "Anyone can view variant options of published businesses"
  on public.menu_item_variant_options for select
  using (
    exists (
      select 1
      from public.menu_item_variant_groups vg
      join public.menu_items mi on mi.id = vg.item_id
      where vg.id = group_id
        and public.is_business_published(mi.business_id)
    )
  );

-- ================================================================
-- PAYMENT SETTINGS
-- ================================================================
drop policy if exists "Owners can manage payment settings" on public.payment_settings;
drop policy if exists "Anyone can view payment settings of published businesses" on public.payment_settings;

create policy "Owners can manage payment settings"
  on public.payment_settings for all
  using (public.is_owner_of_business(business_id));

create policy "Anyone can view payment settings of published businesses"
  on public.payment_settings for select
  using (public.is_business_published(business_id));

-- ================================================================
-- QR CODES
-- ================================================================
drop policy if exists "Owners can manage QR codes" on public.qr_codes;

create policy "Owners can manage QR codes"
  on public.qr_codes for all
  using (public.is_owner_of_business(business_id));

-- ================================================================
-- PRINT MENUS
-- ================================================================
drop policy if exists "Owners can manage print menus" on public.print_menus;

create policy "Owners can manage print menus"
  on public.print_menus for all
  using (public.is_owner_of_business(business_id));
