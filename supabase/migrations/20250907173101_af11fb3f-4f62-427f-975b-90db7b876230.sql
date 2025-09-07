-- Create Crédito Moderna installments table
CREATE TABLE public.credit_moderna_installments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    payment_id UUID,
    order_id UUID,
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'vencido')),
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.credit_moderna_installments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view credit moderna installments"
ON public.credit_moderna_installments 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage credit moderna installments"
ON public.credit_moderna_installments 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_credit_moderna_installments_updated_at
BEFORE UPDATE ON public.credit_moderna_installments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_credit_moderna_customer_id ON public.credit_moderna_installments(customer_id);
CREATE INDEX idx_credit_moderna_status ON public.credit_moderna_installments(status);
CREATE INDEX idx_credit_moderna_due_date ON public.credit_moderna_installments(due_date);
CREATE INDEX idx_credit_moderna_payment_id ON public.credit_moderna_installments(payment_id);

-- Update payment_method enum to include credito_moderna
ALTER TYPE payment_method ADD VALUE 'credito_moderna';