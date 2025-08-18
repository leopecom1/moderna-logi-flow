-- Add foreign key constraints to establish relationships
ALTER TABLE public.inventory_items 
ADD CONSTRAINT fk_inventory_items_product 
FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.inventory_movements 
ADD CONSTRAINT fk_inventory_movements_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Update RLS policies to allow reading with joins
DROP POLICY IF EXISTS "Authenticated users can view inventory items" ON public.inventory_items;
CREATE POLICY "Authenticated users can view inventory items" 
ON public.inventory_items FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view inventory movements" ON public.inventory_movements;
CREATE POLICY "Authenticated users can view inventory movements" 
ON public.inventory_movements FOR SELECT 
USING (true);