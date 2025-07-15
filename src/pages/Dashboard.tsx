import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  MapPin
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  activeCadetes: number;
  openIncidents: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  myOrdersToday: number;
  myPendingDeliveries: number;
  myTodayRevenue: number;
  myCustomersCount: number;
  assignedDeliveries: number;
  myCompletedDeliveries: number;
  myPendingDeliveries_cadete: number;
  activeRoutes: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    activeCadetes: 0,
    openIncidents: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    myOrdersToday: 0,
    myPendingDeliveries: 0,
    myTodayRevenue: 0,
    myCustomersCount: 0,
    assignedDeliveries: 0,
    myCompletedDeliveries: 0,
    myPendingDeliveries_cadete: 0,
    activeRoutes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      fetchDashboardStats();
    }
  }, [profile?.user_id]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Obtener estadísticas según el rol
      if (profile?.role === 'gerencia') {
        await fetchGerenciaStats(startOfToday, startOfWeek, startOfMonth);
      } else if (profile?.role === 'vendedor') {
        await fetchVendedorStats(startOfToday, startOfWeek, startOfMonth);
      } else if (profile?.role === 'cadete') {
        await fetchCadeteStats(startOfToday);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGerenciaStats = async (today: Date, week: Date, month: Date) => {
    // Total de pedidos
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, status');

    // Entregas completadas
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('status, delivered_at');

    // Cadetes activos
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'cadete')
      .eq('is_active', true);

    // Incidencias abiertas
    const { data: incidents } = await supabase
      .from('incidents')
      .select('status')
      .eq('status', 'abierto');

    // Rutas activas
    const { data: routes } = await supabase
      .from('routes')
      .select('*')
      .is('end_time', null);

    const totalOrders = orders?.length || 0;
    const completedDeliveries = deliveries?.filter(d => d.status === 'entregado').length || 0;
    const pendingDeliveries = deliveries?.filter(d => d.status === 'pendiente').length || 0;
    const activeCadetes = profiles?.length || 0;
    const openIncidents = incidents?.length || 0;
    const activeRoutes = routes?.length || 0;

    // Ingresos
    const todayRevenue = orders?.filter(o => new Date(o.created_at) >= today)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const weekRevenue = orders?.filter(o => new Date(o.created_at) >= week)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const monthRevenue = orders?.filter(o => new Date(o.created_at) >= month)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    setStats(prev => ({
      ...prev,
      totalOrders,
      completedDeliveries,
      pendingDeliveries,
      activeCadetes,
      openIncidents,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      activeRoutes
    }));
  };

  const fetchVendedorStats = async (today: Date, week: Date, month: Date) => {
    // Mis pedidos
    const { data: myOrders } = await supabase
      .from('orders')
      .select('id, total_amount, created_at, status')
      .eq('seller_id', profile?.user_id);

    // Mis entregas
    const { data: myDeliveries } = await supabase
      .from('deliveries')
      .select('status, order_id')
      .in('order_id', myOrders?.map(o => o.id) || []);

    // Mis clientes únicos
    const { data: myCustomers } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('seller_id', profile?.user_id);

    const myOrdersToday = myOrders?.filter(o => new Date(o.created_at) >= today).length || 0;
    const myPendingDeliveries = myDeliveries?.filter(d => d.status === 'pendiente').length || 0;
    const myTodayRevenue = myOrders?.filter(o => new Date(o.created_at) >= today)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const uniqueCustomers = new Set(myCustomers?.map(c => c.customer_id));
    const myCustomersCount = uniqueCustomers.size;

    setStats(prev => ({
      ...prev,
      myOrdersToday,
      myPendingDeliveries,
      myTodayRevenue,
      myCustomersCount
    }));
  };

  const fetchCadeteStats = async (today: Date) => {
    // Mis entregas asignadas
    const { data: myDeliveries } = await supabase
      .from('deliveries')
      .select('status, delivered_at')
      .eq('cadete_id', profile?.user_id);

    const todayDeliveries = myDeliveries?.filter(d => {
      const deliveryDate = d.delivered_at ? new Date(d.delivered_at) : new Date();
      return deliveryDate >= today;
    }) || [];

    const assignedDeliveries = myDeliveries?.length || 0;
    const myCompletedDeliveries = myDeliveries?.filter(d => d.status === 'entregado').length || 0;
    const myPendingDeliveries_cadete = myDeliveries?.filter(d => d.status === 'pendiente').length || 0;

    setStats(prev => ({
      ...prev,
      assignedDeliveries,
      myCompletedDeliveries,
      myPendingDeliveries_cadete
    }));
  };

  const getGerenciaDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Gerencia</h1>
          <p className="text-muted-foreground">Resumen general del sistema logístico</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingDeliveries} pendientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregas Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedDeliveries}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrders > 0 ? Math.round((stats.completedDeliveries / stats.totalOrders) * 100) : 0}% tasa de éxito
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cadetes Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCadetes}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeRoutes} rutas activas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openIncidents}</div>
                <p className="text-xs text-muted-foreground">Abiertas</p>
              </CardContent>
            </Card>
          </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Entrega completada</p>
                  <p className="text-xs text-muted-foreground">Pedido #1234 - Juan Pérez</p>
                </div>
                <span className="text-xs text-muted-foreground">hace 5 min</span>
              </div>
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo pedido creado</p>
                  <p className="text-xs text-muted-foreground">Pedido #1235 - María López</p>
                </div>
                <span className="text-xs text-muted-foreground">hace 12 min</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Incidencia reportada</p>
                  <p className="text-xs text-muted-foreground">Dirección incorrecta</p>
                </div>
                <span className="text-xs text-muted-foreground">hace 25 min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hoy</span>
                <span className="text-sm font-bold">${stats.todayRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Esta semana</span>
                <span className="text-sm font-bold">${stats.weekRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Este mes</span>
                <span className="text-sm font-bold">${stats.monthRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  Total entregas: {stats.completedDeliveries}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );

  const getVendedorDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Vendedor</h1>
          <p className="text-muted-foreground">Gestiona tus pedidos y clientes</p>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Pedidos Hoy</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myOrdersToday}</div>
                <p className="text-xs text-muted-foreground">Pedidos de hoy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myPendingDeliveries}</div>
                <p className="text-xs text-muted-foreground">En proceso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.myTodayRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Ingresos de hoy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myCustomersCount}</div>
                <p className="text-xs text-muted-foreground">Clientes únicos</p>
              </CardContent>
            </Card>
          </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">#1234 - Juan Pérez</p>
                  <p className="text-sm text-muted-foreground">Zona Norte - $340</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Entregado
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">#1235 - María López</p>
                  <p className="text-sm text-muted-foreground">Zona Centro - $280</p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  En ruta
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">#1236 - Carlos García</p>
                  <p className="text-sm text-muted-foreground">Zona Sur - $520</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Pendiente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Crear Nuevo Pedido</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Gestionar Clientes</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Reportar Incidencia</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );

  const getCadeteDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Cadete</h1>
          <p className="text-muted-foreground">Tu ruta de entregas de hoy</p>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregas Asignadas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assignedDeliveries}</div>
                <p className="text-xs text-muted-foreground">Total asignadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myCompletedDeliveries}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.assignedDeliveries > 0 ? Math.round((stats.myCompletedDeliveries / stats.assignedDeliveries) * 100) : 0}% completado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myPendingDeliveries_cadete}</div>
                <p className="text-xs text-muted-foreground">Restantes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.assignedDeliveries > 0 ? Math.round((stats.myCompletedDeliveries / stats.assignedDeliveries) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Tasa de éxito</p>
              </CardContent>
            </Card>
          </div>

      {/* Route Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">#1237 - Ana Martínez</p>
                  <p className="text-sm text-muted-foreground">Av. San Martín 1234 - Zona Norte</p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  En ruta
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">#1238 - Pedro Rodríguez</p>
                  <p className="text-sm text-muted-foreground">Calle Mitre 567 - Zona Centro</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Pendiente
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">#1239 - Laura Fernández</p>
                  <p className="text-sm text-muted-foreground">Bv. Pellegrini 890 - Zona Sur</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Pendiente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Ver Ruta Completa</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Marcar Entrega</span>
                </div>
              </button>
              <button className="w-full p-3 text-left rounded-md border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Reportar Problema</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );

  const getDashboard = () => {
    switch (profile?.role) {
      case 'gerencia':
        return getGerenciaDashboard();
      case 'vendedor':
        return getVendedorDashboard();
      case 'cadete':
        return getCadeteDashboard();
      default:
        return <div>Rol no reconocido</div>;
    }
  };

  return (
    <div className="container mx-auto">
      {getDashboard()}
    </div>
  );
}