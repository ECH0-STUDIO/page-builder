-- 021_rbac_policies.sql
-- Enforce RBAC for staff members. 
-- Staff should NOT be able to modify menus, categories, or page builder data.

-- We assume business_members maps user_id -> business_id with a 'role' column.

-- Menu Categories
DROP POLICY IF EXISTS "Business members can update categories" ON menu_categories;
CREATE POLICY "Business members can update categories"
    ON menu_categories FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = menu_categories.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'manager')
    ));

DROP POLICY IF EXISTS "Business members can delete categories" ON menu_categories;
CREATE POLICY "Business members can delete categories"
    ON menu_categories FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = menu_categories.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'manager')
    ));

DROP POLICY IF EXISTS "Business members can insert categories" ON menu_categories;
CREATE POLICY "Business members can insert categories"
    ON menu_categories FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = menu_categories.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'manager')
    ));


-- Menu Items
DROP POLICY IF EXISTS "Business members can update items" ON menu_items;
CREATE POLICY "Business members can update items"
    ON menu_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = menu_items.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'manager')
    ));

DROP POLICY IF EXISTS "Business members can delete items" ON menu_items;
CREATE POLICY "Business members can delete items"
    ON menu_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = menu_items.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'manager')
    ));

DROP POLICY IF EXISTS "Business members can insert items" ON menu_items;
CREATE POLICY "Business members can insert items"
    ON menu_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = menu_items.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'manager')
    ));

-- Page Data
DROP POLICY IF EXISTS "Business members can update page data" ON business_pages;
CREATE POLICY "Business members can update page data"
    ON business_pages FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = business_pages.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'manager')
    ));
