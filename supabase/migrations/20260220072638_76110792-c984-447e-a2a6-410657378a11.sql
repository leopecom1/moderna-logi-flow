ALTER TABLE public.products 
ADD COLUMN woocommerce_status text DEFAULT 'publish' 
CHECK (woocommerce_status IN ('publish', 'draft', 'pending', 'private'));