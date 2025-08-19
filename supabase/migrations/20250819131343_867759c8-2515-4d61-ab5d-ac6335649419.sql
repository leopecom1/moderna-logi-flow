
-- 1) Eliminar cualquier trigger en inventory_items que intente setear updated_at
DO $$
DECLARE 
  r record;
BEGIN
  FOR r IN
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'inventory_items'
      AND action_statement ILIKE '%update_updated_at_column%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.inventory_items;', r.trigger_name);
  END LOOP;
END $$;

-- 2) Estandarizar triggers en inventory_movements

-- Asegurar trigger de stock (AFTER INSERT OR UPDATE)
DROP TRIGGER IF EXISTS update_stock_after_movement ON public.inventory_movements;
CREATE TRIGGER update_stock_after_movement
AFTER INSERT OR UPDATE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_stock();

-- Asegurar trigger de updated_at SOLO en UPDATE (el INSERT ya usa DEFAULT now())
DROP TRIGGER IF EXISTS set_updated_at_inventory_movements ON public.inventory_movements;
CREATE TRIGGER set_updated_at_inventory_movements
BEFORE UPDATE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
