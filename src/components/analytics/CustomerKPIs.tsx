import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, AlertCircle, TrendingUp, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';

interface Order { id: string; total_amount: number; created_at: string; customer_id: string; }
interface Customer { id: string; name: string; created_at: string; }
interface AccountsReceivable { customer_id: string; balance_due: number | null; }

interface CustomerKPIsProps {
  orders: Order[];
  customers: Customer[];
  accountsReceivable: AccountsReceivable[];
  startDate: Date;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(val);

const KpiCard = ({ title, value, subtitle, icon: Icon, highlight }: {
  title: string; value: string | number; subtitle?: string; icon: any; highlight?: boolean;
}) => (
  <Card className={highlight ? 'border-destructive/50' : ''}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${highlight ? 'bg-destructive/10' : 'bg-primary/10'}`}>
          <Icon className={`h-6 w-6 ${highlight ? 'text-destructive' : 'text-primary'}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function CustomerKPIs({ orders, customers, accountsReceivable, startDate }: CustomerKPIsProps) {
  const metrics = useMemo(() => {
    const now = new Date();

    // Active customers (with orders in period)
    const activeCustomerIds = new Set(orders.map(o => o.customer_id));

    // New customers in period
    const newCustomers = customers.filter(c => new Date(c.created_at) >= startDate);

    // Churn risk: customers with no orders in 60+ days
    const last60 = subDays(now, 60);
    const recentCustomerIds = new Set(
      orders.filter(o => new Date(o.created_at) >= last60).map(o => o.customer_id)
    );
    const churnRiskCustomers = customers.filter(c => !recentCustomerIds.has(c.id));

    // Customers with debt
    const customersWithDebt = accountsReceivable.filter(ar => (ar.balance_due || 0) > 0);
    const totalDebt = accountsReceivable.reduce((s, ar) => s + (ar.balance_due || 0), 0);

    // Top customers by volume
    const customerVolume: Record<string, number> = {};
    const customerOrderCount: Record<string, number> = {};
    orders.forEach(o => {
      customerVolume[o.customer_id] = (customerVolume[o.customer_id] || 0) + o.total_amount;
      customerOrderCount[o.customer_id] = (customerOrderCount[o.customer_id] || 0) + 1;
    });

    const topCustomers = Object.entries(customerVolume)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([customerId, total]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          name: customer?.name || 'Desconocido',
          total,
          orders: customerOrderCount[customerId] || 0,
          avgTicket: total / (customerOrderCount[customerId] || 1)
        };
      });

    // Average ticket per customer
    const avgTicketPerCustomer = activeCustomerIds.size > 0
      ? orders.reduce((s, o) => s + o.total_amount, 0) / activeCustomerIds.size
      : 0;

    // New customer chart (last 7 days breakdown)
    const customersByDay = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
      const dayStr = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'dd/MM'),
        nuevos: customers.filter(c => c.created_at.startsWith(dayStr)).length
      };
    });

    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomerIds.size,
      newCustomers: newCustomers.length,
      churnRisk: churnRiskCustomers.length,
      customersWithDebt: customersWithDebt.length,
      totalDebt,
      avgTicketPerCustomer,
      topCustomers,
      customersByDay
    };
  }, [orders, customers, accountsReceivable, startDate]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Clientes" value={metrics.totalCustomers} subtitle="Registrados en el sistema" icon={Users} />
        <KpiCard title="Clientes Activos" value={metrics.activeCustomers} subtitle="Con pedidos en el período" icon={UserCheck} />
        <KpiCard title="Clientes Nuevos" value={metrics.newCustomers} subtitle="Creados en el período" icon={TrendingUp} />
        <KpiCard title="Riesgo Churn" value={metrics.churnRisk} subtitle="Sin compras en +60 días" icon={UserX} highlight />
        <KpiCard title="Con Deuda" value={metrics.customersWithDebt} subtitle="Cuentas con balance pendiente" icon={AlertCircle} highlight />
        <KpiCard title="Deuda Total" value={formatCurrency(metrics.totalDebt)} subtitle="Balance pendiente total" icon={CreditCard} highlight />
        <KpiCard title="Ticket Prom./Cliente" value={formatCurrency(metrics.avgTicketPerCustomer)} subtitle="Ventas / clientes activos" icon={TrendingUp} />
        <KpiCard title="Tasa Actividad" value={`${metrics.totalCustomers > 0 ? ((metrics.activeCustomers / metrics.totalCustomers) * 100).toFixed(0) : 0}%`} subtitle="Clientes activos / total" icon={UserCheck} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevos Clientes (Últimos 7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics.customersByDay}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="nuevos" name="Nuevos clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Clientes por Volumen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics.topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" name="Ventas" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle Top Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-muted-foreground font-medium">#</th>
                  <th className="pb-2 text-muted-foreground font-medium">Cliente</th>
                  <th className="pb-2 text-muted-foreground font-medium text-right">Total Compras</th>
                  <th className="pb-2 text-muted-foreground font-medium text-right">Pedidos</th>
                  <th className="pb-2 text-muted-foreground font-medium text-right">Ticket Prom.</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topCustomers.map((c, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2 text-right font-semibold">{formatCurrency(c.total)}</td>
                    <td className="py-2 text-right"><Badge variant="secondary">{c.orders}</Badge></td>
                    <td className="py-2 text-right text-muted-foreground">{formatCurrency(c.avgTicket)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
