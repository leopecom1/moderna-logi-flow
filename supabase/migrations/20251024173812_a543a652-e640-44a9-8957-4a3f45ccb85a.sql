-- Add route_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN route_id uuid REFERENCES public.routes(id);

-- Create index for better query performance
CREATE INDEX idx_orders_route_id ON public.orders(route_id);

-- Add comment to document the column
COMMENT ON COLUMN public.orders.route_id IS 'Reference to the route assigned to this order for delivery';