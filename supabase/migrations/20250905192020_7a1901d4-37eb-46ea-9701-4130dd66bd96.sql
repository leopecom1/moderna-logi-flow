-- Add status column to inventory_movements table
ALTER TABLE public.inventory_movements 
ADD COLUMN status TEXT DEFAULT 'pendiente';

-- Add check constraint for valid status values
ALTER TABLE public.inventory_movements 
ADD CONSTRAINT inventory_movements_status_check 
CHECK (status IN ('pendiente', 'en_transito', 'entregado', 'completado'));