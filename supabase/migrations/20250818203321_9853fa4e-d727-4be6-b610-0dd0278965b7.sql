-- Create warehouses/sucursales table
CREATE TABLE public.warehouses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT DEFAULT 'Santa Fe',
    manager_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_items table (extends products with inventory data)
CREATE TABLE public.inventory_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    maximum_stock INTEGER DEFAULT 0,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id, warehouse_id)
);

-- Create inventory_movements table
CREATE TABLE public.inventory_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'transferencia', 'ajuste')),
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    total_value NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    reference_document TEXT,
    from_warehouse_id UUID REFERENCES public.warehouses(id),
    to_warehouse_id UUID REFERENCES public.warehouses(id),
    user_id UUID NOT NULL,
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_valuations table for reports
CREATE TABLE public.inventory_valuations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_items INTEGER NOT NULL DEFAULT 0,
    total_value NUMERIC NOT NULL DEFAULT 0,
    valuation_data JSONB NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_valuations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warehouses
CREATE POLICY "Authenticated users can view warehouses" 
ON public.warehouses FOR SELECT 
USING (true);

CREATE POLICY "Gerencia can manage warehouses" 
ON public.warehouses FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for inventory_items
CREATE POLICY "Authenticated users can view inventory items" 
ON public.inventory_items FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage inventory items" 
ON public.inventory_items FOR ALL 
USING (get_user_role(auth.uid()) = ANY(ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

-- RLS Policies for inventory_movements
CREATE POLICY "Authenticated users can view inventory movements" 
ON public.inventory_movements FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can create movements" 
ON public.inventory_movements FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

CREATE POLICY "Users can update their movements" 
ON public.inventory_movements FOR UPDATE 
USING (user_id = auth.uid() OR get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for inventory_valuations
CREATE POLICY "Authenticated users can view valuations" 
ON public.inventory_valuations FOR SELECT 
USING (true);

CREATE POLICY "Gerencia can manage valuations" 
ON public.inventory_valuations FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Triggers for updated_at
CREATE TRIGGER update_warehouses_updated_at
    BEFORE UPDATE ON public.warehouses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update inventory stock after movements
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current stock based on movement type
    IF NEW.movement_type = 'entrada' THEN
        UPDATE public.inventory_items 
        SET current_stock = current_stock + NEW.quantity,
            last_updated = now()
        WHERE id = NEW.inventory_item_id;
    ELSIF NEW.movement_type = 'salida' THEN
        UPDATE public.inventory_items 
        SET current_stock = current_stock - NEW.quantity,
            last_updated = now()
        WHERE id = NEW.inventory_item_id;
    ELSIF NEW.movement_type = 'ajuste' THEN
        UPDATE public.inventory_items 
        SET current_stock = NEW.quantity,
            last_updated = now()
        WHERE id = NEW.inventory_item_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock automatically
CREATE TRIGGER update_stock_after_movement
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_stock();