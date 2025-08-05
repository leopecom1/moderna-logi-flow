-- Create locations table for managing branches/stores
CREATE TABLE public.locations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    city TEXT DEFAULT 'Santa Fe',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table for product catalog
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    cost NUMERIC NOT NULL,
    margin_percentage NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN cost > 0 THEN ((price - cost) / cost * 100)
            ELSE 0
        END
    ) STORED,
    category TEXT,
    brand TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table for detailed sales tracking
CREATE TABLE public.sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    location_id UUID REFERENCES public.locations(id),
    seller_id UUID NOT NULL,
    sale_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    unit_cost NUMERIC NOT NULL,
    margin_percentage NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN unit_cost > 0 THEN ((unit_price - unit_cost) / unit_cost * 100)
            ELSE 0
        END
    ) STORED,
    total_amount NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
    total_cost NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    total_profit NUMERIC GENERATED ALWAYS AS (quantity * (unit_price - unit_cost)) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations
CREATE POLICY "Authenticated users can view locations" 
ON public.locations 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia can manage locations" 
ON public.locations 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage products" 
ON public.products 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- RLS Policies for sales
CREATE POLICY "Users can view sales based on role" 
ON public.sales 
FOR SELECT 
USING (
    CASE get_user_role(auth.uid())
        WHEN 'gerencia'::user_role THEN true
        WHEN 'vendedor'::user_role THEN seller_id = auth.uid()
        ELSE false
    END
);

CREATE POLICY "Vendedores and gerencia can create sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

CREATE POLICY "Vendedores can update their sales" 
ON public.sales 
FOR UPDATE 
USING (
    (seller_id = auth.uid()) OR 
    (get_user_role(auth.uid()) = 'gerencia'::user_role)
);

CREATE POLICY "Gerencia can delete sales" 
ON public.sales 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default locations
INSERT INTO public.locations (name, address, city) VALUES 
('Libertad', 'Sucursal Libertad', 'Santa Fe'),
('Central', 'Sucursal Central', 'Santa Fe');

-- Add indexes for better performance
CREATE INDEX idx_products_code ON public.products(code);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_product_id ON public.sales(product_id);
CREATE INDEX idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_location_id ON public.sales(location_id);