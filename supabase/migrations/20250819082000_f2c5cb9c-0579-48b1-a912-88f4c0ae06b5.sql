-- Add support for multiple checks in supplier payments
-- Create a table to store individual check details
CREATE TABLE IF NOT EXISTS supplier_payment_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_payment_id UUID NOT NULL REFERENCES supplier_payments(id) ON DELETE CASCADE,
  check_number TEXT NOT NULL,
  check_due_date DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  check_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE supplier_payment_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for the checks table
CREATE POLICY "Authenticated users can view supplier payment checks" 
ON supplier_payment_checks 
FOR SELECT 
USING (true);

CREATE POLICY "Gerencia and vendedores can manage supplier payment checks" 
ON supplier_payment_checks 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['vendedor'::user_role, 'gerencia'::user_role]));

-- Add trigger for updating timestamps
CREATE TRIGGER update_supplier_payment_checks_updated_at
    BEFORE UPDATE ON supplier_payment_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();