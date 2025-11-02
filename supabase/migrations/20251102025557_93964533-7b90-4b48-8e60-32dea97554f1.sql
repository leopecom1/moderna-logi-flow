-- Extend woocommerce_config table with operational fields
ALTER TABLE woocommerce_config
ADD COLUMN default_branch_id UUID REFERENCES branches(id),
ADD COLUMN default_warehouse_id UUID REFERENCES warehouses(id),
ADD COLUMN default_requiere_armado BOOLEAN DEFAULT false,
ADD COLUMN auto_assign_to_route BOOLEAN DEFAULT false;