-- Check if there are any triggers trying to update updated_at field
-- Let's add the updated_at field to inventory_movements table to fix the issue
ALTER TABLE inventory_movements 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for inventory_movements updated_at
DROP TRIGGER IF EXISTS update_inventory_movements_updated_at ON inventory_movements;
CREATE TRIGGER update_inventory_movements_updated_at
    BEFORE UPDATE ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();