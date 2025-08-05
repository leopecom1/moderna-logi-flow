-- Create collections table for detailed payment tracking
CREATE TABLE public.collections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sale_id UUID REFERENCES public.sales(id),
    order_id UUID REFERENCES public.orders(id),
    collector_id UUID NOT NULL, -- who registered the collection
    collection_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method_type TEXT NOT NULL CHECK (payment_method_type IN (
        'efectivo', 'transferencia', 'mercado_pago', 'tarjeta_credito', 
        'tarjeta_debito', 'cheque', 'otros'
    )),
    payment_reference TEXT, -- reference number, transaction ID, etc.
    bank_name TEXT,
    account_info TEXT,
    collection_status TEXT NOT NULL DEFAULT 'confirmado' CHECK (collection_status IN (
        'pendiente', 'confirmado', 'rechazado', 'reversado'
    )),
    notes TEXT,
    receipt_number TEXT,
    collection_time TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accounts receivable summary table
CREATE TABLE public.accounts_receivable (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    total_sales NUMERIC NOT NULL DEFAULT 0,
    total_collections NUMERIC NOT NULL DEFAULT 0,
    balance_due NUMERIC GENERATED ALWAYS AS (total_sales - total_collections) STORED,
    last_sale_date DATE,
    last_collection_date DATE,
    days_since_last_sale INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN last_sale_date IS NOT NULL THEN 
                DATE_PART('day', NOW() - last_sale_date)::INTEGER
            ELSE NULL
        END
    ) STORED,
    credit_limit NUMERIC DEFAULT 0,
    credit_status TEXT DEFAULT 'normal' CHECK (credit_status IN (
        'normal', 'warning', 'blocked', 'suspended'
    )),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Users can view collections based on role" 
ON public.collections 
FOR SELECT 
USING (
    CASE get_user_role(auth.uid())
        WHEN 'gerencia'::user_role THEN true
        WHEN 'vendedor'::user_role THEN true
        WHEN 'cadete'::user_role THEN collector_id = auth.uid()
        ELSE false
    END
);

CREATE POLICY "Vendedores and gerencia can create collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

CREATE POLICY "Collectors can update their collections" 
ON public.collections 
FOR UPDATE 
USING (
    (collector_id = auth.uid()) OR 
    (get_user_role(auth.uid()) = 'gerencia'::user_role)
);

CREATE POLICY "Gerencia can delete collections" 
ON public.collections 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for accounts_receivable
CREATE POLICY "Users can view AR based on role" 
ON public.accounts_receivable 
FOR SELECT 
USING (
    CASE get_user_role(auth.uid())
        WHEN 'gerencia'::user_role THEN true
        WHEN 'vendedor'::user_role THEN true
        ELSE false
    END
);

CREATE POLICY "Gerencia can manage AR" 
ON public.accounts_receivable 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_receivable_updated_at
    BEFORE UPDATE ON public.accounts_receivable
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update accounts receivable
CREATE OR REPLACE FUNCTION public.update_accounts_receivable()
RETURNS TRIGGER AS $$
DECLARE
    customer_uuid UUID;
    total_sales_amount NUMERIC;
    total_collections_amount NUMERIC;
    last_sale DATE;
    last_collection DATE;
BEGIN
    -- Get customer_id from the affected record
    IF TG_TABLE_NAME = 'sales' THEN
        customer_uuid := COALESCE(NEW.customer_id, OLD.customer_id);
    ELSIF TG_TABLE_NAME = 'collections' THEN
        customer_uuid := COALESCE(NEW.customer_id, OLD.customer_id);
    END IF;

    -- Calculate totals for this customer
    SELECT 
        COALESCE(SUM(total_amount), 0),
        MAX(sale_date)
    INTO total_sales_amount, last_sale
    FROM public.sales 
    WHERE customer_id = customer_uuid;

    SELECT 
        COALESCE(SUM(amount), 0),
        MAX(collection_date)
    INTO total_collections_amount, last_collection
    FROM public.collections 
    WHERE customer_id = customer_uuid 
    AND collection_status = 'confirmado';

    -- Upsert accounts receivable record
    INSERT INTO public.accounts_receivable (
        customer_id, total_sales, total_collections, 
        last_sale_date, last_collection_date
    ) VALUES (
        customer_uuid, total_sales_amount, total_collections_amount,
        last_sale, last_collection
    )
    ON CONFLICT (customer_id) 
    DO UPDATE SET
        total_sales = EXCLUDED.total_sales,
        total_collections = EXCLUDED.total_collections,
        last_sale_date = EXCLUDED.last_sale_date,
        last_collection_date = EXCLUDED.last_collection_date,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update accounts receivable
CREATE TRIGGER update_ar_on_sales_change
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_accounts_receivable();

CREATE TRIGGER update_ar_on_collections_change
    AFTER INSERT OR UPDATE OR DELETE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_accounts_receivable();

-- Add unique constraint to accounts_receivable
ALTER TABLE public.accounts_receivable 
ADD CONSTRAINT unique_customer_ar UNIQUE (customer_id);

-- Add indexes for better performance
CREATE INDEX idx_collections_customer_id ON public.collections(customer_id);
CREATE INDEX idx_collections_sale_id ON public.collections(sale_id);
CREATE INDEX idx_collections_order_id ON public.collections(order_id);
CREATE INDEX idx_collections_collector_id ON public.collections(collector_id);
CREATE INDEX idx_collections_date ON public.collections(collection_date);
CREATE INDEX idx_collections_status ON public.collections(collection_status);
CREATE INDEX idx_collections_payment_method ON public.collections(payment_method_type);

CREATE INDEX idx_ar_customer_id ON public.accounts_receivable(customer_id);
CREATE INDEX idx_ar_balance_due ON public.accounts_receivable(balance_due);
CREATE INDEX idx_ar_credit_status ON public.accounts_receivable(credit_status);