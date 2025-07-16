-- Add new fields to customers table
ALTER TABLE public.customers 
ADD COLUMN cedula_identidad text,
ADD COLUMN margen numeric;