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
  Package2,
  Receipt,
  PiggyBank,
  Upload,
  Bell,
  User,
  Banknote,
  Navigation,
  Brain,
  Building2,
  TrendingUp,
  Car,
  ArrowRightLeft,
  Calculator,
  ClipboardList
} from 'lucide-react';

export const AppSidebar = () => {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  // Menu items organized by categories
  const gerenciaItems = [
    {
      category: 'Principal',
      items: [
        { title: 'Dashboard', url: '/', icon: Home },
        { title: 'Analytics & ML', url: '/analytics', icon: Brain },
        { title: 'Gestión Empresarial', url: '/business', icon: Building2 },
      ]
    },
    {
      category: 'Ventas y Clientes',
      items: [
        { title: 'Clientes', url: '/customers', icon: Users },
        { title: 'Ventas', url: '/orders', icon: ShoppingCart },
        { title: 'Entregas', url: '/deliveries', icon: Truck },
      ]
    },
    {
      category: 'Catálogo y Stock',
      items: [
        { title: 'Productos', url: '/products', icon: Package2 },
        { title: 'Inventario', url: '/inventory', icon: Package },
        { title: 'Movimientos Stock', url: '/stock-movements', icon: ArrowRightLeft },
        { title: 'Importación Masiva', url: '/bulk-import', icon: Upload },
      ]
    },
    {
      category: 'Logística',
      items: [
        { title: 'Módulo Logístico', url: '/logistics', icon: ClipboardList },
        { title: 'Rutas', url: '/routes', icon: Route },
        { title: 'Optimización Rutas', url: '/route-optimization', icon: Navigation },
      ]
    },
    {
      category: 'Compras y Proveedores',
      items: [
        { title: 'Compras', url: '/purchases', icon: ShoppingCart },
        { title: 'Pago Proveedores', url: '/supplier-payments', icon: CreditCard },
      ]
    },
    {
      category: 'Finanzas',
      items: [
        { title: 'Panel Financiero', url: '/finance', icon: TrendingUp },
        { title: 'Gestión de Cajas', url: '/cash-management', icon: Calculator },
        { title: 'Pagos', url: '/payments', icon: DollarSign },
        { title: 'Cobros', url: '/collections', icon: Receipt },
        { title: 'Cuentas por Cobrar', url: '/accounts-receivable', icon: PiggyBank },
        { title: 'Crédito Moderna', url: '/credito-moderna', icon: Banknote },
      ]
    },
    {
      category: 'Reportes y Análisis',
      items: [
        { title: 'Reportes', url: '/reports', icon: BarChart3 },
      ]
    },
    {
      category: 'Sistema',
      items: [
        { title: 'Configuración', url: '/settings', icon: Settings },
        { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
        { title: 'Notificaciones', url: '/notifications', icon: Bell },
        { title: 'Mi Perfil', url: '/profile', icon: User },
      ]
    },
    {
      category: 'Gestión de Personal',
      items: [
        { title: 'Usuarios', url: '/user-management', icon: Crown },
        { title: 'Cadetes', url: '/cadetes', icon: UserPlus },
        { title: 'Vehículos', url: '/vehiculos', icon: Car },
      ]
    }
  ];

  const vendedorItems = [
    {
      category: 'Principal',
      items: [
        { title: 'Dashboard', url: '/', icon: Home },
      ]
    },
    {
      category: 'Ventas',
      items: [
        { title: 'Clientes', url: '/customers', icon: Users },
        { title: 'Mis Ventas', url: '/orders', icon: Package },
        { title: 'Nuevo Pedido', url: '/orders/new', icon: UserPlus },
        { title: 'Entregas', url: '/deliveries', icon: Truck },
        { title: 'Pagos', url: '/payments', icon: DollarSign },
        { title: 'Cobros', url: '/collections', icon: Receipt },
      ]
    },
    {
      category: 'Sistema',
      items: [
        { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
        { title: 'Mi Perfil', url: '/profile', icon: User },
      ]
    }
  ];

  const cadeteItems = [
    {
      category: 'Principal',
      items: [
        { title: 'Dashboard', url: '/', icon: Home },
      ]
    },
    {
      category: 'Operaciones',
      items: [
        { title: 'Mi Ruta', url: '/route', icon: MapPin },
        { title: 'Entregas', url: '/deliveries', icon: Truck },
        { title: 'Historial', url: '/history', icon: FileText },
      ]
    },
    {
      category: 'Sistema',
      items: [
        { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
        { title: 'Mi Perfil', url: '/profile', icon: User },
      ]
    }
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

  const menuCategories = getMenuItems();

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/629c5c32-2f75-4980-89b7-b7666a341b25.png" 
              alt="RutaMOD Logo" 
              className={`object-contain transition-all duration-200 ${
                state === 'collapsed' ? 'h-8 w-8' : 'h-12 w-auto'
              }`}
            />
          </div>
        </div>

        {menuCategories.map((category) => (
          <SidebarGroup key={category.category}>
            <SidebarGroupLabel>{category.category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => getNavCls({ isActive })}
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
};