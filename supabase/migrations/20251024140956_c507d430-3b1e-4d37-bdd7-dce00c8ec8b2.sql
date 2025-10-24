-- Add retiro_en_sucursal and entregar_ahora fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS retiro_en_sucursal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS entregar_ahora boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_retiro_en_sucursal ON public.orders(retiro_en_sucursal);
CREATE INDEX IF NOT EXISTS idx_orders_entregar_ahora ON public.orders(entregar_ahora);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.retiro_en_sucursal IS 'Indica si el pedido es para retiro en sucursal';
COMMENT ON COLUMN public.orders.entregar_ahora IS 'Indica si el pedido debe entregarse inmediatamente sin pasar por logística';