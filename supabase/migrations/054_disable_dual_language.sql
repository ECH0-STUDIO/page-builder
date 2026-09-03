-- Revert product to single primary locale editing (Translation UI model).
-- Keep dual_language columns for future paid-locale entitlements; force feature off.
UPDATE public.publishing_settings
SET dual_language_enabled = false,
    dual_language_setup_status = 'idle'
WHERE dual_language_enabled = true;
