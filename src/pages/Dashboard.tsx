import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Stats1 from '@/components/ui/stats-1';
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
  // KPIs principales
  totalOrders: number;
  ordersToday: number;
  assignedRoutes: number;
  ordersInTransit: number;
  ordersDeliveredToday: number;
  ordersDeliveredThisWeek: number;
  pendingOrders: number;
  incidentsThisWeek: number;
  
  // Stats adicionales para diferentes roles
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

interface RecentActivity {
  id: string;
  type: 'order' | 'delivery' | 'incident';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  created_at: string;
}

interface PendingDelivery {
  id: string;
  order_number: string;
  customer_name: string;
  delivery_address: string;
  status: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    // KPIs principales
    totalOrders: 0,
    ordersToday: 0,
    assignedRoutes: 0,
    ordersInTransit: 0,
    ordersDeliveredToday: 0,
    ordersDeliveredThisWeek: 0,
    pendingOrders: 0,
    incidentsThisWeek: 0,
    
    // Stats adicionales para diferentes roles
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
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>([]);

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
        await fetchRecentActivities();
      } else if (profile?.role === 'vendedor') {
        await fetchVendedorStats(startOfToday, startOfWeek, startOfMonth);
        await fetchRecentOrders();
      } else if (profile?.role === 'cadete') {
        await fetchCadeteStats(startOfToday);
        await fetchPendingDeliveries();
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGerenciaStats = async (today: Date, week: Date, month: Date) => {
    // Todos los pedidos
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, status');

    // Todas las entregas  
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('status, delivered_at, created_at');

    // Rutas con cadetes
    const { data: routes } = await supabase
      .from('routes')
      .select('*');

    // Incidencias de la semana
    const { data: incidents } = await supabase
      .from('incidents')
      .select('created_at, status');

    // Calcular los 8 KPIs principales
    const totalOrders = orders?.length || 0;
    const ordersToday = orders?.filter(o => new Date(o.created_at) >= today).length || 0;
    const assignedRoutes = routes?.filter(r => r.cadete_id && !r.end_time).length || 0;
    const ordersInTransit = deliveries?.filter(d => d.status === 'en_camino').length || 0;
    
    const ordersDeliveredToday = deliveries?.filter(d => 
      d.status === 'entregado' && d.delivered_at && new Date(d.delivered_at) >= today
    ).length || 0;
    
    const ordersDeliveredThisWeek = deliveries?.filter(d => 
      d.status === 'entregado' && d.delivered_at && new Date(d.delivered_at) >= week
    ).length || 0;
    
    const pendingOrders = orders?.filter(o => o.status === 'pendiente').length || 0;
    const incidentsThisWeek = incidents?.filter(i => new Date(i.created_at) >= week).length || 0;

    // Stats adicionales para compatibilidad
    const completedDeliveries = deliveries?.filter(d => d.status === 'entregado').length || 0;
    const pendingDeliveries = deliveries?.filter(d => d.status === 'pendiente').length || 0;
    const openIncidents = incidents?.filter(i => i.status === 'abierto').length || 0;
    const activeRoutes = routes?.filter(r => !r.end_time).length || 0;

    const todayRevenue = orders?.filter(o => new Date(o.created_at) >= today)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const weekRevenue = orders?.filter(o => new Date(o.created_at) >= week)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const monthRevenue = orders?.filter(o => new Date(o.created_at) >= month)
      .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    setStats(prev => ({
      ...prev,
      // KPIs principales
      totalOrders,
      ordersToday,
      assignedRoutes,
      ordersInTransit,
      ordersDeliveredToday,
      ordersDeliveredThisWeek,
      pendingOrders,
      incidentsThisWeek,
      // Stats adicionales
      completedDeliveries,
      pendingDeliveries,
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

  const fetchRecentActivities = async () => {
    const activities: RecentActivity[] = [];
    
    // Obtener entregas recientes completadas
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select(`
        id,
        delivered_at,
        status,
        order_id,
        orders (
          order_number,
          customers (name)
        )
      `)
      .eq('status', 'entregado')
      .order('delivered_at', { ascending: false })
      .limit(5);

    // Obtener pedidos recientes
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        customers (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Obtener incidencias recientes
    const { data: incidents } = await supabase
      .from('incidents')
      .select('id, title, created_at, incident_type')
      .order('created_at', { ascending: false })
      .limit(5);

    // Agregar entregas completadas
    deliveries?.forEach(delivery => {
      activities.push({
        id: delivery.id,
        type: 'delivery',
        title: 'Entrega completada',
        description: `Pedido #${delivery.orders?.order_number} - ${delivery.orders?.customers?.name}`,
        timestamp: delivery.delivered_at || '',
        status: delivery.status
      });
    });

    // Agregar nuevos pedidos
    orders?.forEach(order => {
      activities.push({
        id: order.id,
        type: 'order',
        title: 'Nuevo pedido creado',
        description: `Pedido #${order.order_number} - ${order.customers?.name}`,
        timestamp: order.created_at,
        status: 'nuevo'
      });
    });

    // Agregar incidencias
    incidents?.forEach(incident => {
      activities.push({
        id: incident.id,
        type: 'incident',
        title: 'Incidencia reportada',
        description: incident.title,
        timestamp: incident.created_at,
        status: 'reportado'
      });
    });

    // Ordenar por timestamp más reciente
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setRecentActivities(activities.slice(0, 5));
  };

  const fetchRecentOrders = async () => {
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        delivery_address,
        created_at,
        customers (name)
      `)
      .eq('seller_id', profile?.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (orders) {
      setRecentOrders(orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customers?.name || 'Cliente',
        total_amount: order.total_amount,
        status: order.status,
        delivery_address: order.delivery_address,
        created_at: order.created_at
      })));
    }
  };

  const fetchPendingDeliveries = async () => {
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select(`
        id,
        status,
        orders (
          order_number,
          delivery_address,
          customers (name)
        )
      `)
      .eq('cadete_id', profile?.user_id)
      .in('status', ['pendiente', 'en_camino'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (deliveries) {
      setPendingDeliveries(deliveries.map(delivery => ({
        id: delivery.id,
        order_number: delivery.orders?.order_number || '',
        customer_name: delivery.orders?.customers?.name || 'Cliente',
        delivery_address: delivery.orders?.delivery_address || '',
        status: delivery.status
      })));
    }
  };

  const getGerenciaDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-element animate-delay-100">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">Dashboard Gerencia</h1>
          <p className="text-muted-foreground mt-2">Resumen general del sistema logístico</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-800 smooth-transition">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 animate-element animate-delay-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* KPIs principales con nuevo estilo */}
          <div className="animate-element animate-delay-200">
            <Stats1 data={[
              {
                name: "Pedidos Totales",
                value: stats.totalOrders,
                change: stats.ordersToday > 0 ? `+${stats.ordersToday} hoy` : undefined,
                changeType: "positive"
              },
              {
                name: "Pedidos para Hoy",
                value: stats.ordersToday,
                change: stats.totalOrders > 0 ? `${Math.round((stats.ordersToday / stats.totalOrders) * 100)}% del total` : undefined,
                changeType: "positive"
              },
              {
                name: "Rutas Asignadas",
                value: stats.assignedRoutes,
                change: stats.activeRoutes > 0 ? `${stats.activeRoutes} activas` : "Sin rutas activas",
                changeType: stats.activeRoutes > 0 ? "positive" : "negative"
              },
              {
                name: "Pedidos en Camino",
                value: stats.ordersInTransit,
                change: stats.ordersInTransit > 0 ? "En proceso" : "Ninguno en ruta",
                changeType: stats.ordersInTransit > 0 ? "positive" : "negative"
              },
              {
                name: "Pedidos Entregados Hoy",
                value: stats.ordersDeliveredToday,
                change: stats.ordersToday > 0 ? `${Math.round((stats.ordersDeliveredToday / stats.ordersToday) * 100)}% de hoy` : undefined,
                changeType: "positive"
              },
              {
                name: "Pedidos Entregados Esta Semana",
                value: stats.ordersDeliveredThisWeek,
                change: "+12% vs semana anterior",
                changeType: "positive"
              },
              {
                name: "Pedidos Pendientes",
                value: stats.pendingOrders,
                change: stats.pendingOrders > 0 ? "Requieren atención" : "Todo al día",
                changeType: stats.pendingOrders > 0 ? "negative" : "positive"
              },
              {
                name: "Incidencias de Esta Semana",
                value: stats.incidentsThisWeek,
                change: stats.incidentsThisWeek > 0 ? `${stats.openIncidents} abiertas` : "Sin incidencias",
                changeType: stats.incidentsThisWeek > 0 ? "negative" : "positive"
              }
            ]} />
          </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    {activity.type === 'delivery' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {activity.type === 'order' && (
                      <Package className="h-4 w-4 text-blue-600" />
                    )}
                    {activity.type === 'incident' && (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay actividades recientes</p>
                </div>
              )}
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
      <div className="flex items-center justify-between animate-element animate-delay-100">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">Dashboard Vendedor</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus pedidos y clientes</p>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 smooth-transition">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 animate-element animate-delay-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="animate-element animate-delay-200 card-hover glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Pedidos Hoy</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myOrdersToday}</div>
                <p className="text-xs text-muted-foreground">Pedidos de hoy</p>
              </CardContent>
            </Card>

            <Card className="animate-element animate-delay-300 card-hover glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myPendingDeliveries}</div>
                <p className="text-xs text-muted-foreground">En proceso</p>
              </CardContent>
            </Card>

            <Card className="animate-element animate-delay-400 card-hover glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.myTodayRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Ingresos de hoy</p>
              </CardContent>
            </Card>

            <Card className="animate-element animate-delay-500 card-hover glass-card">
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
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{order.order_number} - {order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_address} - ${order.total_amount}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        order.status === 'entregado' ? 'bg-green-100 text-green-800' :
                        order.status === 'en_ruta' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'asignado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay pedidos recientes</p>
                </div>
              )}
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
      <div className="flex items-center justify-between animate-element animate-delay-100">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">Dashboard Cadete</h1>
          <p className="text-muted-foreground mt-2">Tu ruta de entregas de hoy</p>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-800 smooth-transition">
          <span className="capitalize">{profile?.role}</span>
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 animate-element animate-delay-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="animate-element animate-delay-200 card-hover glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregas Asignadas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assignedDeliveries}</div>
                <p className="text-xs text-muted-foreground">Total asignadas</p>
              </CardContent>
            </Card>

            <Card className="animate-element animate-delay-300 card-hover glass-card">
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

            <Card className="animate-element animate-delay-400 card-hover glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myPendingDeliveries_cadete}</div>
                <p className="text-xs text-muted-foreground">Restantes</p>
              </CardContent>
            </Card>

            <Card className="animate-element animate-delay-500 card-hover glass-card">
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
              {pendingDeliveries.length > 0 ? (
                pendingDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">#{delivery.order_number} - {delivery.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{delivery.delivery_address}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        delivery.status === 'en_camino' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }
                    >
                      {delivery.status === 'en_camino' ? 'En ruta' : 'Pendiente'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay entregas pendientes</p>
                </div>
              )}
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
    <div className="container mx-auto animate-element animate-delay-100">
      {getDashboard()}
    </div>
  );
}