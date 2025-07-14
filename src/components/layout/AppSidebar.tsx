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
  DollarSign
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
    { title: 'Entregas', url: '/deliveries', icon: Truck },
    { title: 'Rutas', url: '/routes', icon: Route },
    { title: 'Usuarios', url: '/users', icon: Users },
    { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
    { title: 'Pagos', url: '/payments', icon: CreditCard },
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
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            {profile?.role === 'gerencia' && <Crown className="h-4 w-4" />}
            {profile?.role === 'vendedor' && <Users className="h-4 w-4" />}
            {profile?.role === 'cadete' && <Truck className="h-4 w-4" />}
            {state !== 'collapsed' && <span className="capitalize">{profile?.role}</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
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