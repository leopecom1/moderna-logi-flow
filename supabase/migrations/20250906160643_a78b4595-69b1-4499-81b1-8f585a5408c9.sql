-- Create table for currency exchange rates
CREATE TABLE public.currency_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code TEXT NOT NULL,
  currency_name TEXT NOT NULL,
  buy_rate NUMERIC NOT NULL DEFAULT 0,
  sell_rate NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for currency codes
CREATE UNIQUE INDEX currency_rates_currency_code_idx ON public.currency_rates(currency_code);

-- Enable RLS
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view currency rates" 
ON public.currency_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia can manage currency rates" 
ON public.currency_rates 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Insert initial USD rate
INSERT INTO public.currency_rates (currency_code, currency_name, buy_rate, sell_rate) 
VALUES ('USD', 'Dólar Estadounidense', 40, 42);

-- Create function to update timestamps
CREATE TRIGGER update_currency_rates_updated_at
BEFORE UPDATE ON public.currency_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();