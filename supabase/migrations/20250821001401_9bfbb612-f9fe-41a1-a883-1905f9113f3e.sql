-- Create branches table for managing different business locations
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Montevideo',
  phone TEXT,
  manager_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Create policies for branches
CREATE POLICY "Authenticated users can view branches" 
ON public.branches 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia can manage branches" 
ON public.branches 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Add branch_id to orders table
ALTER TABLE public.orders 
ADD COLUMN branch_id UUID REFERENCES public.branches(id);

-- Create trigger for branches updated_at
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default branch
INSERT INTO public.branches (name, address, city) 
VALUES ('Sucursal Principal', 'Dirección Principal', 'Montevideo');