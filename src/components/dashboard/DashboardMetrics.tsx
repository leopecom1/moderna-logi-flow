import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  ArrowUpRight,
  Calendar,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'stable';
  };
  progress?: {
    value: number;
    max: number;
    label: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onViewDetails?: () => void;
}

export const MetricCard = ({ 
  title, 
  value, 
  description, 
  trend, 
  progress, 
  icon, 
  color = 'blue',
  onViewDetails 
}: MetricCardProps) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
    orange: 'border-orange-200 bg-orange-50/50',
    red: 'border-red-200 bg-red-50/50',
    purple: 'border-purple-200 bg-purple-50/50'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  const getTrendIcon = () => {
    if (trend?.direction === 'up') return <TrendingUp className="h-3 w-3" />;
    if (trend?.direction === 'down') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend?.direction === 'up') return 'text-green-600 bg-green-100';
    if (trend?.direction === 'down') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <Card className={`relative overflow-hidden ${colorClasses[color]} border-l-4`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={`p-2 rounded-full bg-background/50 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <Badge variant="secondary" className={`text-xs ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="ml-1">{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          {trend && (
            <p className="text-xs text-muted-foreground">{trend.label}</p>
          )}

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progress.label}</span>
                <span className="font-medium">
                  {progress.value}/{progress.max}
                </span>
              </div>
              <Progress 
                value={(progress.value / progress.max) * 100} 
                className="h-2"
              />
            </div>
          )}

          {onViewDetails && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewDetails}
              className="w-full mt-3 justify-center"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver detalles
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface KPIGridProps {
  kpis: Array<{
    id: string;
    title: string;
    value: string | number;
    description?: string;
    trend?: {
      value: number;
      label: string;
      direction: 'up' | 'down' | 'stable';
    };
    progress?: {
      value: number;
      max: number;
      label: string;
    };
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
    onViewDetails?: () => void;
  }>;
  title?: string;
  columns?: 2 | 3 | 4;
}

export const KPIGrid = ({ kpis, title, columns = 4 }: KPIGridProps) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className={`grid gap-4 ${gridClasses[columns]}`}>
        {kpis.map((kpi) => (
          <MetricCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            trend={kpi.trend}
            progress={kpi.progress}
            icon={kpi.icon}
            color={kpi.color}
            onViewDetails={kpi.onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export const RealtimeActivityFeed = () => {
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchRecentActivities();
    
    // Configurar actualización en tiempo real cada 30 segundos
    const interval = setInterval(fetchRecentActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Obtener pedidos recientes
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, created_at, customer:customers(name)')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      // Obtener entregas recientes
      const { data: recentDeliveries } = await supabase
        .from('deliveries')
        .select('id, delivered_at, cadete_id, order:orders(order_number)')
        .eq('status', 'entregado')
        .gte('delivered_at', oneHourAgo.toISOString())
        .order('delivered_at', { ascending: false })
        .limit(3);

      // Obtener nombres de cadetes
      const cadeteIds = recentDeliveries?.map(d => d.cadete_id).filter(Boolean) || [];
      const { data: cadetes } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', cadeteIds);

      // Obtener incidencias recientes
      const { data: recentIncidents } = await supabase
        .from('incidents')
        .select('id, title, created_at')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(2);

      // Obtener cobros recientes
      const { data: recentCollections } = await supabase
        .from('collections')
        .select('id, amount, payment_method_type, created_at')
        .eq('collection_status', 'confirmado')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(2);

      const combinedActivities = [];

      // Agregar pedidos
      recentOrders?.forEach(order => {
        combinedActivities.push({
          id: `order-${order.id}`,
          type: 'order',
          message: 'Nuevo pedido creado',
          details: `Pedido #${order.order_number} - Cliente: ${order.customer?.name || 'N/A'}`,
          timestamp: getTimeAgo(order.created_at),
          icon: '📦',
          color: 'blue'
        });
      });

      // Agregar entregas
      recentDeliveries?.forEach(delivery => {
        const cadete = cadetes?.find(c => c.user_id === delivery.cadete_id);
        combinedActivities.push({
          id: `delivery-${delivery.id}`,
          type: 'delivery',
          message: 'Entrega completada',
          details: `Pedido #${delivery.order?.order_number} - Cadete: ${cadete?.full_name || 'N/A'}`,
          timestamp: getTimeAgo(delivery.delivered_at),
          icon: '✅',
          color: 'green'
        });
      });

      // Agregar incidencias
      recentIncidents?.forEach(incident => {
        combinedActivities.push({
          id: `incident-${incident.id}`,
          type: 'incident',
          message: 'Incidencia reportada',
          details: incident.title,
          timestamp: getTimeAgo(incident.created_at),
          icon: '⚠️',
          color: 'orange'
        });
      });

      // Agregar cobros
      recentCollections?.forEach(collection => {
        combinedActivities.push({
          id: `collection-${collection.id}`,
          type: 'payment',
          message: 'Pago confirmado',
          details: `$${collection.amount} - ${collection.payment_method_type}`,
          timestamp: getTimeAgo(collection.created_at),
          icon: '💰',
          color: 'green'
        });
      });

      // Ordenar por timestamp y limitar a 6 actividades
      combinedActivities.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setActivities(combinedActivities.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Fallback a datos demo si hay error
      setActivities([
        {
          id: 1,
          type: 'order',
          message: 'Sistema iniciado',
          details: 'Dashboard en funcionamiento',
          timestamp: 'Ahora',
          icon: '🚀',
          color: 'blue'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Actividad en Tiempo Real
        </CardTitle>
        <CardDescription>
          Últimas actualizaciones del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="text-lg">{activity.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.details}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No hay actividad reciente
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full mt-4">
          Ver todas las actividades
        </Button>
      </CardContent>
    </Card>
  );
};