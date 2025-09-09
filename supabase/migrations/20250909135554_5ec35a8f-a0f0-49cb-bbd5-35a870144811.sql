-- Actualizar los tipos de estado de pedidos
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pendiente_compra';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'movimiento_interno_pendiente';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pendiente_confirmacion_transferencia';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pendiente_envio';

-- Crear tabla para compras solicitadas
CREATE TABLE IF NOT EXISTS public.requested_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id),
  notes TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'solicitado', 'recibido', 'cancelado')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  requested_by UUID NOT NULL DEFAULT auth.uid(),
  received_at TIMESTAMP WITH TIME ZONE,
  received_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.requested_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view requested purchases" 
ON public.requested_purchases 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage requested purchases" 
ON public.requested_purchases 
FOR ALL 
TO authenticated 
USING (get_user_role(auth.uid()) = ANY (ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

-- Trigger para updated_at
CREATE TRIGGER update_requested_purchases_updated_at
BEFORE UPDATE ON public.requested_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();