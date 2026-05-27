-- ============================================================
-- 027_comprehensive_rbac.sql
-- Enforce strict Role-Based Access Control (RBAC) across all tables
-- ============================================================

-- 1. Create a helper function for checking roles
-- Returns true if the user is the explicit business owner, OR if they have one of the allowed roles in business_members.
CREATE OR REPLACE FUNCTION public.has_business_role(b_id uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = b_id AND b.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = b_id
    AND bm.user_id = auth.uid()
    AND bm.role = ANY(allowed_roles)
  );
$$;

-- Note: We assume the roles in business_members are 'owner', 'manager', 'staff'.

-- ============================================================
-- 2. DROP EXISTING POLICIES
-- Clean up all existing policies on these tables to avoid conflicts
-- ============================================================

-- We won't drop business_members select policy just yet as it relies on itself, but we'll overwrite it.
DROP POLICY IF EXISTS "Owners and members can manage their businesses" ON public.businesses;

DROP POLICY IF EXISTS "Users can read members of their business" ON public.business_members;

DROP POLICY IF EXISTS "Owners and members can view invitations" ON public.team_invitations;

DROP POLICY IF EXISTS "Owners and members can manage theme settings" ON public.theme_settings;
DROP POLICY IF EXISTS "Owners and members can manage publishing settings" ON public.publishing_settings;
DROP POLICY IF EXISTS "Owners and members can manage page blocks" ON public.page_blocks;

DROP POLICY IF EXISTS "Owners and members can manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Business members can update categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Business members can delete categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Business members can insert categories" ON public.menu_categories;

DROP POLICY IF EXISTS "Owners and members can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Business members can update items" ON public.menu_items;
DROP POLICY IF EXISTS "Business members can delete items" ON public.menu_items;
DROP POLICY IF EXISTS "Business members can insert items" ON public.menu_items;

DROP POLICY IF EXISTS "Owners and members can manage variant groups" ON public.menu_item_variant_groups;
DROP POLICY IF EXISTS "Owners and members can manage variant options" ON public.menu_item_variant_options;

DROP POLICY IF EXISTS "Owners and members can manage payment settings" ON public.payment_settings;

DROP POLICY IF EXISTS "Owners and members can manage QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Owners and members can manage print menus" ON public.print_menus;

DROP POLICY IF EXISTS "Owners and members can view page views" ON public.page_views;
DROP POLICY IF EXISTS "Owners and members can view storage subscriptions" ON public.storage_subscriptions;
DROP POLICY IF EXISTS "Owners and members can view credit balances" ON public.credit_balances;
DROP POLICY IF EXISTS "Owners and members can view credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Owners and members can view orders" ON public.credit_orders;

-- ============================================================
-- 3. CREATE STRICT NEW POLICIES
-- ============================================================

-- BUSINESSES (id instead of business_id)
-- Read: All (Owner, Manager, Staff)
CREATE POLICY "Team members can view their businesses" ON public.businesses FOR SELECT USING (public.has_business_role(id, ARRAY['owner', 'manager', 'staff']));
-- Update: Owner, Manager
CREATE POLICY "Owners and managers can update businesses" ON public.businesses FOR UPDATE USING (public.has_business_role(id, ARRAY['owner', 'manager']));
-- Delete: Owner Only
CREATE POLICY "Only owners can delete businesses" ON public.businesses FOR DELETE USING (public.has_business_role(id, ARRAY['owner']));

-- BUSINESS MEMBERS (Team)
-- Read: All
CREATE POLICY "Team members can view team" ON public.business_members FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
-- Insert: Owner can insert anyone, Manager can only insert 'staff'
CREATE POLICY "Owners and managers can insert team members" ON public.business_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid() AND bm.role = 'owner')
  OR (
    EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid() AND bm.role = 'manager')
    AND business_members.role = 'staff'
  )
);

-- Update: Owner can update anyone, Manager can only update 'staff'
CREATE POLICY "Owners and managers can update team members" ON public.business_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid() AND bm.role = 'owner')
  OR (
    EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid() AND bm.role = 'manager')
    AND business_members.role = 'staff'
  )
);

-- Delete: Owner can delete anyone, Manager can only delete 'staff'
CREATE POLICY "Owners and managers can delete team members" ON public.business_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid() AND bm.role = 'owner')
  OR (
    EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = business_members.business_id AND bm.user_id = auth.uid() AND bm.role = 'manager')
    AND business_members.role = 'staff'
  )
);

-- TEAM INVITATIONS
CREATE POLICY "Team members can view invitations" ON public.team_invitations FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

