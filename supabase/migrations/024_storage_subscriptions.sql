-- 024_storage_subscriptions.sql

CREATE TABLE public.storage_subscriptions (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    current_quota_mb INTEGER NOT NULL DEFAULT 20 CHECK (current_quota_mb >= 20),
    next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.storage_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business storage subscription"
    ON public.storage_subscriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = storage_subscriptions.business_id
        AND bm.user_id = auth.uid()
    ));

-- Only super admin (Service Role) can manage subscriptions
CREATE POLICY "Service Role can manage storage subscriptions"
    ON public.storage_subscriptions USING (true);

-- Trigger to auto-create 30-day billing cycle for new businesses
CREATE OR REPLACE FUNCTION public.create_default_storage_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.storage_subscriptions (business_id, next_billing_date)
    VALUES (NEW.id, NOW() + INTERVAL '30 days');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_created_storage
    AFTER INSERT ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.create_default_storage_subscription();

-- Backfill existing businesses
INSERT INTO public.storage_subscriptions (business_id, next_billing_date)
SELECT id, NOW() + INTERVAL '30 days' FROM public.businesses
WHERE id NOT IN (SELECT business_id FROM public.storage_subscriptions);
