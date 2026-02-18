
# Nueva Página: Analytics de Negocio - KPIs Completos

## Objetivo
Crear una nueva página `/kpi-analytics` dedicada exclusivamente a KPIs de ventas, costos y ganancias, con datos reales de Supabase. Se reemplazará también el link "Analytics" del sidebar para apuntar a esta nueva página más completa (manteniendo la antigua en `/analytics`).

---

## Datos Disponibles en la Base de Datos

A partir de las tablas existentes en Supabase se pueden extraer:

| Fuente | KPIs posibles |
|---|---|
| `orders` | Ventas totales, ticket promedio, pedidos por período, tasa de conversión, comparativas |
| `payments` | Ingresos cobrados, pendientes de cobro, métodos de pago, liquidaciones |
| `collections` | Cobros realizados, monto promedio de cobros, métodos más usados |
| `purchases` | Costos de compra, gasto a proveedores |
| `accounts_receivable` | Deuda total, balance pendiente, crédito utilizado |
| `customers` | Total clientes, clientes nuevos, clientes activos |
| `deliveries` | Tasa de entrega exitosa, entregas pendientes, en camino |
| `incidents` | Incidencias abiertas/cerradas, impacto en operaciones |
| `inventory_items` | Valor del inventario, stock bajo mínimo |
| `credit_moderna_installments` | Cuotas pendientes, recaudado en crédito |
| `petty_cash_expenses` | Gastos operativos |

---

## Estructura de la Página: 5 Secciones con Tabs

### Tab 1 - Resumen General (Vista ejecutiva)
Fila superior con 8 KPI cards grandes:
- **Ventas del mes** (`orders.total_amount` filtrado por mes actual)
- **Ventas de hoy** (filtro por fecha)
- **Ticket promedio** (total_amount / cantidad de pedidos)
- **Pedidos este mes** (count de orders del mes)
- **Clientes activos** (clientes con pedidos en los últimos 30 días)
- **Tasa de entrega** (entregas exitosas / pedidos totales x 100)
- **Deuda total pendiente** (accounts_receivable.balance_due sumado)
- **Incidencias abiertas** (count incidents con status=abierto)

### Tab 2 - Ventas
- Gráfico de línea: Ventas por día (últimos 30 días)
- Gráfico de barras: Ventas por semana (últimos 3 meses)
- KPIs: Ventas hoy / ayer / semana / mes / año
- Comparativa: Este mes vs mes anterior (%)
- Métodos de pago más usados (pie chart con `orders.payment_method`)
- Top 10 pedidos de mayor valor
- Pedidos por estado (pendiente, en camino, entregado, cancelado)

### Tab 3 - Clientes
- Total de clientes registrados
- Clientes nuevos este mes
- Clientes con deuda (accounts_receivable con balance > 0)
- Clientes sin compras en 60+ días (riesgo churn)
- Ticket promedio por cliente
- Top 10 clientes por volumen de compra
- Distribución por método de pago preferido

### Tab 4 - Costos y Ganancias
- Total cobros registrados (collections)
- Saldo pendiente de cobro (payments con status pendiente)
- Gastos de compras (purchases total)
- Cuotas crédito moderna pendientes
- Ganancias brutas estimadas (ventas - costos de compras)
- Gráfico: Ingresos vs Gastos por mes
- Liquidaciones de tarjeta pendientes (card_liquidations)
- Gastos de caja chica (petty_cash_expenses)

### Tab 5 - Operaciones
- Pedidos entregados hoy / semana / mes
- Tasa de éxito en entregas (%)
- Tiempo promedio de entrega (estimado)
- Cadetes con más entregas
- Incidencias por tipo
- Rutas activas

---

## Período de tiempo seleccionable
Selector de rango en la parte superior (Hoy / 7 días / 30 días / 90 días / Este año) que afecta a todos los KPIs.

---

## Implementación Técnica

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/pages/KpiAnalyticsPage.tsx` | CREAR - Página principal nueva |
| `src/components/analytics/SalesKPIs.tsx` | CREAR - Tab de Ventas |
| `src/components/analytics/CustomerKPIs.tsx` | CREAR - Tab de Clientes |
| `src/components/analytics/FinanceKPIs.tsx` | CREAR - Tab Costos/Ganancias |
| `src/components/analytics/OperationsKPIs.tsx` | CREAR - Tab Operaciones |
| `src/App.tsx` | MODIFICAR - Agregar ruta `/kpi-analytics` |
| `src/components/layout/AppSidebar.tsx` | MODIFICAR - Cambiar link "Analytics" a nueva ruta |

### Tecnologías usadas
- **Recharts**: `LineChart`, `BarChart`, `PieChart`, `AreaChart` (ya instalado)
- **Supabase queries directas**: sin edge functions, todo del lado cliente con filtros de fecha
- **date-fns**: para manejo y formateo de fechas (ya instalado)
- **Radix Tabs**: para las 5 secciones

### Estructura del componente principal

```typescript
// KpiAnalyticsPage.tsx
const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'year'>('30d');
// Todos los hooks de data reciben el period como parámetro
// Tab layout con 5 secciones
```

### Queries principales (ejemplo)

```typescript
// Ventas por período
const { data: orders } = useQuery({
  queryKey: ['kpi-orders', period],
  queryFn: async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, total_amount, created_at, status, payment_method, customer_id')
      .gte('created_at', startDate.toISOString())
      .order('created_at');
    return data;
  }
});

// Cobros (collections)
const { data: collections } = useQuery({
  queryKey: ['kpi-collections', period],
  queryFn: async () => {
    const { data } = await supabase
      .from('collections')
      .select('id, amount, collection_date, payment_method_type, collection_status')
      .gte('collection_date', startDateStr);
    return data;
  }
});
```

---

## KPIs Completos a Mostrar

### Ventas
1. Ventas totales del período
2. Ventas de hoy
3. Ventas de ayer (comparativa)
4. Variación % hoy vs ayer
5. Ventas esta semana
6. Ventas este mes
7. Ventas este año
8. Ticket promedio (ventas / pedidos)
9. Pedidos totales del período
10. Pedidos por día promedio
11. % variación vs período anterior

### Clientes
12. Total clientes activos (con pedidos en el período)
13. Clientes nuevos (creados en el período)
14. Clientes sin compras recientes (>60 días)
15. Deuda total pendiente (balance_due)
16. Clientes con deuda
17. Ticket promedio por cliente

### Costos y Ganancias
18. Total cobrado en el período
19. Total pendiente de cobro (payments pendientes)
20. Total gastos compras (purchases)
21. Cuotas crédito moderna pendientes
22. Gastos caja chica
23. Ganancia bruta estimada
24. Margen bruto %
25. Liquidaciones tarjeta pendientes

### Operaciones
26. Pedidos entregados
27. Tasa de entrega exitosa %
28. Pedidos en tránsito
29. Pedidos pendientes sin asignar
30. Incidencias abiertas
31. Incidencias cerradas en el período
32. Rutas activas

---

## Cambio en el Sidebar

El link "Analytics" en Administración pasará de `/analytics` (la página ML existente) a `/kpi-analytics` (la nueva). La página antigua de ML quedará disponible en su URL original.

