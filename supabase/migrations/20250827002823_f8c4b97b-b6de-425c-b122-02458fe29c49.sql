-- Add category_id column to products table
ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Create index for better performance
CREATE INDEX idx_products_category_id ON public.products(category_id);

-- Update existing products to use category IDs instead of text
UPDATE public.products 
SET category_id = (
    SELECT c.id 
    FROM public.categories c 
    WHERE c.name = products.category
)
WHERE products.category IS NOT NULL;

-- Drop the old category text column
ALTER TABLE public.products DROP COLUMN category;

-- Add comment for documentation
COMMENT ON COLUMN public.products.category_id IS 'Foreign key to categories table';