import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle, Clock, AlertTriangle, MapPin, Package, TrendingUp, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface OperationsKPIsProps {
  orders: any[];
  deliveries: any[];
  incidents: any[];
  routes: any[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(val);

const KpiCard = ({ title, value, subtitle, icon: Icon, variant = 'default' }: {
  title: string; value: string | number; subtitle?: string; icon: any;
  variant?: 'default' | 'success' | 'danger' | 'warning';
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

const INCIDENT_COLORS: Record<string, string> = {
  retraso: '#f59e0b', daño: '#ef4444', extravío: '#8b5cf6', rechazo: '#06b6d4', otro: '#94a3b8'
};
const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function OperationsKPIs({ orders, deliveries, incidents, routes }: OperationsKPIsProps) {
  const metrics = useMemo(() => {
    // Delivery stats
    const totalDeliveries = deliveries.length;
    const delivered = deliveries.filter((d: any) => d.status === 'entregado').length;
    const inTransit = deliveries.filter((d: any) => d.status === 'en_camino').length;
    const pending = deliveries.filter((d: any) => d.status === 'pendiente').length;
    const failed = deliveries.filter((d: any) => d.status === 'no_entregado').length;
    const successRate = totalDeliveries > 0 ? (delivered / totalDeliveries) * 100 : 0;

    // Orders by status
    const ordersByStatus = orders.reduce((acc: Record<string, number>, o: any) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const pendingOrders = orders.filter((o: any) => o.status === 'pendiente').length;
    const unassignedOrders = orders.filter((o: any) => o.status === 'pendiente' && !o.cadete_id).length;

    // Incidents stats
    const openIncidents = incidents.filter((i: any) => i.status === 'abierto').length;
    const closedIncidents = incidents.filter((i: any) => i.status === 'resuelto').length;
    const incidentsByType = incidents.reduce((acc: Record<string, number>, i: any) => {
      acc[i.incident_type] = (acc[i.incident_type] || 0) + 1;
      return acc;
    }, {});

    // Active routes
    const activeRoutes = routes.filter((r: any) => r.status === 'activa' || r.status === 'en_progreso').length;

    // Cadete performance
    const cadeteStats: Record<string, { delivered: number; total: number }> = {};
    deliveries.forEach((d: any) => {
      if (!cadeteStats[d.cadete_id]) cadeteStats[d.cadete_id] = { delivered: 0, total: 0 };
      cadeteStats[d.cadete_id].total += 1;
      if (d.status === 'entregado') cadeteStats[d.cadete_id].delivered += 1;
    });

    const topCadetes = Object.entries(cadeteStats)
      .sort((a, b) => b[1].delivered - a[1].delivered)
      .slice(0, 5)
      .map(([id, stats]) => ({
        id,
        delivered: stats.delivered,
        total: stats.total,
        rate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(0) : '0'
      }));

    // Delivery status pie
    const deliveryStatusPie = [
      { name: 'Entregado', value: delivered },
      { name: 'En camino', value: inTransit },
      { name: 'Pendiente', value: pending },
      { name: 'No entregado', value: failed },
    ].filter(d => d.value > 0);

    // Incidents pie
    const incidentsPie = Object.entries(incidentsByType).map(([name, value]) => ({ name, value }));

    // Orders status chart
    const ordersStatusChart = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));

    return {
      totalDeliveries, delivered, inTransit, pending, failed, successRate,
      pendingOrders, unassignedOrders, openIncidents, closedIncidents,
      activeRoutes, incidentsByType, topCadetes, deliveryStatusPie, incidentsPie, ordersStatusChart
    };
  }, [orders, deliveries, incidents, routes]);

  const STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente', en_camino: 'En camino', entregado: 'Entregado',
    cancelado: 'Cancelado', preparando: 'Preparando'
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Entregas Totales" value={metrics.totalDeliveries} subtitle="En el período seleccionado" icon={Truck} />
        <KpiCard title="Entregas Exitosas" value={metrics.delivered} subtitle={`${metrics.successRate.toFixed(1)}% tasa de éxito`} icon={CheckCircle} variant="success" />
        <KpiCard title="En Tránsito" value={metrics.inTransit} subtitle="Deliveries en camino" icon={Truck} variant="warning" />
        <KpiCard title="Tasa de Entrega" value={`${metrics.successRate.toFixed(1)}%`} subtitle="Exitosas / Total" icon={TrendingUp} variant={metrics.successRate >= 80 ? 'success' : 'danger'} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Pedidos Pendientes" value={metrics.pendingOrders} subtitle="Sin entregar aún" icon={Clock} variant="warning" />
        <KpiCard title="Sin Asignar" value={metrics.unassignedOrders} subtitle="Pedidos sin cadete asignado" icon={Package} variant="danger" />
        <KpiCard title="Incidencias Abiertas" value={metrics.openIncidents} subtitle="Requieren atención" icon={AlertTriangle} variant="danger" />
        <KpiCard title="Rutas Activas" value={metrics.activeRoutes} subtitle="Rutas en progreso" icon={MapPin} variant="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.deliveryStatusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={metrics.deliveryStatusPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {metrics.deliveryStatusPie.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sin entregas en el período
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incidencias por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.incidentsPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.incidentsPie}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Incidencias" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Sin incidencias en el período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.ordersStatusChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90}
                tickFormatter={(v) => STATUS_LABELS[v] || v} />
              <Tooltip labelFormatter={(v) => STATUS_LABELS[v as string] || v} />
              <Bar dataKey="value" name="Pedidos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Incidents summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Incidencias abiertas</span>
                </div>
                <Badge variant="destructive">{metrics.openIncidents}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Resueltas en el período</span>
                </div>
                <Badge variant="secondary">{metrics.closedIncidents}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Tasa de resolución</span>
                </div>
                <Badge>
                  {metrics.openIncidents + metrics.closedIncidents > 0
                    ? `${((metrics.closedIncidents / (metrics.openIncidents + metrics.closedIncidents)) * 100).toFixed(0)}%`
                    : 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Total entregas', value: metrics.totalDeliveries, icon: Truck, color: 'text-blue-500' },
                { label: 'Entregadas', value: metrics.delivered, icon: CheckCircle, color: 'text-green-500' },
                { label: 'En camino', value: metrics.inTransit, icon: Truck, color: 'text-yellow-500' },
                { label: 'No entregadas', value: metrics.failed, icon: XCircle, color: 'text-red-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                  <Badge variant="secondary">{value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
