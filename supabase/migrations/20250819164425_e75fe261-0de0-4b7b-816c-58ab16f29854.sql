-- Agregar configuración de listas de precio
CREATE TABLE IF NOT EXISTS public.price_lists_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_list_1_name TEXT NOT NULL DEFAULT 'Lista 1',
  price_list_2_name TEXT NOT NULL DEFAULT 'Lista 2',
  auto_calculate_enabled BOOLEAN NOT NULL DEFAULT false,
  margin_percentage_list_1 NUMERIC DEFAULT 0,
  margin_percentage_list_2 NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar configuración por defecto
INSERT INTO public.price_lists_config (price_list_1_name, price_list_2_name) 
VALUES ('Lista Minorista', 'Lista Mayorista')
ON CONFLICT DO NOTHING;

-- Agregar columnas de listas de precio a productos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_list_1 NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_list_2 NUMERIC NOT NULL DEFAULT 0;

-- Migrar precio actual a price_list_1
UPDATE public.products 
SET price_list_1 = price 
WHERE price_list_1 = 0;

-- Trigger para actualizar timestamp en price_lists_config
CREATE TRIGGER update_price_lists_config_updated_at
  BEFORE UPDATE ON public.price_lists_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies para price_lists_config
ALTER TABLE public.price_lists_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view price lists config" 
ON public.price_lists_config 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia can manage price lists config" 
ON public.price_lists_config 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);