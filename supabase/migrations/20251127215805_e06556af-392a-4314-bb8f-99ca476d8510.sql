-- Create product_sync_history table to track synchronizations
CREATE TABLE IF NOT EXISTS public.product_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_product_id BIGINT NOT NULL,
  woocommerce_product_name TEXT,
  shopify_product_id BIGINT NOT NULL,
  shopify_product_name TEXT,
  sync_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  synced_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.product_sync_history ENABLE ROW LEVEL SECURITY;

-- Create policies for viewing history
CREATE POLICY "Users can view sync history"
  ON public.product_sync_history
  FOR SELECT
  USING (true);

-- Create policy for inserting history records
CREATE POLICY "Authenticated users can insert sync history"
  ON public.product_sync_history
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_product_sync_history_sync_date ON public.product_sync_history(sync_date DESC);
CREATE INDEX idx_product_sync_history_woocommerce_product_id ON public.product_sync_history(woocommerce_product_id);
CREATE INDEX idx_product_sync_history_shopify_product_id ON public.product_sync_history(shopify_product_id);