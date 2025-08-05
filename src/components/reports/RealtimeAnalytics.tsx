import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Package,
  Truck,
  AlertTriangle,
  DollarSign,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface RealtimeMetric {
  label: string;
  value: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface LiveActivity {
  id: string;
  type: 'order' | 'delivery' | 'payment' | 'incident';
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export const RealtimeAnalytics = () => {
  const [metrics, setMetrics] = useState<RealtimeMetric[]>([]);
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchRealtimeData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchRealtimeData, 30000);
    
    // Configurar suscripciones en tiempo real
    setupRealtimeSubscriptions();
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchRealtimeData = async () => {
    try {
      setIsRefreshing(true);
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Métricas de la última hora vs hora anterior
      const [currentHourData, previousHourData] = await Promise.all([
        fetchHourlyMetrics(oneHourAgo, now),
        fetchHourlyMetrics(new Date(oneHourAgo.getTime() - 60 * 60 * 1000), oneHourAgo)
      ]);

      const newMetrics: RealtimeMetric[] = [
        {
          label: 'Pedidos/Hora',
          value: currentHourData.orders,
          previousValue: previousHourData.orders,
          trend: getTrend(currentHourData.orders, previousHourData.orders),
          percentage: getPercentageChange(currentHourData.orders, previousHourData.orders),
          icon: Package,
          color: 'text-blue-600'
        },
        {
          label: 'Entregas/Hora',
          value: currentHourData.deliveries,
          previousValue: previousHourData.deliveries,
          trend: getTrend(currentHourData.deliveries, previousHourData.deliveries),
          percentage: getPercentageChange(currentHourData.deliveries, previousHourData.deliveries),
          icon: Truck,
          color: 'text-green-600'
        },
        {
          label: 'Ingresos/Hora',
          value: currentHourData.revenue,
          previousValue: previousHourData.revenue,
          trend: getTrend(currentHourData.revenue, previousHourData.revenue),
          percentage: getPercentageChange(currentHourData.revenue, previousHourData.revenue),
          icon: DollarSign,
          color: 'text-yellow-600'
        },
        {
          label: 'Incidencias',
          value: currentHourData.incidents,
          previousValue: previousHourData.incidents,
          trend: getTrend(currentHourData.incidents, previousHourData.incidents, true),
          percentage: getPercentageChange(currentHourData.incidents, previousHourData.incidents),
          icon: AlertTriangle,
          color: 'text-red-600'
        }
      ];

      setMetrics(newMetrics);
      setLastUpdate(new Date());
      
      // Obtener actividades recientes
      await fetchRecentActivities();
      
    } catch (error) {
      console.error('Error fetching realtime data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchHourlyMetrics = async (startTime: Date, endTime: Date) => {
    const [ordersRes, deliveriesRes, incidentsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startTime.toISOString())
        .lt('created_at', endTime.toISOString()),
      
      supabase
        .from('deliveries')
        .select('status')
        .gte('created_at', startTime.toISOString())
        .lt('created_at', endTime.toISOString())
        .eq('status', 'entregado'),
      
      supabase
        .from('incidents')
        .select('status')
        .gte('created_at', startTime.toISOString())
        .lt('created_at', endTime.toISOString())
        .eq('status', 'abierto')
    ]);

    return {
      orders: ordersRes.data?.length || 0,
      deliveries: deliveriesRes.data?.length || 0,
      revenue: ordersRes.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
      incidents: incidentsRes.data?.length || 0
    };
  };

  const fetchRecentActivities = async () => {
    try {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      
      const [orders, deliveries, incidents] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, status, created_at, customers:customer_id(name)')
          .gte('created_at', twentyMinutesAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('deliveries')
          .select('id, status, delivered_at, orders:order_id(order_number)')
          .gte('updated_at', twentyMinutesAgo.toISOString())
          .eq('status', 'entregado')
          .order('updated_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('incidents')
          .select('id, title, status, created_at')
          .gte('created_at', twentyMinutesAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const newActivities: LiveActivity[] = [
        ...(orders.data?.map(order => ({
          id: `order-${order.id}`,
          type: 'order' as const,
          message: `Nuevo pedido ${order.order_number} de ${(order.customers as any)?.name || 'Cliente'}`,
          timestamp: new Date(order.created_at),
          priority: 'medium' as const
        })) || []),
        
        ...(deliveries.data?.map(delivery => ({
          id: `delivery-${delivery.id}`,
          type: 'delivery' as const,
          message: `Entrega completada: ${(delivery.orders as any)?.order_number || 'Pedido'}`,
          timestamp: new Date(delivery.delivered_at || new Date()),
          priority: 'high' as const
        })) || []),
        
        ...(incidents.data?.map(incident => ({
          id: `incident-${incident.id}`,
          type: 'incident' as const,
          message: `Nueva incidencia: ${incident.title}`,
          timestamp: new Date(incident.created_at),
          priority: 'high' as const
        })) || [])
      ];

      newActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(newActivities.slice(0, 20));
      
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Suscribirse a cambios en tiempo real
    const ordersSubscription = supabase
      .channel('realtime-orders')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' }, 
        (payload) => {
          // Actualizar métricas cuando hay nuevos pedidos
          fetchRealtimeData();
        }
      )
      .subscribe();

    const deliveriesSubscription = supabase
      .channel('realtime-deliveries')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'deliveries' }, 
        (payload) => {
          if (payload.new.status === 'entregado') {
            fetchRealtimeData();
          }
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      deliveriesSubscription.unsubscribe();
    };
  };

  const getTrend = (current: number, previous: number, inverted = false): 'up' | 'down' | 'stable' => {
    if (current === previous) return 'stable';
    const isUp = current > previous;
    if (inverted) return isUp ? 'down' : 'up';
    return isUp ? 'up' : 'down';
  };

  const getPercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getActivityIcon = (type: LiveActivity['type']) => {
    switch (type) {
      case 'order': return Package;
      case 'delivery': return Truck;
      case 'payment': return DollarSign;
      case 'incident': return AlertTriangle;
    }
  };

  const getActivityColor = (priority: LiveActivity['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `Hace ${diffHours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Análisis en Tiempo Real
          </h2>
          <p className="text-muted-foreground">
            Monitoreo en vivo de tu operación
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchRealtimeData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">Métricas Live</TabsTrigger>
          <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.label}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metric.label.includes('Ingresos') ? `$${metric.value.toFixed(2)}` : metric.value}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      ) : metric.trend === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      ) : (
                        <BarChart3 className="h-3 w-3 text-gray-600 mr-1" />
                      )}
                      {Math.abs(metric.percentage)}% vs hora anterior
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad en Vivo</CardTitle>
              <CardDescription>
                Eventos de los últimos 20 minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay actividad reciente</p>
                  </div>
                ) : (
                  activities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                        <Badge variant={getActivityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};