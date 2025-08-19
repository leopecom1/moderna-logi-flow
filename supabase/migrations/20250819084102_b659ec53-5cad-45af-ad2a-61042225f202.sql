-- Fix the update_inventory_stock trigger to use correct field name
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update current stock based on movement type
    IF NEW.movement_type = 'entrada' THEN
        UPDATE public.inventory_items 
        SET current_stock = current_stock + NEW.quantity,
            last_updated = now()  -- Use last_updated instead of updated_at
        WHERE id = NEW.inventory_item_id;
    ELSIF NEW.movement_type = 'salida' THEN
        UPDATE public.inventory_items 
        SET current_stock = current_stock - NEW.quantity,
            last_updated = now()  -- Use last_updated instead of updated_at
        WHERE id = NEW.inventory_item_id;
    ELSIF NEW.movement_type = 'ajuste' THEN
        UPDATE public.inventory_items 
        SET current_stock = NEW.quantity,
            last_updated = now()  -- Use last_updated instead of updated_at
        WHERE id = NEW.inventory_item_id;
    END IF;
    
    RETURN NEW;
END;
$$;