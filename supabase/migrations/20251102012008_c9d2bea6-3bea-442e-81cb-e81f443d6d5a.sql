-- Crear tabla de armadores
CREATE TABLE public.armadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agregar campo armador_id a la tabla orders
ALTER TABLE public.orders
ADD COLUMN armador_id UUID REFERENCES public.armadores(id);

-- Habilitar RLS
ALTER TABLE public.armadores ENABLE ROW LEVEL SECURITY;

-- Políticas para armadores
CREATE POLICY "Authenticated users can view armadores"
ON public.armadores
FOR SELECT
USING (true);

CREATE POLICY "Gerencia can manage armadores"
ON public.armadores
FOR ALL
USING (get_user_role(auth.uid()) = 'gerencia');

-- Trigger para actualizar updated_at
CREATE TRIGGER update_armadores_updated_at
BEFORE UPDATE ON public.armadores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();