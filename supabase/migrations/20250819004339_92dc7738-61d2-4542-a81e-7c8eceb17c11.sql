-- Create supplier payments table
CREATE TABLE public.supplier_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  is_check BOOLEAN NOT NULL DEFAULT false,
  check_number TEXT,
  check_due_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'pendiente',
  paid_at TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  check_image_url TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view supplier payments" 
ON public.supplier_payments 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage supplier payments" 
ON public.supplier_payments 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_supplier_payments_updated_at
BEFORE UPDATE ON public.supplier_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();