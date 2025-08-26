-- Create card_liquidations table for tracking credit card liquidations
CREATE TABLE public.card_liquidations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL,
  card_type TEXT NOT NULL,
  liquidation_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, confirmado, no_llegó
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID,
  expected_arrival_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add liquidation_date to payments table for credit card payments
ALTER TABLE public.payments 
ADD COLUMN liquidation_date DATE,
ADD COLUMN card_type TEXT;

-- Enable RLS
ALTER TABLE public.card_liquidations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view card liquidations"
ON public.card_liquidations
FOR SELECT
USING (true);

CREATE POLICY "Gerencia and vendedores can manage card liquidations"
ON public.card_liquidations
FOR ALL
USING (get_user_role(auth.uid()) = ANY(ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_card_liquidations_updated_at
BEFORE UPDATE ON public.card_liquidations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();