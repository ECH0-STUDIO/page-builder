-- ============================================================
-- 018_team_rls_policies.sql
-- Update Row Level Security so team members can access data
-- ============================================================

-- Function to check if a user is a member of a business
create or replace function public.is_business_member(b_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.business_members
    where business_id = b_id
    and user_id = auth.uid()
  );
$$;

-- BUSINESSES
drop policy if exists "Owners can manage their businesses" on public.businesses;
create policy "Owners and members can manage their businesses"
  on public.businesses for all
  using (
    auth.uid() = owner_id or
    public.is_business_member(id)
  );

-- THEME SETTINGS
drop policy if exists "Owners can manage theme settings" on public.theme_settings;
create policy "Owners and members can manage theme settings"
  on public.theme_settings for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = theme_settings.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- PUBLISHING SETTINGS
drop policy if exists "Owners can manage publishing settings" on public.publishing_settings;
create policy "Owners and members can manage publishing settings"
  on public.publishing_settings for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = publishing_settings.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- PAGE BLOCKS
drop policy if exists "Owners can manage page blocks" on public.page_blocks;
create policy "Owners and members can manage page blocks"
  on public.page_blocks for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = page_blocks.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- MENU CATEGORIES
drop policy if exists "Owners can manage menu categories" on public.menu_categories;
create policy "Owners and members can manage menu categories"
  on public.menu_categories for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = menu_categories.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- MENU ITEMS
drop policy if exists "Owners can manage menu items" on public.menu_items;
create policy "Owners and members can manage menu items"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = menu_items.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- VARIANT GROUPS
drop policy if exists "Owners can manage variant groups" on public.menu_item_variant_groups;
create policy "Owners and members can manage variant groups"
  on public.menu_item_variant_groups for all
  using (
    exists (
      select 1 from public.menu_items mi
      join public.businesses b on b.id = mi.business_id
      where mi.id = menu_item_variant_groups.item_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- VARIANT OPTIONS
drop policy if exists "Owners can manage variant options" on public.menu_item_variant_options;
create policy "Owners and members can manage variant options"
  on public.menu_item_variant_options for all
  using (
    exists (
      select 1 from public.menu_item_variant_groups vg
      join public.menu_items mi on mi.id = vg.item_id
      join public.businesses b on b.id = mi.business_id
      where vg.id = menu_item_variant_options.group_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- PAYMENT SETTINGS
drop policy if exists "Owners can manage payment settings" on public.payment_settings;
create policy "Owners and members can manage payment settings"
  on public.payment_settings for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = payment_settings.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- QR CODES
drop policy if exists "Owners can manage QR codes" on public.qr_codes;
create policy "Owners and members can manage QR codes"
  on public.qr_codes for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = qr_codes.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- PRINT MENUS
drop policy if exists "Owners can manage print menus" on public.print_menus;
create policy "Owners and members can manage print menus"
  on public.print_menus for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = print_menus.business_id
        and (b.owner_id = auth.uid() or public.is_business_member(b.id))
    )
  );

-- TEAM INVITATIONS (Allow members to view, but only owners/managers can insert/delete - we'll handle this in the app layer for now to keep it simple, just allow members to read their team's invites)
drop policy if exists "Business owners can view invitations" on public.team_invitations;
create policy "Owners and members can view invitations"
on public.team_invitations for select
using (
    exists (
        select 1 from public.businesses
        where id = team_invitations.business_id
        and (owner_id = auth.uid() or public.is_business_member(id))
    )
);

