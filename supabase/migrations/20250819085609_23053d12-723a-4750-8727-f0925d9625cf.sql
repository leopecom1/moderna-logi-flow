-- Check all triggers on inventory_movements
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inventory_movements'
AND trigger_schema = 'public';

-- Test a simple insert to see if the error persists
-- Using a dummy inventory_item_id that should exist
INSERT INTO inventory_movements (
  inventory_item_id, 
  movement_type, 
  quantity, 
  unit_cost, 
  user_id,
  reference_document,
  notes
) VALUES (
  (SELECT id FROM inventory_items LIMIT 1),
  'entrada',
  1,
  10.00,
  (SELECT auth.uid()),
  'Test insert',
  'Testing updated_at field'
);

-- If that works, delete the test record
DELETE FROM inventory_movements WHERE reference_document = 'Test insert';