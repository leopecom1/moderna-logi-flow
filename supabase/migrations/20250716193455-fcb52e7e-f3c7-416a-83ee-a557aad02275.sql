-- Rename delivery_info column to payment_info for better clarity
ALTER TABLE public.customer_movements 
RENAME COLUMN delivery_info TO payment_info;