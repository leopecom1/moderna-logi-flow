-- Create branch_warehouses table to assign warehouses to branches
CREATE TABLE public.branch_warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(branch_id, warehouse_id)
);

-- Enable RLS
ALTER TABLE public.branch_warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view branch warehouses" 
ON public.branch_warehouses 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia can manage branch warehouses" 
ON public.branch_warehouses 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_branch_warehouses_updated_at
BEFORE UPDATE ON public.branch_warehouses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();