-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT DEFAULT 'Montevideo',
  country TEXT DEFAULT 'Uruguay',
  tax_id TEXT,
  payment_terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Authenticated users can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage suppliers" 
ON public.suppliers 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

CREATE POLICY "Gerencia can delete suppliers" 
ON public.suppliers 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  purchase_number TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  is_import BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'UYU',
  exchange_rate NUMERIC DEFAULT 1,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for purchases
CREATE POLICY "Authenticated users can view purchases" 
ON public.purchases 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage purchases" 
ON public.purchases 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Create purchase items table
CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase items
CREATE POLICY "Authenticated users can view purchase items" 
ON public.purchase_items 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage purchase items" 
ON public.purchase_items 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Create trigger for updating timestamps
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();