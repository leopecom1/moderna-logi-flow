-- Crear perfil para el usuario existente
INSERT INTO public.profiles (user_id, full_name, role, is_active)
VALUES (
    '193165f2-98d7-4457-8679-0467a48dc08f'::uuid,
    'Usuario',
    'gerencia'::public.user_role,
    true
)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;