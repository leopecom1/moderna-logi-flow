-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('gerencia', 'vendedor', 'cadete');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pendiente', 'asignado', 'en_ruta', 'entregado', 'cancelado');

-- Create enum for delivery status
CREATE TYPE public.delivery_status AS ENUM ('pendiente', 'en_camino', 'entregado', 'con_demora', 'no_entregado');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pendiente', 'pagado', 'liquidado');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'cuenta_corriente');

-- Create enum for incident type
CREATE TYPE public.incident_type AS ENUM ('reclamo', 'problema_entrega', 'direccion_incorrecta', 'cliente_ausente', 'otro');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create customers table
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT NOT NULL,
    neighborhood TEXT,
    city TEXT NOT NULL DEFAULT 'Santa Fe',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    cadete_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    delivery_address TEXT NOT NULL,
    delivery_neighborhood TEXT,
    products JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    status order_status NOT NULL DEFAULT 'pendiente',
    delivery_date DATE,
    delivery_time_slot TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deliveries table
CREATE TABLE public.deliveries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    cadete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    route_id UUID,
    status delivery_status NOT NULL DEFAULT 'pendiente',
    attempted_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_notes TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routes table
CREATE TABLE public.routes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cadete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    route_name TEXT NOT NULL,
    route_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_deliveries INTEGER DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incidents table
CREATE TABLE public.incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    incident_type incident_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'abierto',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pendiente',
    paid_at TIMESTAMP WITH TIME ZONE,
    liquidated_at TIMESTAMP WITH TIME ZONE,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.profiles WHERE user_id = $1 LIMIT 1;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gerencia can view all profiles" ON public.profiles
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'gerencia');

-- Create RLS policies for customers
CREATE POLICY "Authenticated users can view customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Vendedores and gerencia can manage customers" ON public.customers
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('vendedor', 'gerencia'));

-- Create RLS policies for orders
CREATE POLICY "Users can view orders based on role" ON public.orders
    FOR SELECT USING (
        CASE public.get_user_role(auth.uid())
            WHEN 'gerencia' THEN true
            WHEN 'vendedor' THEN seller_id = auth.uid()
            WHEN 'cadete' THEN cadete_id = auth.uid()
            ELSE false
        END
    );

CREATE POLICY "Vendedores and gerencia can create orders" ON public.orders
    FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('vendedor', 'gerencia'));

CREATE POLICY "Vendedores can update their orders" ON public.orders
    FOR UPDATE USING (
        seller_id = auth.uid() OR 
        public.get_user_role(auth.uid()) = 'gerencia'
    );

-- Create RLS policies for deliveries
CREATE POLICY "Users can view deliveries based on role" ON public.deliveries
    FOR SELECT USING (
        CASE public.get_user_role(auth.uid())
            WHEN 'gerencia' THEN true
            WHEN 'vendedor' THEN EXISTS (
                SELECT 1 FROM public.orders 
                WHERE orders.id = deliveries.order_id 
                AND orders.seller_id = auth.uid()
            )
            WHEN 'cadete' THEN cadete_id = auth.uid()
            ELSE false
        END
    );

CREATE POLICY "Vendedores and gerencia can create deliveries" ON public.deliveries
    FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('vendedor', 'gerencia'));

CREATE POLICY "Cadetes can update their deliveries" ON public.deliveries
    FOR UPDATE USING (
        cadete_id = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('vendedor', 'gerencia')
    );

-- Create RLS policies for routes
CREATE POLICY "Users can view routes based on role" ON public.routes
    FOR SELECT USING (
        CASE public.get_user_role(auth.uid())
            WHEN 'gerencia' THEN true
            WHEN 'cadete' THEN cadete_id = auth.uid()
            ELSE false
        END
    );

CREATE POLICY "Gerencia can manage routes" ON public.routes
    FOR ALL USING (public.get_user_role(auth.uid()) = 'gerencia');

-- Create RLS policies for incidents
CREATE POLICY "Users can view incidents based on role" ON public.incidents
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'gerencia' OR 
        reported_by = auth.uid()
    );

CREATE POLICY "Authenticated users can create incidents" ON public.incidents
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Gerencia can update incidents" ON public.incidents
    FOR UPDATE USING (public.get_user_role(auth.uid()) = 'gerencia');

-- Create RLS policies for payments
CREATE POLICY "Users can view payments based on role" ON public.payments
    FOR SELECT USING (
        CASE public.get_user_role(auth.uid())
            WHEN 'gerencia' THEN true
            WHEN 'vendedor' THEN EXISTS (
                SELECT 1 FROM public.orders 
                WHERE orders.id = payments.order_id 
                AND orders.seller_id = auth.uid()
            )
            ELSE false
        END
    );

CREATE POLICY "Gerencia can manage payments" ON public.payments
    FOR ALL USING (public.get_user_role(auth.uid()) = 'gerencia');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON public.deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON public.routes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cadete')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_cadete_id ON public.orders(cadete_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX idx_deliveries_cadete_id ON public.deliveries(cadete_id);
CREATE INDEX idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_routes_cadete_id ON public.routes(cadete_id);
CREATE INDEX idx_routes_date ON public.routes(route_date);
CREATE INDEX idx_incidents_order_id ON public.incidents(order_id);
CREATE INDEX idx_incidents_reported_by ON public.incidents(reported_by);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);