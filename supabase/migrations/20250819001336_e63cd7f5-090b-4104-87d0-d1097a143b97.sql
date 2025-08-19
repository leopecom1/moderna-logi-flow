-- Add foreign key constraint for purchases table
ALTER TABLE public.purchases 
ADD CONSTRAINT purchases_supplier_id_fkey 
FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);