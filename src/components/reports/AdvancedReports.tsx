import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesChart, RevenueChart, PerformanceMetrics } from '@/components/ui/charts';
import { ExportManager } from './ExportManager';
import { RealtimeAnalytics } from './RealtimeAnalytics';
import { CustomReportBuilder } from './CustomReportBuilder';
import { toast } from '@/hooks/use-toast';
import { 
  Download, 
  TrendingUp, 
  Users, 
  Package, 
  Truck, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Settings
} from 'lucide-react';

interface AdvancedReportData {
  ordersByPeriod: any[];
  revenueData: any[];
  customerMetrics: any[];
  deliveryPerformance: any[];
  productOrders: any[];
  cadetePerformance: any[];
}

export const AdvancedReports = () => {
  const [reportData, setReportData] = useState<AdvancedReportData>({
    ordersByPeriod: [],
    revenueData: [],
    customerMetrics: [],
    deliveryPerformance: [],
    productOrders: [],
    cadetePerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('30');
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    fetchAdvancedReportData();
  }, [timeFrame]);

  const fetchAdvancedReportData = async () => {
    try {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeFrame));

      // Datos de ventas por período
      const ordersByPeriod = await fetchOrdersByPeriod(daysAgo);
      
      // Datos de ingresos
      const revenueData = await fetchRevenueData(daysAgo);
      
      // Métricas de clientes
      const customerMetrics = await fetchCustomerMetrics(daysAgo);
      
      // Rendimiento de entregas
      const deliveryPerformance = await fetchDeliveryPerformance(daysAgo);
      
      // Ventas por producto
      const productOrders = await fetchProductOrders(daysAgo);
      
      // Rendimiento de cadetes
      const cadetePerformance = await fetchCadetePerformance(daysAgo);

      setReportData({
        ordersByPeriod,
        revenueData,
        customerMetrics,
        deliveryPerformance,
        productOrders,
        cadetePerformance
      });

    } catch (error) {
      console.error('Error fetching advanced report data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del reporte avanzado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersByPeriod = async (startDate: Date) => {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, products')
      .gte('created_at', startDate.toISOString());

    if (!orders) return [];

    // Agrupar por semana
    const weeklyData = orders.reduce((acc: any, order) => {
      const date = new Date(order.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = { amount: 0, quantity: 0 };
      }
      acc[weekKey].amount += Number(order.total_amount);
      // Para productos parseamos el JSON si existe
      try {
        const products = typeof order.products === 'string' 
          ? JSON.parse(order.products) 
          : order.products;
        if (Array.isArray(products)) {
          acc[weekKey].quantity += products.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0);
        } else {
          acc[weekKey].quantity += 1;
        }
      } catch {
        acc[weekKey].quantity += 1;
      }
      
      return acc;
    }, {});

    return Object.entries(weeklyData).map(([week, data]: [string, any]) => ({
      name: `Semana ${week}`,
      value: data.amount,
      quantity: data.quantity,
      percentage: 0 // Se calculará después
    }));
  };

  const fetchRevenueData = async (startDate: Date) => {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', startDate.toISOString());

    if (!orders) return [];

    // Agrupar por mes
    const monthlyData = orders.reduce((acc: any, order) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { revenue: 0, orders: 0 };
      }
      acc[monthKey].revenue += Number(order.total_amount);
      acc[monthKey].orders += 1;
      
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, data]: [string, any], index, arr) => {
      const prevData = index > 0 ? (arr[index - 1][1] as any) : null;
      const growth = prevData ? ((data.revenue - prevData.revenue) / prevData.revenue) * 100 : 0;
      
      return {
        period: month,
        revenue: data.revenue,
        orders: data.orders,
        growth: Math.round(growth)
      };
    });
  };

  const fetchCustomerMetrics = async (startDate: Date) => {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, city')
      .gte('created_at', startDate.toISOString());

    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id, total_amount')
      .gte('created_at', startDate.toISOString());

    if (!customers || !orders) return [];

    // Agrupar por ciudad
    const cityData = customers.reduce((acc: any, customer) => {
      const city = customer.city || 'Sin especificar';
      if (!acc[city]) {
        acc[city] = 0;
      }
      acc[city] += 1;
      return acc;
    }, {});

    return Object.entries(cityData).map(([city, count]: [string, any]) => ({
      name: city,
      value: count,
      color: 'bg-blue-500'
    }));
  };

  const fetchDeliveryPerformance = async (startDate: Date) => {
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('status, delivered_at, attempted_at')
      .gte('created_at', startDate.toISOString());

    if (!deliveries) return [];

    const statusCounts = deliveries.reduce((acc: any, delivery) => {
      const status = delivery.status;
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += 1;
      return acc;
    }, {});

    const statusLabels: { [key: string]: string } = {
      pendiente: 'Pendientes',
      en_camino: 'En Camino',
      entregado: 'Entregadas',
      fallido: 'Fallidas'
    };

    return Object.entries(statusCounts).map(([status, count]: [string, any]) => ({
      name: statusLabels[status] || status,
      value: count,
      target: Math.max(20, count), // Target dinámico
      unit: '',
      trend: 'stable' as const
    }));
  };

  const fetchProductOrders = async (startDate: Date) => {
    const { data: orders } = await supabase
      .from('orders')
      .select('products, total_amount')
      .gte('created_at', startDate.toISOString());

    if (!orders) return [];

    const productData: { [key: string]: { quantity: number; revenue: number } } = {};
    
    orders.forEach(order => {
      try {
        const products = typeof order.products === 'string' 
          ? JSON.parse(order.products) 
          : order.products;
        
        if (Array.isArray(products)) {
          products.forEach((product: any) => {
            const productName = product.product_name || product.name || 'Producto desconocido';
            if (!productData[productName]) {
              productData[productName] = { quantity: 0, revenue: 0 };
            }
            productData[productName].quantity += product.quantity || 1;
            productData[productName].revenue += (product.quantity || 1) * (product.unit_price || 0);
          });
        }
      } catch {
        // Si no se puede parsear, tratamos como un producto genérico
        if (!productData['Producto genérico']) {
          productData['Producto genérico'] = { quantity: 0, revenue: 0 };
        }
        productData['Producto genérico'].quantity += 1;
        productData['Producto genérico'].revenue += Number(order.total_amount);
      }
    });

    return Object.entries(productData)
      .map(([name, data]) => ({
        name,
        value: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 productos
  };

  const fetchCadetePerformance = async (startDate: Date) => {
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select(`
        status,
        delivered_at,
        profiles:cadete_id (
          full_name
        )
      `)
      .gte('created_at', startDate.toISOString());

    if (!deliveries) return [];

    const cadeteData = deliveries.reduce((acc: any, delivery) => {
      const cadeteName = (delivery.profiles as any)?.full_name || 'Cadete desconocido';
      if (!acc[cadeteName]) {
        acc[cadeteName] = { completed: 0, total: 0 };
      }
      acc[cadeteName].total += 1;
      if (delivery.status === 'entregado') {
        acc[cadeteName].completed += 1;
      }
      return acc;
    }, {});

    return Object.entries(cadeteData).map(([name, data]: [string, any]) => ({
      name,
      value: data.completed,
      target: data.total,
      unit: `/${data.total}`,
      trend: data.completed / data.total > 0.8 ? 'up' : 'down' as const
    }));
  };

  const exportReport = (reportType: string) => {
    // Implementar exportación a CSV/PDF
    toast({
      title: 'Exportando reporte',
      description: `Exportando reporte de ${reportType}...`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes Avanzados</h2>
          <p className="text-muted-foreground">Análisis detallado del rendimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="90">3 meses</SelectItem>
              <SelectItem value="365">1 año</SelectItem>
            </SelectContent>
          </Select>
          <ExportManager />
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="delivery">Entregas</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="realtime">Tiempo Real</TabsTrigger>
          <TabsTrigger value="builder">Constructor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesChart
              data={reportData.productOrders}
              title="Productos Más Vendidos"
              description="Top 10 productos por cantidad vendida"
              onExport={() => exportReport('productos')}
            />
            <RevenueChart
              data={reportData.revenueData}
              title="Ingresos por Período"
              onExport={() => exportReport('ingresos')}
            />
          </div>
          <SalesChart
            data={reportData.customerMetrics}
            title="Distribución de Clientes por Ciudad"
            description="Análisis geográfico de la base de clientes"
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesChart
              data={reportData.ordersByPeriod}
              title="Pedidos por Período"
              description="Tendencia de pedidos semanales"
              period={timeFrame}
              onPeriodChange={setTimeFrame}
              onExport={() => exportReport('pedidos')}
            />
            <SalesChart
              data={reportData.productOrders}
              title="Top Productos"
              description="Productos con mejor rendimiento"
            />
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <PerformanceMetrics
            metrics={reportData.deliveryPerformance}
            title="Métricas de Entrega"
          />
          <PerformanceMetrics
            metrics={reportData.cadetePerformance}
            title="Rendimiento de Cadetes"
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceMetrics
              metrics={reportData.cadetePerformance}
              title="Eficiencia de Cadetes"
            />
            <PerformanceMetrics
              metrics={reportData.deliveryPerformance}
              title="Estados de Entrega"
            />
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealtimeAnalytics />
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <CustomReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
};