import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, parseISO, startOfDay, startOfWeek, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  status: string;
  payment_method: string;
  customer_id: string;
}

interface SalesKPIsProps {
  orders: Order[];
  prevOrders: Order[];
  startDate: Date;
  endDate: Date;
}

const PAYMENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(val);

const KpiCard = ({
  title, value, subtitle, trend, trendValue, icon: Icon, color = 'primary'
}: {
  title: string; value: string; subtitle?: string; trend?: 'up' | 'down' | 'neutral';
  trendValue?: string; icon: any; color?: string;
}) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function SalesKPIs({ orders, prevOrders, startDate, endDate }: SalesKPIsProps) {
  const metrics = useMemo(() => {
    const total = orders.reduce((s, o) => s + o.total_amount, 0);
    const prevTotal = prevOrders.reduce((s, o) => s + o.total_amount, 0);
    const count = orders.length;
    const prevCount = prevOrders.length;
    const avgTicket = count > 0 ? total / count : 0;
    const prevAvgTicket = prevCount > 0 ? prevTotal / prevCount : 0;
    const variationPct = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
    const ticketVariation = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(new Date(today.getTime() - 86400000), 'yyyy-MM-dd');
    const todaySales = orders.filter(o => o.created_at.startsWith(todayStr)).reduce((s, o) => s + o.total_amount, 0);
    const yesterdaySales = orders.filter(o => o.created_at.startsWith(yesterdayStr)).reduce((s, o) => s + o.total_amount, 0);
    const todayVariation = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

    // By status
    const byStatus = orders.reduce((acc: Record<string, number>, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // By payment method
    const byPayment = orders.reduce((acc: Record<string, number>, o) => {
      acc[o.payment_method] = (acc[o.payment_method] || 0) + o.total_amount;
      return acc;
    }, {});

    // Daily chart data
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyData = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = orders.filter(o => o.created_at.startsWith(dayStr)).reduce((s, o) => s + o.total_amount, 0);
      const dayCount = orders.filter(o => o.created_at.startsWith(dayStr)).length;
      return { date: format(day, 'dd/MM', { locale: es }), ventas: daySales, pedidos: dayCount };
    });

    // Top orders
    const topOrders = [...orders].sort((a, b) => b.total_amount - a.total_amount).slice(0, 10);

    // Payment pie
    const paymentPie = Object.entries(byPayment).map(([name, value]) => ({ name, value }));

    // Status pie
    const statusPie = Object.entries(byStatus).map(([name, value]) => ({ name: name, value }));

    const daysCount = days.length || 1;

    return {
      total, prevTotal, count, prevCount, avgTicket, variationPct, ticketVariation,
      todaySales, yesterdaySales, todayVariation, byStatus, byPayment,
      dailyData, topOrders, paymentPie, statusPie, daysCount,
      avgPerDay: total / daysCount
    };
  }, [orders, prevOrders, startDate, endDate]);

  const STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente', en_camino: 'En camino', entregado: 'Entregado',
    cancelado: 'Cancelado', preparando: 'Preparando'
  };

  const STATUS_COLORS: Record<string, string> = {
    pendiente: '#f59e0b', en_camino: '#3b82f6', entregado: '#10b981',
    cancelado: '#ef4444', preparando: '#8b5cf6'
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Ventas Totales"
          value={formatCurrency(metrics.total)}
          icon={DollarSign}
          trend={metrics.variationPct >= 0 ? 'up' : 'down'}
          trendValue={`${metrics.variationPct >= 0 ? '+' : ''}${metrics.variationPct.toFixed(1)}% vs período anterior`}
        />
        <KpiCard
          title="Ventas Hoy"
          value={formatCurrency(metrics.todaySales)}
          icon={TrendingUp}
          trend={metrics.todayVariation >= 0 ? 'up' : 'down'}
          trendValue={`${metrics.todayVariation >= 0 ? '+' : ''}${metrics.todayVariation.toFixed(1)}% vs ayer`}
        />
        <KpiCard
          title="Pedidos Totales"
          value={metrics.count.toString()}
          subtitle={`Promedio: ${metrics.avgPerDay.toFixed(1)} por día`}
          icon={ShoppingCart}
          trend={metrics.count >= metrics.prevCount ? 'up' : 'down'}
          trendValue={`${metrics.count >= metrics.prevCount ? '+' : ''}${metrics.count - metrics.prevCount} vs período anterior`}
        />
        <KpiCard
          title="Ticket Promedio"
          value={formatCurrency(metrics.avgTicket)}
          icon={BarChart2}
          trend={metrics.ticketVariation >= 0 ? 'up' : 'down'}
          trendValue={`${metrics.ticketVariation >= 0 ? '+' : ''}${metrics.ticketVariation.toFixed(1)}% vs período anterior`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={metrics.paymentPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {metrics.paymentPie.map((_, i) => <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orders by status + Top Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.statusPie.map(({ name, value }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: STATUS_COLORS[name] || '#94a3b8' }} />
                    <span className="text-sm">{STATUS_LABELS[name] || name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${(value / metrics.count) * 100}%`, background: STATUS_COLORS[name] || '#94a3b8' }}
                      />
                    </div>
                    <Badge variant="secondary">{value}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Pedidos por Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {metrics.topOrders.map((order, i) => (
                <div key={order.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-muted-foreground">{format(parseISO(order.created_at), 'dd/MM/yy')}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativa vs Período Anterior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Ventas', curr: formatCurrency(metrics.total), prev: formatCurrency(metrics.prevTotal), pct: metrics.variationPct },
              { label: 'Pedidos', curr: metrics.count.toString(), prev: metrics.prevCount.toString(), pct: metrics.prevCount > 0 ? ((metrics.count - metrics.prevCount) / metrics.prevCount) * 100 : 0 },
              { label: 'Ticket Promedio', curr: formatCurrency(metrics.avgTicket), prev: formatCurrency(metrics.prevTotal / (metrics.prevCount || 1)), pct: metrics.ticketVariation },
              { label: 'Ventas Hoy', curr: formatCurrency(metrics.todaySales), prev: formatCurrency(metrics.yesterdaySales), pct: metrics.todayVariation },
            ].map(({ label, curr, prev, pct }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{curr}</p>
                <p className="text-xs text-muted-foreground">Anterior: {prev}</p>
                <span className={`text-xs font-medium ${pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
