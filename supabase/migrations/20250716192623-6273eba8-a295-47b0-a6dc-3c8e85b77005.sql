-- Create table for customer movements
CREATE TABLE public.customer_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  movement_date DATE NOT NULL,
  delivery_info TEXT,
  balance_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view movements based on role" 
ON public.customer_movements 
FOR SELECT 
USING (
  CASE get_user_role(auth.uid())
    WHEN 'gerencia'::user_role THEN true
    WHEN 'vendedor'::user_role THEN true
    ELSE false
  END
);

CREATE POLICY "Gerencia and vendedores can manage movements" 
ON public.customer_movements 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_customer_movements_updated_at
BEFORE UPDATE ON public.customer_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();