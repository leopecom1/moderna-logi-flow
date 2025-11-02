-- Create table for WooCommerce configuration
CREATE TABLE public.woocommerce_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_url TEXT NOT NULL,
  consumer_key TEXT NOT NULL,
  consumer_secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.woocommerce_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view woocommerce config"
ON public.woocommerce_config
FOR SELECT
USING (true);

CREATE POLICY "Gerencia can manage woocommerce config"
ON public.woocommerce_config
FOR ALL
USING (get_user_role(auth.uid()) = 'gerencia');

-- Add trigger for updated_at
CREATE TRIGGER update_woocommerce_config_updated_at
BEFORE UPDATE ON public.woocommerce_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();