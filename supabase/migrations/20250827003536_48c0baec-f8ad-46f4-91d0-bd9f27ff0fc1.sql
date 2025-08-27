-- Add reference number columns to categories and brands
ALTER TABLE public.categories ADD COLUMN reference_number INTEGER;
ALTER TABLE public.brands ADD COLUMN reference_number INTEGER;

-- Add unique constraints for reference numbers
ALTER TABLE public.categories ADD CONSTRAINT categories_reference_number_unique UNIQUE(reference_number);
ALTER TABLE public.brands ADD CONSTRAINT brands_reference_number_unique UNIQUE(reference_number);

-- Create indexes for better performance
CREATE INDEX idx_categories_reference_number ON public.categories(reference_number);
CREATE INDEX idx_brands_reference_number ON public.brands(reference_number);

-- Auto-assign reference numbers to existing categories (starting from 1)
WITH numbered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM public.categories
  WHERE is_active = true
)
UPDATE public.categories 
SET reference_number = nc.rn
FROM numbered_categories nc
WHERE categories.id = nc.id;

-- Auto-assign reference numbers to existing brands (starting from 1)
WITH numbered_brands AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
  FROM public.brands
  WHERE is_active = true
)
UPDATE public.brands 
SET reference_number = nb.rn
FROM numbered_brands nb
WHERE brands.id = nb.id;

-- Add comments for documentation
COMMENT ON COLUMN public.categories.reference_number IS 'Unique reference number for import purposes';
COMMENT ON COLUMN public.brands.reference_number IS 'Unique reference number for import purposes';