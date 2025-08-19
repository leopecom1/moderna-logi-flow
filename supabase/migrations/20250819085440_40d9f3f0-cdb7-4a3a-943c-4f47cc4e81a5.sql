-- Check what triggers exist on inventory_movements
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'inventory_movements';

-- Let's also check the current structure
\d inventory_movements;

-- Drop any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS update_inventory_movements_updated_at ON inventory_movements;
DROP TRIGGER IF EXISTS set_updated_at ON inventory_movements;

-- Remove the problematic trigger that updates updated_at on INSERT
-- We only want it on UPDATE, not INSERT since INSERT already has DEFAULT now()
CREATE TRIGGER update_inventory_movements_updated_at
    BEFORE UPDATE ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();