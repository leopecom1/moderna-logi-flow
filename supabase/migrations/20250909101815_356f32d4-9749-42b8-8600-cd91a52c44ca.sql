-- Update existing customers with automatic 9-digit customer numbers
DO $$
DECLARE
    customer_record RECORD;
    new_number TEXT;
    counter INTEGER := 100000001;
BEGIN
    -- Update existing customers without customer numbers
    FOR customer_record IN 
        SELECT id FROM customers 
        WHERE customer_number IS NULL OR customer_number = ''
        ORDER BY created_at ASC
    LOOP
        new_number := LPAD(counter::TEXT, 9, '0');
        
        UPDATE customers 
        SET customer_number = new_number 
        WHERE id = customer_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Create a function to generate the next customer number
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    max_number TEXT;
    next_number INTEGER;
BEGIN
    -- Get the highest existing customer number
    SELECT MAX(customer_number) INTO max_number
    FROM customers
    WHERE customer_number IS NOT NULL 
    AND LENGTH(customer_number) = 9 
    AND customer_number ~ '^[0-9]+$';
    
    -- If no existing numbers, start with 100000001
    IF max_number IS NULL THEN
        RETURN '100000001';
    END IF;
    
    -- Increment the number
    next_number := max_number::INTEGER + 1;
    
    -- Return as 9-digit string
    RETURN LPAD(next_number::TEXT, 9, '0');
END;
$$;

-- Create trigger function to automatically assign customer number
CREATE OR REPLACE FUNCTION assign_customer_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only assign number if not provided
    IF NEW.customer_number IS NULL OR NEW.customer_number = '' THEN
        NEW.customer_number := generate_customer_number();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic customer number assignment
CREATE TRIGGER trigger_assign_customer_number
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION assign_customer_number();