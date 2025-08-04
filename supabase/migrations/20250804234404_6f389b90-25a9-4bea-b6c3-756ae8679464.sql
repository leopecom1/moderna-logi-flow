-- Add customer reference number to customers table
ALTER TABLE public.customers 
ADD COLUMN customer_number TEXT;