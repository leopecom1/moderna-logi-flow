-- Add payment terms fields to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN default_payment_days INTEGER DEFAULT 30,
ADD COLUMN default_payment_method TEXT DEFAULT 'efectivo';

-- Add payment information to purchases table
ALTER TABLE public.purchases 
ADD COLUMN payment_days INTEGER DEFAULT 30,
ADD COLUMN payment_method TEXT DEFAULT 'efectivo',
ADD COLUMN is_check_payment BOOLEAN DEFAULT false,
ADD COLUMN custom_payment_terms BOOLEAN DEFAULT false;