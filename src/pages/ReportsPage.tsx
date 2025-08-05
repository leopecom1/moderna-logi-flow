import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedReports } from '@/components/reports/AdvancedReports';
import { toast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Package, Truck, DollarSign, AlertTriangle, Calendar, Activity } from 'lucide-react';

interface ReportStats {
  totalOrders: number;
  pendingOrders: number;
  completedDeliveries: number;
  totalRevenue: number;
  openIncidents: number;
  activeRoutes: number;
}

const ReportsPage = () => {
  const [stats, setStats] = useState<ReportStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedDeliveries: 0,
    totalRevenue: 0,
    openIncidents: 0,
    activeRoutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('30'); // días

  useEffect(() => {
    fetchReportData();
  }, [timeFrame]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeFrame));

      // Obtener estadísticas de pedidos
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', daysAgo.toISOString());

      if (ordersError) throw ordersError;

      // Obtener estadísticas de entregas
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('status')
        .gte('created_at', daysAgo.toISOString());

      if (deliveriesError) throw deliveriesError;

      // Obtener estadísticas de incidencias
      const { data: incidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('status')
        .gte('created_at', daysAgo.toISOString());

      if (incidentsError) throw incidentsError;

      // Obtener rutas activas
      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select('end_time')
        .gte('route_date', daysAgo.toISOString().split('T')[0])
        .is('end_time', null);

      if (routesError) throw routesError;

      // Calcular estadísticas
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pendiente').length || 0;
      const completedDeliveries = deliveries?.filter(d => d.status === 'entregado').length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const openIncidents = incidents?.filter(i => i.status === 'abierto').length || 0;
      const activeRoutes = routes?.length || 0;

      setStats({
        totalOrders,
        pendingOrders,
        completedDeliveries,
        totalRevenue,
        openIncidents,
        activeRoutes,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del reporte',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCompletionRate = () => {
    if (stats.totalOrders === 0) return 0;
    return Math.round((stats.completedDeliveries / stats.totalOrders) * 100);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-muted-foreground">Analiza el rendimiento de tu negocio</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="advanced">Reportes Avanzados</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas Completadas</CardTitle>
              <Truck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                {getCompletionRate()}% tasa de éxito
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0'} por pedido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incidencias Abiertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openIncidents}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rutas Activas</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRoutes}</div>
              <p className="text-xs text-muted-foreground">
                En progreso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCompletionRate()}%</div>
              <p className="text-xs text-muted-foreground">
                Tasa de entrega exitosa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secciones de Reportes Detallados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Entregas</CardTitle>
              <CardDescription>
                Análisis del estado de las entregas en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tasa de Éxito</span>
                  <span className="text-2xl font-bold text-green-600">{getCompletionRate()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${getCompletionRate()}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Entregas exitosas</p>
                    <p className="font-semibold">{stats.completedDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total de pedidos</p>
                    <p className="font-semibold">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
              <CardDescription>
                Estado financiero en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ingresos Totales</span>
                  <span className="text-2xl font-bold text-blue-600">${stats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor promedio</p>
                    <p className="font-semibold">
                      ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total de pedidos</p>
                    <p className="font-semibold">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

            {stats.totalOrders === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay datos para mostrar</h3>
                <p className="text-muted-foreground">
                  No se encontraron datos para el período seleccionado
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedReports />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ReportsPage;