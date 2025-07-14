-- Recrear solo la función handle_new_user con mejor manejo de errores
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insertar en profiles con manejo de errores y valores por defecto
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario'),
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::public.user_role, 
            'cadete'::public.user_role
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- En caso de error, log y continuar para no bloquear la creación del usuario
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Agregar comentario para documentación
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile record when a new user is created in auth.users. Handles errors gracefully to prevent blocking user creation.';

-- Verificar que el enum user_role existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE EXCEPTION 'user_role enum does not exist';
    END IF;
    RAISE NOTICE 'user_role enum verified successfully';
END $$;