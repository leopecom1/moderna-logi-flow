-- Create product variant types table (color, size, etc.)
CREATE TABLE public.product_variant_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Create product variant values table (red, blue, S, M, L, etc.)
CREATE TABLE public.product_variant_values (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_type_id uuid NOT NULL REFERENCES public.product_variant_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(variant_type_id, name)
);

-- Create product variants table (specific combinations)
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_values jsonb NOT NULL DEFAULT '{}', -- {variant_type_id: variant_value_id}
  sku text,
  price_adjustment numeric DEFAULT 0, -- adjustment to base product price
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add has_variants field to products table
ALTER TABLE public.products 
ADD COLUMN has_variants boolean NOT NULL DEFAULT false;

-- Add variant_id to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- Add variant_id to inventory_movements table
ALTER TABLE public.inventory_movements 
ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- Add variant_id to purchase_items table
ALTER TABLE public.purchase_items 
ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.product_variant_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for variant types
CREATE POLICY "Authenticated users can view variant types"
ON public.product_variant_types
FOR SELECT
USING (true);

CREATE POLICY "Gerencia and vendedores can manage variant types"
ON public.product_variant_types
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Create RLS policies for variant values
CREATE POLICY "Authenticated users can view variant values"
ON public.product_variant_values
FOR SELECT
USING (true);

CREATE POLICY "Gerencia and vendedores can manage variant values"
ON public.product_variant_values
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Create RLS policies for product variants
CREATE POLICY "Authenticated users can view product variants"
ON public.product_variants
FOR SELECT
USING (true);

CREATE POLICY "Gerencia and vendedores can manage product variants"
ON public.product_variants
FOR ALL
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Create indexes for better performance
CREATE INDEX idx_product_variant_values_type_id ON public.product_variant_values(variant_type_id);
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_inventory_items_variant_id ON public.inventory_items(variant_id);
CREATE INDEX idx_inventory_movements_variant_id ON public.inventory_movements(variant_id);
CREATE INDEX idx_purchase_items_variant_id ON public.purchase_items(variant_id);

-- Create triggers for updated_at
CREATE TRIGGER update_product_variant_types_updated_at
BEFORE UPDATE ON public.product_variant_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variant_values_updated_at
BEFORE UPDATE ON public.product_variant_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();