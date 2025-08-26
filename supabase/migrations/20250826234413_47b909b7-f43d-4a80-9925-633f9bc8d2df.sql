-- Add warranty and supplier code columns to products table
ALTER TABLE public.products 
ADD COLUMN warranty_years INTEGER,
ADD COLUMN warranty_months INTEGER,
ADD COLUMN supplier_code TEXT;