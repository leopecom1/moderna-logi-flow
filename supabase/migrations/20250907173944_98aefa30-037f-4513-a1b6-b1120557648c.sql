-- Add foreign key constraints that were missing
ALTER TABLE public.credit_moderna_installments 
ADD CONSTRAINT fk_credit_moderna_customer 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.credit_moderna_installments 
ADD CONSTRAINT fk_credit_moderna_payment 
FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;

ALTER TABLE public.credit_moderna_installments 
ADD CONSTRAINT fk_credit_moderna_order 
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.credit_moderna_installments 
ADD CONSTRAINT fk_credit_moderna_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;