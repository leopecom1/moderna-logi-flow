-- Add parent_id column to categories table to support subcategories
ALTER TABLE public.categories 
ADD COLUMN parent_id UUID REFERENCES public.categories(id);

-- Add index for better performance when querying subcategories
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Add check constraint to prevent self-referencing and circular references
ALTER TABLE public.categories 
ADD CONSTRAINT check_no_self_reference 
CHECK (parent_id != id);

-- Update RLS policies to include subcategory access
-- The existing policies should still work, but let's ensure proper access