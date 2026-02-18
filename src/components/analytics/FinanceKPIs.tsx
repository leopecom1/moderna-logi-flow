import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, ShoppingBag, Wallet, AlertCircle, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';

interface FinanceKPIsProps {
  orders: any[];
  collections: any[];
  payments: any[];
  purchases: any[];
  creditInstallments: any[];
  cardLiquidations: any[];
  pettyCashExpenses: any[];
  startDate: Date;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

const KpiCard = ({ title, value, subtitle, icon: Icon, variant = 'default' }: {
  title: string; value: string; subtitle?: string; icon: any; variant?: 'default' | 'success' | 'danger' | 'warning';
}) => {
  const colorMap = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-yellow-100 text-yellow-600',
  };
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function FinanceKPIs({ orders, collections, payments, purchases, creditInstallments, cardLiquidations, pettyCashExpenses, startDate }: FinanceKPIsProps) {
  const metrics = useMemo(() => {
    // Revenue
    const totalSales = orders.reduce((s: number, o: any) => s + o.total_amount, 0);
    const totalCollected = collections.reduce((s: number, c: any) => s + c.amount, 0);

    // Pending payments
    const pendingPayments = payments
      .filter((p: any) => p.status === 'pendiente')
      .reduce((s: number, p: any) => s + p.amount, 0);

    // Purchases (costs)
    const totalPurchases = purchases.reduce((s: number, p: any) => s + (p.total_amount || 0), 0);

    // Credit Moderna pending
    const creditPending = creditInstallments
      .filter((c: any) => c.status === 'pendiente')
      .reduce((s: number, c: any) => s + c.amount, 0);

    // Petty cash expenses
    const pettyCashTotal = pettyCashExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);

    // Card liquidations pending
    const cardLiqPending = cardLiquidations
      .filter((l: any) => l.status === 'pendiente')
      .reduce((s: number, l: any) => s + l.amount, 0);

    // Gross profit
    const grossProfit = totalSales - totalPurchases - pettyCashTotal;
    const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

    // Income vs Expenses chart (last 6 months)
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthSales = orders
        .filter((o: any) => o.created_at.startsWith(monthStr))
        .reduce((s: number, o: any) => s + o.total_amount, 0);
      const monthPurchases = purchases
        .filter((p: any) => (p.created_at || p.purchase_date || '').startsWith(monthStr))
        .reduce((s: number, p: any) => s + (p.total_amount || 0), 0);
      return {
        mes: format(monthDate, 'MMM'),
        ingresos: monthSales,
        gastos: monthPurchases
      };
    });

    // Payment method distribution (collections)
    const collectionsByMethod = collections.reduce((acc: Record<string, number>, c: any) => {
      acc[c.payment_method_type] = (acc[c.payment_method_type] || 0) + c.amount;
      return acc;
    }, {});
    const collectionsPie = Object.entries(collectionsByMethod).map(([name, value]) => ({ name, value }));

    // Payment status distribution
    const paymentsByStatus = payments.reduce((acc: Record<string, number>, p: any) => {
      acc[p.status] = (acc[p.status] || 0) + p.amount;
      return acc;
    }, {});

    return {
      totalSales, totalCollected, pendingPayments, totalPurchases,
      creditPending, pettyCashTotal, cardLiqPending,
      grossProfit, grossMargin, monthlyData, collectionsPie, paymentsByStatus,
      paidPayments: payments.filter((p: any) => p.status === 'pagado').reduce((s: number, p: any) => s + p.amount, 0),
      creditPaidThisPeriod: creditInstallments.filter((c: any) => c.status === 'pagado').reduce((s: number, c: any) => s + (c.paid_amount || c.amount), 0),
    };
  }, [orders, collections, payments, purchases, creditInstallments, cardLiquidations, pettyCashExpenses, startDate]);

  return (
    <div className="space-y-6">
      {/* Main KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Ventas Totales" value={formatCurrency(metrics.totalSales)} icon={TrendingUp} variant="success" subtitle="Pedidos del período" />
        <KpiCard title="Total Cobrado" value={formatCurrency(metrics.totalCollected)} icon={DollarSign} variant="success" subtitle="Cobros confirmados" />
        <KpiCard title="Pendiente de Cobro" value={formatCurrency(metrics.pendingPayments)} icon={AlertCircle} variant="warning" subtitle="Pagos en estado pendiente" />
        <KpiCard title="Gastos de Compras" value={formatCurrency(metrics.totalPurchases)} icon={ShoppingBag} variant="danger" subtitle="Total compras a proveedores" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Ganancia Bruta" value={formatCurrency(metrics.grossProfit)} icon={PiggyBank} variant={metrics.grossProfit >= 0 ? 'success' : 'danger'} subtitle="Ventas - Compras - Gastos" />
        <KpiCard title="Margen Bruto" value={`${metrics.grossMargin.toFixed(1)}%`} icon={TrendingUp} variant={metrics.grossMargin >= 0 ? 'success' : 'danger'} />
        <KpiCard title="Crédito Moderna Pend." value={formatCurrency(metrics.creditPending)} icon={CreditCard} variant="warning" subtitle="Cuotas pendientes de cobro" />
        <KpiCard title="Liquidaciones Tarjeta" value={formatCurrency(metrics.cardLiqPending)} icon={CreditCard} variant="warning" subtitle="Pendientes de liquidar" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <KpiCard title="Gastos Caja Chica" value={formatCurrency(metrics.pettyCashTotal)} icon={Wallet} variant="danger" subtitle="Gastos operativos del período" />
        <KpiCard title="Crédito Moderna Cobrado" value={formatCurrency(metrics.creditPaidThisPeriod)} icon={DollarSign} variant="success" subtitle="Cuotas pagadas en el período" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs Gastos (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobros por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.collectionsPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={metrics.collectionsPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {metrics.collectionsPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Sin datos de cobros en el período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: '(+) Ventas totales', value: metrics.totalSales, type: 'income' },
              { label: '(-) Gastos de compras', value: -metrics.totalPurchases, type: 'expense' },
              { label: '(-) Gastos de caja chica', value: -metrics.pettyCashTotal, type: 'expense' },
              { label: '= Ganancia Bruta Estimada', value: metrics.grossProfit, type: 'total' },
            ].map(({ label, value, type }) => (
              <div key={label} className={`flex justify-between items-center py-2 ${type === 'total' ? 'border-t-2 border-border font-bold text-base' : 'text-sm'}`}>
                <span className={type === 'expense' ? 'text-red-600' : type === 'income' ? 'text-green-600' : ''}>{label}</span>
                <span className={value >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {formatCurrency(Math.abs(value))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
