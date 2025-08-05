import { useAuth } from '@/hooks/useAuth';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Package,
  Truck,
  Users,
  AlertTriangle,
  CreditCard,
  BarChart3,
  Settings,
  Crown,
  UserPlus,
  Route,
  MapPin,
  FileText,
  DollarSign,
  ShoppingCart,
  Package2
} from 'lucide-react';

export const AppSidebar = () => {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  // Menu items for each role
  const gerenciaItems = [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Reportes', url: '/reports', icon: BarChart3 },
    { title: 'Pedidos', url: '/orders', icon: Package },
    { title: 'Clientes', url: '/customers', icon: Users },
    { title: 'Entregas', url: '/deliveries', icon: Truck },
    { title: 'Rutas', url: '/routes', icon: Route },
    { title: 'Cadetes', url: '/cadetes', icon: UserPlus },
    { title: 'Vehículos', url: '/vehiculos', icon: Truck },
    { title: 'Usuarios', url: '/users', icon: Crown },
    { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
    { title: 'Pagos', url: '/payments', icon: CreditCard },
    { title: 'Productos', url: '/products', icon: Package2 },
    { title: 'Ventas', url: '/sales', icon: ShoppingCart },
    { title: 'Configuración', url: '/settings', icon: Settings },
  ];

  const vendedorItems = [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Mis Pedidos', url: '/orders', icon: Package },
    { title: 'Nuevo Pedido', url: '/orders/new', icon: UserPlus },
    { title: 'Entregas', url: '/deliveries', icon: Truck },
    { title: 'Clientes', url: '/customers', icon: Users },
    { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
    { title: 'Pagos', url: '/payments', icon: DollarSign },
  ];

  const cadeteItems = [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Mi Ruta', url: '/route', icon: MapPin },
    { title: 'Entregas', url: '/deliveries', icon: Truck },
    { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
    { title: 'Historial', url: '/history', icon: FileText },
  ];

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'gerencia':
        return gerenciaItems;
      case 'vendedor':
        return vendedorItems;
      case 'cadete':
        return cadeteItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border animate-element animate-delay-100">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/629c5c32-2f75-4980-89b7-b7666a341b25.png" 
              alt="RutaMOD Logo" 
              className={`object-contain smooth-transition ${
                state === 'collapsed' ? 'h-8 w-8' : 'h-12 w-auto'
              }`}
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`${getNavCls} smooth-transition animate-element`}
                      style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};