import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NavLink, useLocation } from 'react-router-dom';
import modernaLogo from '@/assets/moderna-logo-blanco.png';
import { useDemoVersion } from '@/context/DemoVersionContext';
import { DemoVersionSelector } from '@/components/demo/DemoVersionSelector';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  MapPin,
  FileText,
  DollarSign,
  ShoppingCart,
  Package2,
  Receipt,
  PiggyBank,
  Upload,
  User,
  Banknote,
  Brain,
  Building2,
  TrendingUp,
  Car,
  ArrowRightLeft,
  Calculator,
  ClipboardList,
  Wrench,
  ShoppingBag,
  PackageOpen,
  RefreshCw,
  History,
  Percent,
  ChevronRight,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface MenuCategory {
  category: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  items: MenuItem[];
}

export const AppSidebar = () => {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';
  const { demoVersion, getAllowedCategories } = useDemoVersion();
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setClickCount(0), 500);
    if (clickCount >= 2) {
      setShowDemoSelector(true);
      setClickCount(0);
    }
  };

  const isActive = (path: string) => currentPath === path;

  const isGroupActive = (items: MenuItem[]) => 
    items.some(item => isActive(item.url));

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-white/15 font-semibold border-l-[3px] border-white/80 pl-3 backdrop-blur-sm'
      : 'hover:bg-white/10 transition-all duration-200';

  // Gerencia - 7 grupos lógicos bien organizados
  const gerenciaItems: MenuCategory[] = [
    {
      category: 'Dashboard',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        { title: 'Dashboard', url: '/', icon: Home },
      ]
    },
    {
      category: 'Comercial',
      icon: Users,
      items: [
        { title: 'Clientes', url: '/customers', icon: Users },
        { title: 'Pedidos', url: '/orders', icon: ShoppingCart },
        { title: 'Entregas', url: '/deliveries', icon: Truck },
        { title: 'Cobros', url: '/collections', icon: Receipt },
        { title: 'Cuentas por Cobrar', url: '/accounts-receivable', icon: PiggyBank },
      ]
    },
    {
      category: 'Inventario',
      icon: Package,
      items: [
        { title: 'Productos', url: '/products', icon: Package2 },
        { title: 'Stock', url: '/inventory', icon: Package },
        { title: 'Movimientos', url: '/stock-movements', icon: ArrowRightLeft },
      ]
    },
    {
      category: 'Operaciones',
      icon: Truck,
      items: [
        { title: 'Gestión de Pedidos', url: '/logistics', icon: ClipboardList },
        { title: 'Gestión de Envíos', url: '/routes-management', icon: Truck },
        { title: 'Visualizar Rutas', url: '/routes-view', icon: MapPin },
        { title: 'Panel de Armado', url: '/assembly', icon: Wrench },
      ]
    },
    {
      category: 'Finanzas',
      icon: DollarSign,
      items: [
        { title: 'Panel Financiero', url: '/finance', icon: TrendingUp },
        { title: 'Gestión de Cajas', url: '/cash-management', icon: Calculator },
        { title: 'Pagos', url: '/payments', icon: DollarSign },
        { title: 'Compras', url: '/purchases', icon: ShoppingCart },
        { title: 'Pago Proveedores', url: '/supplier-payments', icon: CreditCard },
        { title: 'Crédito Moderna', url: '/credito-moderna', icon: Banknote },
      ]
    },
    {
      category: 'E-commerce',
      icon: ShoppingBag,
      items: [
        { title: 'Tienda Online', url: '/woocommerce-config', icon: ShoppingBag },
        { title: 'Pedidos Online', url: '/woocommerce-review', icon: ClipboardList },
        { title: 'Productos Online', url: '/woocommerce-products', icon: PackageOpen },
        { title: 'Sincronización', url: '/product-sync', icon: RefreshCw },
        { title: 'Historial Sync', url: '/product-sync-history', icon: History },
        { title: 'Campañas', url: '/ecommerce-campaigns', icon: Percent },
      ]
    },
    {
      category: 'Administración',
      icon: Settings,
      items: [
        { title: 'Analytics KPI', url: '/kpi-analytics', icon: Brain },
        { title: 'Usuarios', url: '/user-management', icon: Crown },
        { title: 'Cadetes', url: '/cadetes', icon: UserPlus },
        { title: 'Vehículos', url: '/vehiculos', icon: Car },
        { title: 'Armadores', url: '/armadores', icon: Wrench },
        { title: 'Reportes', url: '/reports', icon: BarChart3 },
        { title: 'Gestión Empresarial', url: '/business', icon: Building2 },
        { title: 'Importación Masiva', url: '/bulk-import', icon: Upload },
        { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
        { title: 'Configuración', url: '/settings', icon: Settings },
        { title: 'Mi Perfil', url: '/profile', icon: User },
      ]
    }
  ];

  // Vendedor - estructura simplificada
  const vendedorItems: MenuCategory[] = [
    {
      category: 'Dashboard',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        { title: 'Dashboard', url: '/', icon: Home },
      ]
    },
    {
      category: 'Ventas',
      icon: ShoppingCart,
      items: [
        { title: 'Clientes', url: '/customers', icon: Users },
        { title: 'Mis Pedidos', url: '/orders', icon: Package },
        { title: 'Nuevo Pedido', url: '/orders/new', icon: UserPlus },
        { title: 'Entregas', url: '/deliveries', icon: Truck },
        { title: 'Pagos', url: '/payments', icon: DollarSign },
        { title: 'Cobros', url: '/collections', icon: Receipt },
      ]
    },
    {
      category: 'Sistema',
      icon: Settings,
      items: [
        { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
        { title: 'Mi Perfil', url: '/profile', icon: User },
      ]
    }
  ];

  // Cadete - estructura mínima
  const cadeteItems: MenuCategory[] = [
    {
      category: 'Dashboard',
      icon: LayoutDashboard,
      defaultOpen: true,
      items: [
        { title: 'Dashboard', url: '/', icon: Home },
      ]
    },
    {
      category: 'Operaciones',
      icon: Truck,
      items: [
        { title: 'Mi Ruta', url: '/route', icon: MapPin },
        { title: 'Entregas', url: '/deliveries', icon: Truck },
        { title: 'Historial', url: '/history', icon: FileText },
      ]
    },
    {
      category: 'Sistema',
      icon: Settings,
      items: [
        { title: 'Incidencias', url: '/incidents', icon: AlertTriangle },
        { title: 'Mi Perfil', url: '/profile', icon: User },
      ]
    }
  ];

  const getMenuItems = (): MenuCategory[] => {
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

  const allCategories = getMenuItems();
  const allowedCategories = getAllowedCategories();
  const menuCategories = allowedCategories
    ? allCategories.filter(cat => allowedCategories.includes(cat.category))
    : allCategories;

  const renderCategory = (category: MenuCategory, index: number) => {
    const isCategoryActive = isGroupActive(category.items);
    const shouldBeOpen = category.defaultOpen || isCategoryActive;

    // Dashboard siempre visible sin colapsar
    if (category.category === 'Dashboard') {
      return (
        <SidebarGroup key={category.category}>
          <SidebarMenu>
            {category.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild className="h-11">
                  <NavLink 
                    to={item.url} 
                    className={({ isActive }) => `${getNavCls({ isActive })} text-base text-white`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          {!isCollapsed && <Separator className="my-2 bg-white/10" />}
        </SidebarGroup>
      );
    }

    // Categorías colapsables
    return (
      <Collapsible
        key={category.category}
        defaultOpen={shouldBeOpen}
        className="group/collapsible"
      >
        <SidebarGroup className="py-1">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="cursor-pointer hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-between pr-3 py-2.5 text-[11px] font-semibold text-white/70 uppercase tracking-widest">
              <div className="flex items-center gap-2.5">
                <category.icon className="h-4 w-4 text-white/50" />
                {!isCollapsed && <span>{category.category}</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight className="h-3.5 w-3.5 text-white/40 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent className="mt-1">
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => `${getNavCls({ isActive })} text-[13px] text-white/90 rounded-md`}
                      >
                        <item.icon className="h-4 w-4 shrink-0 opacity-70" />
                        {!isCollapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-sidebar to-[hsl(24_41%_38%)]">
        {/* Logo Section — triple-click abre selector demo */}
        <div
          className={`border-b border-white/10 ${isCollapsed ? 'p-3' : 'px-5 py-5'} cursor-pointer select-none`}
          onClick={handleLogoClick}
        >
          <div className="flex items-center justify-center">
            <img
              src={modernaLogo}
              alt="Moderna Logo"
              className={`object-contain transition-all duration-300 ${
                isCollapsed ? 'h-8 w-8' : 'h-11 w-auto'
              }`}
            />
          </div>
        </div>

        {/* Menu Categories */}
        <div className="flex-1 overflow-y-auto py-3 px-1.5">
          {menuCategories.map((category, index) => renderCategory(category, index))}
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/40 tracking-wider uppercase">Moderna Logi-Flow</p>
            {demoVersion && (
              <span className="text-[9px] text-white/30 font-mono uppercase">{demoVersion}</span>
            )}
          </div>
        )}
      </SidebarContent>

      <DemoVersionSelector open={showDemoSelector} onOpenChange={setShowDemoSelector} />
    </Sidebar>
  );
};
