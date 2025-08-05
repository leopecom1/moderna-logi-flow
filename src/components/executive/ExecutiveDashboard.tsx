import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Truck, Star, AlertTriangle, CheckCircle, Target, Calendar, Clock } from 'lucide-react';

interface ExecutiveMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    target: number;
  };
  customers: {
    total: number;
    new: number;
    retained: number;
    churn: number;
  };
  operations: {
    orders_completed: number;
    on_time_delivery: number;
    avg_delivery_time: number;
    customer_satisfaction: number;
  };
  financial: {
    profit_margin: number;
    operational_costs: number;
    revenue_per_customer: number;
    cost_per_delivery: number;
  };
}

interface KPICard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  target: number;
  previous_year: number;
}

interface RegionalPerformance {
  region: string;
  revenue: number;
  orders: number;
  satisfaction: number;
  growth: number;
}

export const ExecutiveDashboard = () => {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    const generateExecutiveData = () => {
      // Generate executive metrics
      const executiveMetrics: ExecutiveMetrics = {
        revenue: {
          current: 485000,
          previous: 420000,
          growth: 15.5,
          target: 500000
        },
        customers: {
          total: 2847,
          new: 156,
          retained: 2691,
          churn: 2.3
        },
        operations: {
          orders_completed: 12459,
          on_time_delivery: 94.2,
          avg_delivery_time: 42,
          customer_satisfaction: 4.6
        },
        financial: {
          profit_margin: 18.5,
          operational_costs: 395000,
          revenue_per_customer: 170.4,
          cost_per_delivery: 12.8
        }
      };

      // Generate revenue trend data
      const revenueHistory: RevenueData[] = [
        { month: 'Ene', revenue: 380000, target: 400000, previous_year: 320000 },
        { month: 'Feb', revenue: 420000, target: 420000, previous_year: 350000 },
        { month: 'Mar', revenue: 450000, target: 440000, previous_year: 380000 },
        { month: 'Abr', revenue: 465000, target: 450000, previous_year: 390000 },
        { month: 'May', revenue: 485000, target: 480000, previous_year: 420000 },
        { month: 'Jun', revenue: 485000, target: 500000, previous_year: 420000 }
      ];

      // Generate regional performance
      const regionalPerformance: RegionalPerformance[] = [
        { region: 'Centro', revenue: 185000, orders: 4250, satisfaction: 4.7, growth: 18.2 },
        { region: 'Norte', revenue: 142000, orders: 3100, satisfaction: 4.5, growth: 12.8 },
        { region: 'Sur', revenue: 98000, orders: 2890, satisfaction: 4.4, growth: 15.1 },
        { region: 'Este', revenue: 60000, orders: 2219, satisfaction: 4.6, growth: 22.3 }
      ];

      setMetrics(executiveMetrics);
      setRevenueData(revenueHistory);
      setRegionalData(regionalPerformance);
      setLoading(false);
    };

    generateExecutiveData();
  }, [timeframe]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpiCards: KPICard[] = [
    {
      title: 'Ingresos Mensuales',
      value: `$${metrics.revenue.current.toLocaleString()}`,
      change: metrics.revenue.growth,
      trend: 'up',
      target: `Meta: $${metrics.revenue.target.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Clientes Totales',
      value: metrics.customers.total.toLocaleString(),
      change: ((metrics.customers.new / metrics.customers.total) * 100),
      trend: 'up',
      target: `+${metrics.customers.new} nuevos`,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Pedidos Completados',
      value: metrics.operations.orders_completed.toLocaleString(),
      change: metrics.operations.on_time_delivery,
      trend: 'up',
      target: `${metrics.operations.on_time_delivery}% a tiempo`,
      icon: Package,
      color: 'text-purple-600'
    },
    {
      title: 'Satisfacción Cliente',
      value: `${metrics.operations.customer_satisfaction}/5`,
      change: 12.5,
      trend: 'up',
      target: 'Meta: 4.8/5',
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: 'Margen de Beneficio',
      value: `${metrics.financial.profit_margin}%`,
      change: 2.3,
      trend: 'up',
      target: 'Meta: 20%',
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'Costo por Entrega',
      value: `$${metrics.financial.cost_per_delivery}`,
      change: -8.2,
      trend: 'down',
      target: 'Meta: $10',
      icon: Truck,
      color: 'text-orange-600'
    }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      {/* Header with Time Frame Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Ejecutivo</h2>
          <p className="text-muted-foreground">
            Métricas estratégicas y KPIs de alto nivel
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period === 'week' && 'Semana'}
              {period === 'month' && 'Mes'}
              {period === 'quarter' && 'Trimestre'}
              {period === 'year' && 'Año'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center text-xs">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  ) : null}
                  <span className={kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                    {Math.abs(kpi.change)}%
                  </span>
                </div>
                {kpi.target && (
                  <span className="text-xs text-muted-foreground">{kpi.target}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Ingresos</CardTitle>
            <CardDescription>
              Comparación con año anterior y metas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, '']} />
                <Area 
                  type="monotone" 
                  dataKey="previous_year" 
                  stackId="1" 
                  stroke="#94a3b8" 
                  fill="#94a3b8" 
                  fillOpacity={0.3}
                  name="Año Anterior"
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="2" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Actual"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ff7300" 
                  strokeDasharray="5 5"
                  name="Meta"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Desempeño por Región</CardTitle>
            <CardDescription>
              Ingresos y satisfacción por área geográfica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Ingresos" />
                <Line yAxisId="right" dataKey="satisfaction" stroke="#82ca9d" name="Satisfacción" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Health */}
        <Card>
          <CardHeader>
            <CardTitle>Salud Financiera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Margen de Beneficio</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(metrics.financial.profit_margin / 25) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{metrics.financial.profit_margin}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Ingreso por Cliente</span>
                <span className="text-sm font-medium">${metrics.financial.revenue_per_customer}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Costos Operacionales</span>
                <span className="text-sm font-medium">${metrics.financial.operational_costs.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Retenidos', value: metrics.customers.retained },
                    { name: 'Nuevos', value: metrics.customers.new }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tasa de Retención</span>
                <span className="font-medium">{((metrics.customers.retained / metrics.customers.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tasa de Abandono</span>
                <span className="font-medium">{metrics.customers.churn}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Excellence */}
        <Card>
          <CardHeader>
            <CardTitle>Excelencia Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Entregas a Tiempo</span>
                  <span>{metrics.operations.on_time_delivery}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics.operations.on_time_delivery}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Satisfacción Cliente</span>
                  <span>{metrics.operations.customer_satisfaction}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.operations.customer_satisfaction / 5) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Tiempo Promedio Entrega</span>
                <span className="font-medium">{metrics.operations.avg_delivery_time} min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas Ejecutivas</CardTitle>
          <CardDescription>
            Notificaciones importantes que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Meta de Ingresos Alcanzada</h4>
                <p className="text-sm text-muted-foreground">
                  Se superó la meta mensual de ingresos en un 3%. Excelente desempeño del equipo comercial.
                </p>
                <Badge variant="outline" className="mt-2">Hoy</Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-yellow-50">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Satisfacción Cliente en Zona Sur</h4>
                <p className="text-sm text-muted-foreground">
                  La satisfacción en la zona sur ha bajado a 4.4. Revisar operaciones y tiempos de entrega.
                </p>
                <Badge variant="outline" className="mt-2">Hace 2 horas</Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Oportunidad de Expansión</h4>
                <p className="text-sm text-muted-foreground">
                  El análisis predictivo sugiere expandir operaciones en la zona este para aprovechar el crecimiento del 22%.
                </p>
                <Badge variant="outline" className="mt-2">Ayer</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};