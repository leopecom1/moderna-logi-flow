-- Crear tabla de campañas e-commerce
CREATE TABLE public.ecommerce_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  markup_percentage NUMERIC(5,2) NOT NULL CHECK (markup_percentage > 0 AND markup_percentage <= 999),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'reverted')),
  products_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de productos en campañas
CREATE TABLE public.ecommerce_campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ecommerce_campaigns(id) ON DELETE CASCADE,
  woocommerce_product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT DEFAULT 'simple',
  original_regular_price NUMERIC(10,2),
  original_sale_price NUMERIC(10,2),
  new_regular_price NUMERIC(10,2),
  new_sale_price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'error', 'reverted')),
  error_message TEXT,
  applied_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_ecommerce_campaigns_created_by ON public.ecommerce_campaigns(created_by);
CREATE INDEX idx_ecommerce_campaigns_status ON public.ecommerce_campaigns(status);
CREATE INDEX idx_ecommerce_campaign_products_campaign_id ON public.ecommerce_campaign_products(campaign_id);
CREATE INDEX idx_ecommerce_campaign_products_woocommerce_id ON public.ecommerce_campaign_products(woocommerce_product_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_ecommerce_campaigns_updated_at
  BEFORE UPDATE ON public.ecommerce_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para ecommerce_campaigns
ALTER TABLE public.ecommerce_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaigns"
  ON public.ecommerce_campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerencia can create campaigns"
  ON public.ecommerce_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'gerencia');

CREATE POLICY "Gerencia can update campaigns"
  ON public.ecommerce_campaigns
  FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'gerencia');

CREATE POLICY "Gerencia can delete campaigns"
  ON public.ecommerce_campaigns
  FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'gerencia');

-- RLS Policies para ecommerce_campaign_products
ALTER TABLE public.ecommerce_campaign_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaign products"
  ON public.ecommerce_campaign_products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerencia can manage campaign products"
  ON public.ecommerce_campaign_products
  FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'gerencia');