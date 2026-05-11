-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security — every user sees only their own data
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.theme_settings enable row level security;
alter table public.publishing_settings enable row level security;
alter table public.page_blocks enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_variant_groups enable row level security;
alter table public.menu_item_variant_options enable row level security;
alter table public.payment_settings enable row level security;
alter table public.qr_codes enable row level security;
alter table public.print_menus enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- BUSINESSES
-- ============================================================
create policy "Owners can manage their businesses"
  on public.businesses for all
  using (auth.uid() = owner_id);

-- Public read for published marketplace businesses (used by directory + live page)
create policy "Anyone can view published marketplace businesses"
  on public.businesses for select
  using (
    exists (
      select 1 from public.publishing_settings ps
      where ps.business_id = businesses.id
        and ps.published = true
    )
  );

-- ============================================================
-- THEME SETTINGS
-- (owner via businesses join)
-- ============================================================
create policy "Owners can manage theme settings"
  on public.theme_settings for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = theme_settings.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view theme settings of published businesses"
  on public.theme_settings for select
  using (
    exists (
      select 1 from public.businesses b
      join public.publishing_settings ps on ps.business_id = b.id
      where b.id = theme_settings.business_id
        and ps.published = true
    )
  );

-- ============================================================
-- PUBLISHING SETTINGS
-- ============================================================
create policy "Owners can manage publishing settings"
  on public.publishing_settings for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = publishing_settings.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view publishing settings"
  on public.publishing_settings for select
  using (true); -- needed to check published status

-- ============================================================
-- PAGE BLOCKS
-- ============================================================
create policy "Owners can manage page blocks"
  on public.page_blocks for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = page_blocks.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view blocks of published businesses"
  on public.page_blocks for select
  using (
    exists (
      select 1 from public.businesses b
      join public.publishing_settings ps on ps.business_id = b.id
      where b.id = page_blocks.business_id
        and ps.published = true
    )
  );

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
create policy "Owners can manage menu categories"
  on public.menu_categories for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = menu_categories.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view menu categories of published businesses"
  on public.menu_categories for select
  using (
    exists (
      select 1 from public.businesses b
      join public.publishing_settings ps on ps.business_id = b.id
      where b.id = menu_categories.business_id
        and ps.published = true
    )
  );

-- ============================================================
-- MENU ITEMS
-- ============================================================
create policy "Owners can manage menu items"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = menu_items.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view menu items of published businesses"
  on public.menu_items for select
  using (
    exists (
      select 1 from public.businesses b
      join public.publishing_settings ps on ps.business_id = b.id
      where b.id = menu_items.business_id
        and ps.published = true
    )
  );

-- ============================================================
-- VARIANT GROUPS & OPTIONS (owned via items)
-- ============================================================
create policy "Owners can manage variant groups"
  on public.menu_item_variant_groups for all
  using (
    exists (
      select 1 from public.menu_items mi
      join public.businesses b on b.id = mi.business_id
      where mi.id = menu_item_variant_groups.item_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view variant groups of published businesses"
  on public.menu_item_variant_groups for select
  using (
    exists (
      select 1 from public.menu_items mi
      join public.businesses b on b.id = mi.business_id
      join public.publishing_settings ps on ps.business_id = b.id
      where mi.id = menu_item_variant_groups.item_id
        and ps.published = true
    )
  );

create policy "Owners can manage variant options"
  on public.menu_item_variant_options for all
  using (
    exists (
      select 1 from public.menu_item_variant_groups vg
      join public.menu_items mi on mi.id = vg.item_id
      join public.businesses b on b.id = mi.business_id
      where vg.id = menu_item_variant_options.group_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view variant options of published businesses"
  on public.menu_item_variant_options for select
  using (
    exists (
      select 1 from public.menu_item_variant_groups vg
      join public.menu_items mi on mi.id = vg.item_id
      join public.businesses b on b.id = mi.business_id
      join public.publishing_settings ps on ps.business_id = b.id
      where vg.id = menu_item_variant_options.group_id
        and ps.published = true
    )
  );

-- ============================================================
-- PAYMENT SETTINGS
-- ============================================================
create policy "Owners can manage payment settings"
  on public.payment_settings for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = payment_settings.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Anyone can view payment settings of published businesses"
  on public.payment_settings for select
  using (
    exists (
      select 1 from public.businesses b
      join public.publishing_settings ps on ps.business_id = b.id
      where b.id = payment_settings.business_id
        and ps.published = true
    )
  );

-- ============================================================
-- QR CODES
-- ============================================================
create policy "Owners can manage QR codes"
  on public.qr_codes for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = qr_codes.business_id
        and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- PRINT MENUS
-- ============================================================
create policy "Owners can manage print menus"
  on public.print_menus for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = print_menus.business_id
        and b.owner_id = auth.uid()
    )
  );