CREATE POLICY "Owners and managers can insert invitations" ON public.team_invitations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = team_invitations.business_id AND bm.user_id = auth.uid() AND bm.role = 'owner')
  OR (
    EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = team_invitations.business_id AND bm.user_id = auth.uid() AND bm.role = 'manager')
    AND team_invitations.role = 'staff'
  )
);

CREATE POLICY "Owners and managers can delete invitations" ON public.team_invitations FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = team_invitations.business_id AND bm.user_id = auth.uid() AND bm.role = 'owner')
  OR (
    EXISTS (SELECT 1 FROM public.business_members bm WHERE bm.business_id = team_invitations.business_id AND bm.user_id = auth.uid() AND bm.role = 'manager')
    AND team_invitations.role = 'staff'
  )
);

-- MENU SYSTEM (Categories, Items, Variant Groups, Variant Options)
-- Read: All
CREATE POLICY "Team members can view menu categories" ON public.menu_categories FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view menu items" ON public.menu_items FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view variant groups" ON public.menu_item_variant_groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.id = item_id AND public.has_business_role(mi.business_id, ARRAY['owner', 'manager', 'staff']))
);
CREATE POLICY "Team members can view variant options" ON public.menu_item_variant_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.menu_item_variant_groups vg JOIN public.menu_items mi ON mi.id = vg.item_id WHERE vg.id = group_id AND public.has_business_role(mi.business_id, ARRAY['owner', 'manager', 'staff']))
);

-- Write: Owner, Manager
CREATE POLICY "Owners and managers can insert categories" ON public.menu_categories FOR INSERT WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'manager']));
CREATE POLICY "Owners and managers can update categories" ON public.menu_categories FOR UPDATE USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));
CREATE POLICY "Owners and managers can delete categories" ON public.menu_categories FOR DELETE USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can insert items" ON public.menu_items FOR INSERT WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'manager']));
CREATE POLICY "Owners and managers can update items" ON public.menu_items FOR UPDATE USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));
CREATE POLICY "Owners and managers can delete items" ON public.menu_items FOR DELETE USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers can manage variant groups" ON public.menu_item_variant_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.id = item_id AND public.has_business_role(mi.business_id, ARRAY['owner', 'manager']))
);

CREATE POLICY "Owners and managers can manage variant options" ON public.menu_item_variant_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.menu_item_variant_groups vg JOIN public.menu_items mi ON mi.id = vg.item_id WHERE vg.id = group_id AND public.has_business_role(mi.business_id, ARRAY['owner', 'manager']))
);

-- PAGE BUILDER (Blocks, Theme, Publishing)
-- Read: All
CREATE POLICY "Team members can view page blocks" ON public.page_blocks FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view theme settings" ON public.theme_settings FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view publishing settings" ON public.publishing_settings FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

-- Write: Owner, Manager
CREATE POLICY "Owners and managers can manage page blocks" ON public.page_blocks FOR ALL USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));
CREATE POLICY "Owners and managers can manage theme settings" ON public.theme_settings FOR ALL USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));
CREATE POLICY "Owners and managers can manage publishing settings" ON public.publishing_settings FOR ALL USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));

-- SETTINGS & QR (QR Codes, Print Menus)
-- Read: All
CREATE POLICY "Team members can view QR codes" ON public.qr_codes FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view print menus" ON public.print_menus FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

-- Write: Owner, Manager
CREATE POLICY "Owners and managers can manage QR codes" ON public.qr_codes FOR ALL USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));
CREATE POLICY "Owners and managers can manage print menus" ON public.print_menus FOR ALL USING (public.has_business_role(business_id, ARRAY['owner', 'manager']));

-- PAYMENT SETTINGS (OWNER ONLY)
CREATE POLICY "Team members can view payment settings" ON public.payment_settings FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Only owners can manage payment settings" ON public.payment_settings FOR ALL USING (public.has_business_role(business_id, ARRAY['owner']));

-- ANALYTICS (PAGE VIEWS)
CREATE POLICY "Team members can view page views" ON public.page_views FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

-- BILLING & QUOTA (Credit Balances, Transactions, Orders, Storage)
-- Read: All
CREATE POLICY "Team members can view credit balances" ON public.credit_balances FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view credit transactions" ON public.credit_transactions FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view credit orders" ON public.credit_orders FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));
CREATE POLICY "Team members can view storage subscriptions" ON public.storage_subscriptions FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'manager', 'staff']));

-- Write Orders: Owner Only
CREATE POLICY "Only owners can insert credit orders" ON public.credit_orders FOR INSERT WITH CHECK (public.has_business_role(business_id, ARRAY['owner']));
