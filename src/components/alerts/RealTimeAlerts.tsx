import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Bell, Zap } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  data?: any;
}

interface SystemAlert {
  pendingOrdersCount: number;
  failedDeliveriesCount: number;
  openIncidentsCount: number;
  lowPerformanceRoutes: number;
  urgentNotifications: number;
}

export const RealTimeAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert>({
    pendingOrdersCount: 0,
    failedDeliveriesCount: 0,
    openIncidentsCount: 0,
    lowPerformanceRoutes: 0,
    urgentNotifications: 0
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchSystemAlerts();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchSystemAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSystemAlerts = async () => {
    try {
      setLoading(true);
      
      // Obtener alertas del sistema según el rol
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Pedidos pendientes
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pendiente')
        .gte('created_at', startOfDay.toISOString());

      // Entregas fallidas hoy
      const { data: failedDeliveries } = await supabase
        .from('deliveries')
        .select('id')
        .eq('status', 'no_entregado')
        .gte('attempted_at', startOfDay.toISOString());

      // Incidencias abiertas
      const { data: openIncidents } = await supabase
        .from('incidents')
        .select('id')
        .eq('status', 'abierto');

      // Notificaciones no leídas urgentes
      const { data: urgentNotifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('read', false)
        .in('type', ['entrega_fallida', 'problema_pedido', 'incidencia_creada']);

      setSystemAlerts({
        pendingOrdersCount: pendingOrders?.length || 0,
        failedDeliveriesCount: failedDeliveries?.length || 0,
        openIncidentsCount: openIncidents?.length || 0,
        lowPerformanceRoutes: 0, // TODO: Calcular rutas con bajo rendimiento
        urgentNotifications: urgentNotifications?.length || 0
      });

      // Generar alertas basadas en los datos
      generateAlerts({
        pendingOrdersCount: pendingOrders?.length || 0,
        failedDeliveriesCount: failedDeliveries?.length || 0,
        openIncidentsCount: openIncidents?.length || 0,
        lowPerformanceRoutes: 0,
        urgentNotifications: urgentNotifications?.length || 0
      });

    } catch (error) {
      console.error('Error fetching system alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (data: SystemAlert) => {
    const newAlerts: Alert[] = [];
    const now = new Date().toISOString();

    // Alertas críticas
    if (data.failedDeliveriesCount > 0) {
      newAlerts.push({
        id: 'failed-deliveries',
        type: 'critical',
        title: 'Entregas fallidas detectadas',
        message: `${data.failedDeliveriesCount} entregas han fallado hoy. Requiere atención inmediata.`,
        timestamp: now,
        resolved: false
      });
    }

    if (data.openIncidentsCount > 5) {
      newAlerts.push({
        id: 'high-incidents',
        type: 'critical',
        title: 'Alto número de incidencias',
        message: `Hay ${data.openIncidentsCount} incidencias abiertas. Revisa y resuelve las más urgentes.`,
        timestamp: now,
        resolved: false
      });
    }

    // Alertas de advertencia
    if (data.pendingOrdersCount > 10) {
      newAlerts.push({
        id: 'pending-orders',
        type: 'warning',
        title: 'Muchos pedidos pendientes',
        message: `Hay ${data.pendingOrdersCount} pedidos sin asignar. Considera asignar más recursos.`,
        timestamp: now,
        resolved: false
      });
    }

    if (data.urgentNotifications > 0) {
      newAlerts.push({
        id: 'urgent-notifications',
        type: 'warning',
        title: 'Notificaciones urgentes',
        message: `Tienes ${data.urgentNotifications} notificaciones urgentes sin leer.`,
        timestamp: now,
        resolved: false
      });
    }

    // Alertas informativas
    if (data.pendingOrdersCount === 0 && data.failedDeliveriesCount === 0 && data.openIncidentsCount === 0) {
      newAlerts.push({
        id: 'all-good',
        type: 'success',
        title: 'Todo funcionando correctamente',
        message: 'No hay alertas críticas en este momento. ¡Buen trabajo!',
        timestamp: now,
        resolved: false
      });
    }

    setAlerts(newAlerts);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.type === 'critical');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Alertas del Sistema
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSystemAlerts}
            disabled={loading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Resumen de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-orange-600">{systemAlerts.pendingOrdersCount}</div>
            <div className="text-xs text-muted-foreground">Pedidos Pendientes</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-red-600">{systemAlerts.failedDeliveriesCount}</div>
            <div className="text-xs text-muted-foreground">Entregas Fallidas</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-yellow-600">{systemAlerts.openIncidentsCount}</div>
            <div className="text-xs text-muted-foreground">Incidencias Abiertas</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-purple-600">{systemAlerts.urgentNotifications}</div>
            <div className="text-xs text-muted-foreground">Notif. Urgentes</div>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-3">
          {unresolvedAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Todo bajo control</h3>
              <p className="text-muted-foreground">No hay alertas activas en este momento</p>
            </div>
          ) : (
            unresolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  p-4 rounded-lg border transition-all duration-200
                  ${alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                    alert.type === 'success' ? 'border-green-200 bg-green-50' :
                    'border-blue-200 bg-blue-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                          {alert.type === 'critical' ? 'Crítico' :
                           alert.type === 'warning' ? 'Advertencia' :
                           alert.type === 'success' ? 'Éxito' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Hace {Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 60000)} min</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                    className="text-xs"
                  >
                    Resolver
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};