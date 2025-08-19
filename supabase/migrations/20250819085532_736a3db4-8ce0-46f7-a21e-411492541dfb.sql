-- Check what triggers exist on inventory_movements
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing
FROM information_schema.triggers t
WHERE t.event_object_table = 'inventory_movements';

-- Drop any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS update_inventory_movements_updated_at ON inventory_movements;
DROP TRIGGER IF EXISTS set_updated_at ON inventory_movements;

-- Check if there's an existing trigger from other functions causing this
-- This might be the issue - there could be another trigger trying to access updated_at
SELECT
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_trigger t ON p.oid = t.tgfoid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'inventory_movements';