-- Create table for role permissions configuration
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  permission_key TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_key)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Gerencia can manage role permissions" 
ON public.role_permissions 
FOR ALL
USING (get_user_role(auth.uid()) = 'gerencia'::user_role);

CREATE POLICY "Users can view role permissions" 
ON public.role_permissions 
FOR SELECT
USING (true);

-- Insert default permissions for cadete role
INSERT INTO public.role_permissions (role, permission_key, permission_name, is_enabled) VALUES
('cadete', 'view_deliveries', 'Ver Entregas', true),
('cadete', 'update_delivery_status', 'Actualizar Estado de Entregas', true),
('cadete', 'view_routes', 'Ver Rutas Asignadas', true),
('cadete', 'view_profile', 'Ver/Editar Perfil', true),
('cadete', 'view_vehicles', 'Ver/Editar Vehículos', true),
('cadete', 'upload_delivery_photos', 'Subir Fotos de Entrega', true),
('cadete', 'view_notifications', 'Ver Notificaciones', true),
('cadete', 'location_tracking', 'Seguimiento de Ubicación', true);

-- Insert default permissions for vendedor role
INSERT INTO public.role_permissions (role, permission_key, permission_name, is_enabled) VALUES
('vendedor', 'view_customers', 'Ver Clientes', true),
('vendedor', 'create_customers', 'Crear Clientes', true),
('vendedor', 'edit_customers', 'Editar Clientes', true),
('vendedor', 'view_orders', 'Ver Pedidos', true),
('vendedor', 'create_orders', 'Crear Pedidos', true),
('vendedor', 'edit_orders', 'Editar Pedidos', true),
('vendedor', 'view_products', 'Ver Productos', true),
('vendedor', 'create_products', 'Crear Productos', true),
('vendedor', 'edit_products', 'Editar Productos', true),
('vendedor', 'view_inventory', 'Ver Inventario', true),
('vendedor', 'manage_inventory', 'Gestionar Inventario', true),
('vendedor', 'view_sales', 'Ver Ventas', true),
('vendedor', 'create_sales', 'Crear Ventas', true),
('vendedor', 'view_collections', 'Ver Cobranzas', true),
('vendedor', 'create_collections', 'Crear Cobranzas', true),
('vendedor', 'view_suppliers', 'Ver Proveedores', true),
('vendedor', 'manage_suppliers', 'Gestionar Proveedores', true),
('vendedor', 'view_purchases', 'Ver Compras', true),
('vendedor', 'create_purchases', 'Crear Compras', true),
('vendedor', 'view_deliveries', 'Ver Entregas', true),
('vendedor', 'assign_deliveries', 'Asignar Entregas', true),
('vendedor', 'view_reports', 'Ver Reportes', true),
('vendedor', 'view_analytics', 'Ver Análisis', true);

-- Create trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();