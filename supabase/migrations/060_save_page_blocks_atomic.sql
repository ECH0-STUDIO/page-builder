-- ============================================================
-- 060_save_page_blocks_atomic.sql
-- Make saving the page builder atomic.
--
-- savePageBlocksAction deletes every page_blocks row for the business and then
-- inserts the new set. Those are two separate requests, so a failure or a
-- dropped connection between them leaves the store with no blocks at all —
-- the customer's entire landing page, gone, with no undo.
--
-- A plpgsql function runs as a single statement from the client, so the delete
-- and the insert commit or roll back together. SECURITY INVOKER (the default)
-- keeps the existing RLS policies in force: the caller must already be allowed
-- to write page_blocks for this business.
-- ============================================================

CREATE OR REPLACE FUNCTION public.save_page_blocks(
  p_business_id uuid,
  p_blocks jsonb
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.page_blocks WHERE business_id = p_business_id;

  IF jsonb_array_length(COALESCE(p_blocks, '[]'::jsonb)) > 0 THEN
    INSERT INTO public.page_blocks (
      id, business_id, type, sort_order, visible, config, spacing, custom_css, block_anchor_id
    )
    SELECT
      COALESCE((b->>'id')::uuid, gen_random_uuid()),
      p_business_id,
      b->>'type',
      (b->>'sort_order')::integer,
      COALESCE((b->>'visible')::boolean, true),
      COALESCE(b->'config', '{}'::jsonb),
      COALESCE(b->'spacing', '{}'::jsonb),
      COALESCE(b->>'custom_css', ''),
      NULLIF(b->>'block_anchor_id', '')
    FROM jsonb_array_elements(p_blocks) AS b;
  END IF;

  INSERT INTO public.publishing_settings (business_id, has_unpublished_changes)
  VALUES (p_business_id, true)
  ON CONFLICT (business_id) DO UPDATE
  SET has_unpublished_changes = true;
END;
$$;

REVOKE ALL ON FUNCTION public.save_page_blocks(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_page_blocks(uuid, jsonb) TO authenticated, service_role;
