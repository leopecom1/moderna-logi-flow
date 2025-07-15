-- Create vehicles table
CREATE TABLE public.vehicles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cadete_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    license_plate TEXT NOT NULL UNIQUE,
    color TEXT,
    insurance_company TEXT,
    insurance_policy TEXT,
    insurance_expiry DATE,
    technical_inspection_expiry DATE,
    vehicle_type TEXT NOT NULL DEFAULT 'motocicleta',
    status TEXT NOT NULL DEFAULT 'activo',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cadete_profiles table for additional personal information
CREATE TABLE public.cadete_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cadete_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
    driver_license_number TEXT,
    driver_license_category TEXT,
    driver_license_expiry DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    health_insurance_company TEXT,
    health_insurance_number TEXT,
    address TEXT,
    neighborhood TEXT,
    city TEXT DEFAULT 'Montevideo',
    departamento TEXT,
    bank_account_number TEXT,
    bank_name TEXT,
    date_of_birth DATE,
    identification_number TEXT,
    marital_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadete_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicles
CREATE POLICY "Gerencia can manage all vehicles" 
ON public.vehicles 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia');

CREATE POLICY "Cadetes can view their own vehicles" 
ON public.vehicles 
FOR SELECT 
USING (cadete_id = auth.uid());

CREATE POLICY "Cadetes can update their own vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (cadete_id = auth.uid());

-- Create RLS policies for cadete_profiles
CREATE POLICY "Gerencia can manage all cadete profiles" 
ON public.cadete_profiles 
FOR ALL 
USING (get_user_role(auth.uid()) = 'gerencia');

CREATE POLICY "Cadetes can view their own profile" 
ON public.cadete_profiles 
FOR SELECT 
USING (cadete_id = auth.uid());

CREATE POLICY "Cadetes can update their own profile" 
ON public.cadete_profiles 
FOR UPDATE 
USING (cadete_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cadete_profiles_updated_at
    BEFORE UPDATE ON public.cadete_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_vehicles_cadete_id ON public.vehicles(cadete_id);
CREATE INDEX idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX idx_cadete_profiles_cadete_id ON public.cadete_profiles(cadete_id);