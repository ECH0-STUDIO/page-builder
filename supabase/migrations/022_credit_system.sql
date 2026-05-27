-- 022_credit_system.sql
-- Implement a credit system where businesses consume credits to use certain features

CREATE TABLE public.credit_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business credit balances"
    ON public.credit_balances FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = credit_balances.business_id
        AND bm.user_id = auth.uid()
    ));

-- Only super admin (Service Role) can update credit balances directly
CREATE POLICY "Service Role can manage credit balances"
    ON public.credit_balances USING (true);

-- Trigger to auto-create 20 default credits for new businesses
CREATE OR REPLACE FUNCTION public.create_default_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.credit_balances (business_id, balance)
    VALUES (NEW.id, 20);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_created
    AFTER INSERT ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.create_default_credits();

-- Grant 20 credits to existing businesses that don't have a balance yet
INSERT INTO public.credit_balances (business_id, balance)
SELECT id, 20 FROM public.businesses
WHERE id NOT IN (SELECT business_id FROM public.credit_balances);

-- Credit Transactions log
CREATE TABLE public.credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for recharge, negative for spend
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business credit transactions"
    ON public.credit_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = credit_transactions.business_id
        AND bm.user_id = auth.uid()
    ));

CREATE POLICY "Service Role can manage credit transactions"
    ON public.credit_transactions USING (true);
