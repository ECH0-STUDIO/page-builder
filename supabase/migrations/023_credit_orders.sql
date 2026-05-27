-- 023_credit_orders.sql

CREATE TABLE public.credit_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount_credits INTEGER NOT NULL,
    price_vnd INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
    order_code BIGINT NOT NULL UNIQUE, -- PayOS requires numeric order code < 9007199254740991
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.credit_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business orders"
    ON public.credit_orders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.business_members bm
        WHERE bm.business_id = credit_orders.business_id
        AND bm.user_id = auth.uid()
    ));

-- Only super admin (Service Role) can manage orders
CREATE POLICY "Service Role can manage orders"
    ON public.credit_orders USING (true);
