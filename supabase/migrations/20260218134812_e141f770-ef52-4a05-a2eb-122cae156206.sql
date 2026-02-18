
-- Add WooCommerce integration columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS woocommerce_product_id INTEGER NULL,
  ADD COLUMN IF NOT EXISTS web_stock_mode TEXT NOT NULL DEFAULT 'virtual',
  ADD COLUMN IF NOT EXISTS web_virtual_stock INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS web_stock_warehouse_id UUID NULL REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- Add a trigger-based validation for web_stock_mode instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_web_stock_mode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.web_stock_mode NOT IN ('virtual', 'real', 'disabled') THEN
    RAISE EXCEPTION 'web_stock_mode must be one of: virtual, real, disabled';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS validate_web_stock_mode_trigger ON public.products;
CREATE TRIGGER validate_web_stock_mode_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_web_stock_mode();

-- Index for faster lookups by woocommerce_product_id
CREATE INDEX IF NOT EXISTS idx_products_woocommerce_product_id 
  ON public.products(woocommerce_product_id) 
  WHERE woocommerce_product_id IS NOT NULL;
