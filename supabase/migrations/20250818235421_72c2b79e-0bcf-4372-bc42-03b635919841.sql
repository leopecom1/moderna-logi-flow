-- Add DELETE policies for categories and brands
CREATE POLICY "Gerencia can delete categories" 
ON public.categories 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

CREATE POLICY "Gerencia can delete brands" 
ON public.brands 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);