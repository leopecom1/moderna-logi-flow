-- Add use_automatic_pricing field to products table
ALTER TABLE public.products 
ADD COLUMN use_automatic_pricing boolean NOT NULL DEFAULT true;