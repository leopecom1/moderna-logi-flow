-- Agregar campo departamento a la tabla customers
ALTER TABLE public.customers 
ADD COLUMN departamento text;

-- Agregar departamento a la tabla orders para delivery
ALTER TABLE public.orders 
ADD COLUMN delivery_departamento text;