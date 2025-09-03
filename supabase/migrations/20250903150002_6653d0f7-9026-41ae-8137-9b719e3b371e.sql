-- Eliminar el constraint existente
ALTER TABLE public.inventory_movements DROP CONSTRAINT inventory_movements_movement_type_check;

-- Agregar el nuevo constraint que incluye 'movimiento_interno'
ALTER TABLE public.inventory_movements 
ADD CONSTRAINT inventory_movements_movement_type_check 
CHECK (movement_type = ANY (ARRAY['entrada'::text, 'salida'::text, 'transferencia'::text, 'ajuste'::text, 'movimiento_interno'::text]));