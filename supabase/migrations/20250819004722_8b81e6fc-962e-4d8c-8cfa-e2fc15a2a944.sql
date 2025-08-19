-- Add foreign key constraints to supplier_payments table
ALTER TABLE public.supplier_payments 
ADD CONSTRAINT fk_supplier_payments_purchase 
FOREIGN KEY (purchase_id) REFERENCES public.purchases(id);

ALTER TABLE public.supplier_payments 
ADD CONSTRAINT fk_supplier_payments_supplier 
FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

ALTER TABLE public.supplier_payments 
ADD CONSTRAINT fk_supplier_payments_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);