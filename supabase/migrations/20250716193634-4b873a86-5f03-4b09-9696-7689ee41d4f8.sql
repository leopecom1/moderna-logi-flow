-- Add DELETE policy for customers table
CREATE POLICY "Gerencia can delete customers" 
ON public.customers 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);