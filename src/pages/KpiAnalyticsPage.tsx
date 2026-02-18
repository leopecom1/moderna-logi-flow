import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalesKPIs } from '@/components/analytics/SalesKPIs';
import { CustomerKPIs } from '@/components/analytics/CustomerKPIs';
import { FinanceKPIs } from '@/components/analytics/FinanceKPIs';
import { OperationsKPIs } from '@/components/analytics/OperationsKPIs';
import {
  subDays, subMonths, startOfYear, format, startOfDay, endOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp, Users, ShoppingCart, Truck, DollarSign,
  AlertTriangle, CheckCircle, BarChart3
} from 'lucide-react';

type Period = 'today' | '7d' | '30d' | '90d' | 'year';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: 'year', label: 'Este año' },
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(val);

const getDateRange = (period: Period): { startDate: Date; endDate: Date; prevStartDate: Date; prevEndDate: Date } => {
  const now = new Date();
  const endDate = endOfDay(now);
  let startDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;

  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      prevStartDate = startOfDay(subDays(now, 1));
      prevEndDate = endOfDay(subDays(now, 1));
      break;
    case '7d':
      startDate = subDays(now, 7);
      prevStartDate = subDays(now, 14);
      prevEndDate = subDays(now, 7);
      break;
    case '30d':
      startDate = subDays(now, 30);
      prevStartDate = subDays(now, 60);
      prevEndDate = subDays(now, 30);
      break;
    case '90d':
      startDate = subDays(now, 90);
      prevStartDate = subDays(now, 180);
      prevEndDate = subDays(now, 90);
      break;
    case 'year':
      startDate = startOfYear(now);
      prevStartDate = startOfYear(new Date(now.getFullYear() - 1, 0, 1));
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
  }
  return { startDate, endDate, prevStartDate, prevEndDate };
};

export default function KpiAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => getDateRange(period), [period]);

  // === Data queries ===
  const { data: orders = [] } = useQuery({
    queryKey: ['kpi-orders', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status, payment_method, customer_id, cadete_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');
      return data || [];
    }
  });

  const { data: prevOrders = [] } = useQuery({
    queryKey: ['kpi-prev-orders', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status, payment_method, customer_id')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());
      return data || [];
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['kpi-customers'],
    queryFn: async () => {
      const { data } = await supabase.from('customers').select('id, name, created_at').order('created_at');
      return data || [];
    }
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['kpi-collections', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('collections')
        .select('id, amount, collection_date, payment_method_type, collection_status')
        .gte('collection_date', format(startDate, 'yyyy-MM-dd'))
        .lte('collection_date', format(endDate, 'yyyy-MM-dd'));
      return data || [];
    }
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['kpi-payments', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('id, amount, status, payment_method, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      return data || [];
    }
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['kpi-purchases', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchases')
        .select('id, total_amount, created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      return data || [];
    }
  });

  const { data: accountsReceivable = [] } = useQuery({
    queryKey: ['kpi-accounts-receivable'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts_receivable').select('customer_id, balance_due');
      return data || [];
    }
  });

  const { data: creditInstallments = [] } = useQuery({
    queryKey: ['kpi-credit-installments', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('credit_moderna_installments')
        .select('id, amount, paid_amount, status, due_date, created_at');
      return data || [];
    }
  });

  const { data: cardLiquidations = [] } = useQuery({
    queryKey: ['kpi-card-liquidations', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('card_liquidations')
        .select('id, amount, status, liquidation_date');
      return data || [];
    }
  });

  const { data: pettyCashExpenses = [] } = useQuery({
    queryKey: ['kpi-petty-cash', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('petty_cash_expenses')
        .select('id, amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      return data || [];
    }
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ['kpi-deliveries', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('id, status, cadete_id, order_id, created_at, delivered_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      return data || [];
    }
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['kpi-incidents', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('incidents')
        .select('id, status, incident_type, created_at, resolved_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      return data || [];
    }
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['kpi-routes'],
    queryFn: async () => {
      const { data } = await supabase.from('routes').select('id, status, created_at');
      return data || [];
    }
  });

  // === Summary KPIs ===
  const summary = useMemo(() => {
    const totalSales = orders.reduce((s: number, o: any) => s + o.total_amount, 0);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaySales = orders.filter((o: any) => o.created_at.startsWith(todayStr)).reduce((s: number, o: any) => s + o.total_amount, 0);
    const avgTicket = orders.length > 0 ? totalSales / orders.length : 0;
    const activeCustomerIds = new Set(orders.map((o: any) => o.customer_id));
    const totalDebt = accountsReceivable.reduce((s: number, ar: any) => s + (ar.balance_due || 0), 0);
    const deliveredCount = deliveries.filter((d: any) => d.status === 'entregado').length;
    const deliveryRate = deliveries.length > 0 ? (deliveredCount / deliveries.length) * 100 : 0;
    const openIncidents = incidents.filter((i: any) => i.status === 'abierto').length;
    const pendingOrders = orders.filter((o: any) => o.status === 'pendiente').length;

    return { totalSales, todaySales, avgTicket, activeCustomers: activeCustomerIds.size, totalDebt, deliveryRate, openIncidents, pendingOrders };
  }, [orders, accountsReceivable, deliveries, incidents]);

  const summaryCards = [
    { title: 'Ventas Totales', value: formatCurrency(summary.totalSales), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { title: 'Ventas Hoy', value: formatCurrency(summary.todaySales), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { title: 'Ticket Promedio', value: formatCurrency(summary.avgTicket), icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
    { title: 'Pedidos', value: orders.length, icon: ShoppingCart, color: 'text-orange-600 bg-orange-50' },
    { title: 'Clientes Activos', value: summary.activeCustomers, icon: Users, color: 'text-cyan-600 bg-cyan-50' },
    { title: 'Tasa Entrega', value: `${summary.deliveryRate.toFixed(1)}%`, icon: Truck, color: summary.deliveryRate >= 80 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' },
    { title: 'Deuda Total', value: formatCurrency(summary.totalDebt), icon: DollarSign, color: 'text-red-600 bg-red-50' },
    { title: 'Incidencias Abiertas', value: summary.openIncidents, icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics de Negocio</h1>
            <p className="text-muted-foreground text-sm mt-1">KPIs completos de ventas, costos y operaciones</p>
          </div>
          {/* Period Selector */}
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={period === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {summaryCards.map(({ title, value, icon: Icon, color }) => (
            <Card key={title} className="col-span-1">
              <CardContent className="p-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-lg font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ventas" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="ventas">📊 Ventas</TabsTrigger>
            <TabsTrigger value="clientes">👥 Clientes</TabsTrigger>
            <TabsTrigger value="finanzas">💰 Costos y Ganancias</TabsTrigger>
            <TabsTrigger value="operaciones">🚚 Operaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="ventas">
            <SalesKPIs orders={orders} prevOrders={prevOrders} startDate={startDate} endDate={endDate} />
          </TabsContent>

          <TabsContent value="clientes">
            <CustomerKPIs orders={orders} customers={customers} accountsReceivable={accountsReceivable} startDate={startDate} />
          </TabsContent>

          <TabsContent value="finanzas">
            <FinanceKPIs
              orders={orders} collections={collections} payments={payments}
              purchases={purchases} creditInstallments={creditInstallments}
              cardLiquidations={cardLiquidations} pettyCashExpenses={pettyCashExpenses}
              startDate={startDate}
            />
          </TabsContent>

          <TabsContent value="operaciones">
            <OperationsKPIs orders={orders} deliveries={deliveries} incidents={incidents} routes={routes} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
