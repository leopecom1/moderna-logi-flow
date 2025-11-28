-- Create table for storing original variation prices during campaigns
CREATE TABLE IF NOT EXISTS public.ecommerce_campaign_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_product_id UUID NOT NULL REFERENCES public.ecommerce_campaign_products(id) ON DELETE CASCADE,
  woocommerce_variation_id INTEGER NOT NULL,
  original_regular_price NUMERIC(10,2),
  original_sale_price NUMERIC(10,2),
  new_regular_price NUMERIC(10,2),
  new_sale_price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_campaign_variations_campaign_product 
ON public.ecommerce_campaign_variations(campaign_product_id);

CREATE INDEX idx_campaign_variations_wc_id 
ON public.ecommerce_campaign_variations(woocommerce_variation_id);

-- Enable RLS
ALTER TABLE public.ecommerce_campaign_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view campaign variations"
ON public.ecommerce_campaign_variations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerencia can manage campaign variations"
ON public.ecommerce_campaign_variations
FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'gerencia')
WITH CHECK (get_user_role(auth.uid()) = 'gerencia');

-- Function to update products_count in campaigns
CREATE OR REPLACE FUNCTION public.update_campaign_products_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ecommerce_campaigns
    SET products_count = products_count + 1
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ecommerce_campaigns
    SET products_count = GREATEST(0, products_count - 1)
    WHERE id = OLD.campaign_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update products_count
CREATE TRIGGER update_campaign_products_count_trigger
AFTER INSERT OR DELETE ON public.ecommerce_campaign_products
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_products_count();