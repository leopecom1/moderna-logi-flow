-- Create cash register system for branches

-- Create branch cash registers table
CREATE TABLE public.branch_cash_registers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID NOT NULL,
    name TEXT NOT NULL,
    initial_amount NUMERIC NOT NULL DEFAULT 0,
    current_balance NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily cash closures table
CREATE TABLE public.daily_cash_closures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cash_register_id UUID NOT NULL,
    closure_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opening_balance NUMERIC NOT NULL DEFAULT 0,
    system_calculated_balance NUMERIC NOT NULL DEFAULT 0,
    manual_cash_count NUMERIC,
    card_payments NUMERIC NOT NULL DEFAULT 0,
    transfer_payments NUMERIC NOT NULL DEFAULT 0,
    other_payments NUMERIC NOT NULL DEFAULT 0,
    total_expenses NUMERIC NOT NULL DEFAULT 0,
    difference NUMERIC GENERATED ALWAYS AS (COALESCE(manual_cash_count, system_calculated_balance) - (opening_balance + card_payments + transfer_payments + other_payments - total_expenses)) STORED,
    notes TEXT,
    closed_by UUID NOT NULL,
    sent_to_central BOOLEAN NOT NULL DEFAULT false,
    sent_to_central_at TIMESTAMP WITH TIME ZONE,
    sent_to_central_by UUID,
    amount_sent_to_central NUMERIC,
    remaining_amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(cash_register_id, closure_date)
);

-- Create petty cash expenses table
CREATE TABLE public.petty_cash_expenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cash_register_id UUID NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    receipt_url TEXT,
    created_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash register configuration table
CREATE TABLE public.cash_register_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID NOT NULL,
    default_opening_amount NUMERIC NOT NULL DEFAULT 0,
    allow_send_to_central BOOLEAN NOT NULL DEFAULT false,
    require_manager_approval_for_send BOOLEAN NOT NULL DEFAULT true,
    max_petty_cash_expense NUMERIC NOT NULL DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(branch_id)
);

-- Enable RLS
ALTER TABLE public.branch_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cash_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branch_cash_registers
CREATE POLICY "Authenticated users can view cash registers"
ON public.branch_cash_registers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerencia can manage cash registers"
ON public.branch_cash_registers FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for daily_cash_closures
CREATE POLICY "Authenticated users can view cash closures"
ON public.daily_cash_closures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerencia and vendedores can create closures"
ON public.daily_cash_closures FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

CREATE POLICY "Users can update their closures"
ON public.daily_cash_closures FOR UPDATE
TO authenticated
USING (closed_by = auth.uid() OR get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for petty_cash_expenses
CREATE POLICY "Authenticated users can view expenses"
ON public.petty_cash_expenses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerencia and vendedores can create expenses"
ON public.petty_cash_expenses FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['gerencia'::user_role, 'vendedor'::user_role]));

CREATE POLICY "Users can update their expenses"
ON public.petty_cash_expenses FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR get_user_role(auth.uid()) = 'gerencia'::user_role);

-- RLS Policies for cash_register_config
CREATE POLICY "Authenticated users can view config"
ON public.cash_register_config FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gerencia can manage config"
ON public.cash_register_config FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

-- Create indexes
CREATE INDEX idx_branch_cash_registers_branch_id ON public.branch_cash_registers(branch_id);
CREATE INDEX idx_daily_cash_closures_cash_register_id ON public.daily_cash_closures(cash_register_id);
CREATE INDEX idx_daily_cash_closures_closure_date ON public.daily_cash_closures(closure_date);
CREATE INDEX idx_petty_cash_expenses_cash_register_id ON public.petty_cash_expenses(cash_register_id);
CREATE INDEX idx_petty_cash_expenses_expense_date ON public.petty_cash_expenses(expense_date);

-- Create triggers for updated_at
CREATE TRIGGER update_branch_cash_registers_updated_at
    BEFORE UPDATE ON public.branch_cash_registers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_cash_closures_updated_at
    BEFORE UPDATE ON public.daily_cash_closures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_petty_cash_expenses_updated_at
    BEFORE UPDATE ON public.petty_cash_expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_register_config_updated_at
    BEFORE UPDATE ON public.cash_register_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();