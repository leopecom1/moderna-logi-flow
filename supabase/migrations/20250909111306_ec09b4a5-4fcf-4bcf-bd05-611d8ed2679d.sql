-- Add field to mark installments as unified
ALTER TABLE public.credit_moderna_installments 
ADD COLUMN unified_installment_id uuid REFERENCES public.credit_moderna_installments(id),
ADD COLUMN is_unified_source boolean DEFAULT false;