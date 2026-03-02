# Organigrama de Plataforma — Moderna Logi-Flow

> Sistema integral de gestión logística para control de mercaderistas, entregas, rutas, finanzas, inventario e integraciones e-commerce.

---

## Mapa General de la Plataforma

```
MODERNA LOGI-FLOW
│
├── AUTENTICACIÓN
│   ├── Login / Registro
│   └── Control de Roles (Gerencia · Vendedor · Cadete)
│
├── DASHBOARD
│   ├── KPIs en tiempo real
│   └── Analytics avanzado
│
├── COMERCIAL
│   ├── Clientes
│   ├── Pedidos
│   ├── Entregas
│   ├── Cobros
│   └── Cuentas por Cobrar
│
├── INVENTARIO
│   ├── Productos
│   ├── Stock (Depósitos)
│   └── Movimientos de Stock
│
├── OPERACIONES
│   ├── Gestión de Pedidos (Logística)
│   ├── Gestión de Envíos (Rutas)
│   ├── Visualización de Rutas
│   └── Panel de Armado
│
├── FINANZAS
│   ├── Panel Financiero
│   ├── Gestión de Cajas
│   ├── Pagos
│   ├── Compras
│   ├── Pago a Proveedores
│   └── Crédito Moderna
│
├── E-COMMERCE
│   ├── Tienda Online (Config WooCommerce)
│   ├── Pedidos Online
│   ├── Productos Online
│   ├── Sincronización (WooCommerce ↔ Shopify)
│   ├── Historial de Sync
│   └── Campañas de Precios
│
├── ADMINISTRACIÓN
│   ├── Usuarios
│   ├── Cadetes
│   ├── Vehículos
│   ├── Armadores
│   ├── Reportes
│   ├── Gestión Empresarial
│   ├── Importación Masiva
│   ├── Incidencias
│   ├── Configuración
│   └── Mi Perfil
│
└── SERVICIOS BACKEND
    ├── 9 Edge Functions (Supabase/Deno)
    ├── 3 Servicios internos
    ├── 14 Hooks personalizados
    └── 60+ tablas PostgreSQL
```

---

## 1. AUTENTICACIÓN Y ROLES

| Elemento | Descripción |
|----------|-------------|
| **Página** | `/auth` — Login y registro con email/password |
| **Hook** | `useAuth` — Gestión de sesión, perfil y estado de autenticación |
| **Componente** | `ProtectedRoute` — Wrapper que valida autenticación y rol antes de mostrar la página |
| **Tabla DB** | `profiles` — Almacena nombre, teléfono, rol y estado activo de cada usuario |

### Roles del Sistema

| Rol | Acceso | Color en Header |
|-----|--------|-----------------|
| **Gerencia** | Acceso total a todas las secciones. 7 secciones en sidebar. | Violeta |
| **Vendedor** | Clientes, pedidos, entregas, pagos, cobros, incidencias. 3 secciones en sidebar. | Azul |
| **Cadete** | Mi ruta, entregas, historial, incidencias. 3 secciones en sidebar. | Verde |

---

## 2. DASHBOARD

> Panel principal con métricas en tiempo real. Se abre por defecto para todos los roles.

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Dashboard** | `/` | Panel principal con KPIs del día: pedidos, rutas asignadas, en tránsito, entregados, pendientes, incidencias. Incluye feed de actividad en tiempo real y alertas de cierre de caja. Acciones rápidas: crear pedido, cobro o cliente. |
| **KPI Analytics** | `/kpi-analytics` | Analytics avanzado con selector de período (hoy, 7d, 30d, 90d, año). 4 pestañas: Ventas, Clientes, Finanzas, Operaciones. Comparación año contra año (YoY). Solo gerencia. |

### Componentes del Dashboard
- **KPIGrid** — Grilla de indicadores clave de rendimiento
- **RealtimeActivityFeed** — Feed de actividad en vivo (usa Supabase Realtime)
- **CashClosureAlert** — Alerta si no se cerró la caja del día
- **Stats1** — Tarjeta de estadísticas individual

---

## 3. MÓDULO COMERCIAL

> Gestión del ciclo de vida comercial: clientes, pedidos, entregas y cobranzas.

### 3.1 Clientes

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Clientes** | `/customers` | Listado completo de clientes con vista tabla o tarjetas. CRUD completo. Muestra: número de cliente, cantidad de pedidos, crédito activo, última sucursal. Importación de movimientos. |
| **Detalle Cliente** | `/customers/:id` | Ficha completa del cliente con 5 pestañas: Info, Pedidos, Pagos, Entregas, Crédito Moderna. Historial completo de operaciones. |

**Tabla DB**: `customers` (nombre, email, teléfono, dirección, ciudad, departamento, número de cliente)

### 3.2 Pedidos

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Pedidos** | `/orders` | Gestión principal de pedidos. Búsqueda por número, cliente o dirección. Filtros por estado: pendiente, armado, enviado, entregado, cancelado. CRUD completo. Importar pedidos de WooCommerce. Filtro por sucursal. |
| **Detalle Pedido** | `/orders/:id` | Vista completa: número, estado, monto, cliente, productos, datos de entrega, fotos de armado, información de pago, datos de armado (fecha, horario, contacto). |

**Estados de pedido**: `pendiente` → `armado` → `enviado` → `entregado` / `cancelado`
**Tabla DB**: `orders` (order_number, customer_id, seller_id, branch_id, products, delivery_address, payment_method, status, requiere_armado)

### 3.3 Entregas

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Entregas** | `/deliveries` | Listado de entregas con codificación de colores por estado. Crear entregas manuales. Muestra: número de pedido, dirección, monto. |

**Estados de entrega**: `pendiente` · `en_camino` · `entregado` · `no_entregado` · `con_demora`
**Tabla DB**: `deliveries` (order_id, route_id, address, status, delivered_at)

### 3.4 Cobros

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Cobros** | `/collections` | Gestión de cobranzas. Búsqueda por cliente, método, referencia o recibo. Estadísticas: total cobrado, confirmados, pendientes. Métodos: efectivo, transferencia, Mercado Pago, tarjetas, cheques. Filtros por estado. |

**Estados**: `Confirmado` · `Pendiente` · `Rechazado` · `Reversado`
**Tabla DB**: `collections` (customer_id, order_id, amount, method, status, reference)

### 3.5 Cuentas por Cobrar

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Cuentas por Cobrar** | `/accounts-receivable` | Seguimiento de saldos pendientes de clientes. Muestra: ventas totales, cobros, saldo adeudado, cuentas vencidas (+30 días). Estados: Normal, Advertencia, Bloqueado, Suspendido. |

**Tabla DB**: `accounts_receivable` (customer_id, total_sales, total_collections, balance, status)

---

## 4. MÓDULO DE INVENTARIO

> Control de productos, stock en depósitos y movimientos de mercadería.

### 4.1 Productos

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Productos** | `/products` | Catálogo de productos con vista tabla o grilla. CRUD completo. Listas de precios configurables. Importación desde Excel (XLSX). Estado de sync con WooCommerce. Configuración de variantes. Muestra: código, nombre, precio, listas 1 y 2, costo, marca, garantía, margen, proveedor. |

**Tabla DB**: `products` (code, name, price, cost, brand_id, category_id, warranty, margin, supplier_code, is_active)

### 4.2 Stock (Inventario)

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Inventario** | `/inventory` | Gestión de inventario en 2 pestañas: Productos & Inventario, y Depósitos. Configuración de inventario por depósito. Niveles de stock por producto. |

**Tablas DB**: `inventory_items`, `warehouses`, `branch_warehouses`

### 4.3 Movimientos de Stock

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Movimientos** | `/stock-movements` | Registro de movimientos de mercadería con 5 pestañas: Todos, Entradas, Salidas, Transferencias, Ajustes. Búsqueda por producto o referencia. Filtro por depósito y rango de fechas. Costo unitario y valor total. Descarga de datos. |

**Tipos de movimiento**: `entrada` · `salida` · `transferencia` · `ajuste` · `interno`
**Tabla DB**: `stock_movements` (product_id, warehouse_id, type, quantity, unit_cost, reference)

---

## 5. MÓDULO DE OPERACIONES

> Logística operativa: preparación de pedidos, armado, asignación de rutas y seguimiento.

### 5.1 Gestión de Pedidos (Logística)

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Gestión de Pedidos** | `/logistics` | Centro de operaciones logísticas con 3 pestañas: Por Armar, Retiros, Envíos. Conteo de pedidos en tiempo real (Supabase Realtime). Solo gerencia. |

**Componentes**: `OrdersToAssembleModule`, `PickupsModule`, `ShipmentsModule`

### 5.2 Gestión de Rutas

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Gestión de Envíos** | `/routes-management` | Crear y gestionar rutas de entrega. Asignar cadetes. Control de entregas totales vs completadas. Estados: pendiente, en progreso, completada. Tiempos de inicio/fin. Porcentaje de progreso. Solo gerencia. |
| **Rutas** | `/routes` | Vista de rutas (para cadetes y vendedores). Listado con estado, fecha, cadete, progreso. Navegar al detalle. |
| **Detalle de Ruta** | `/routes/:id` | Información completa: nombre, fecha, cadete, horarios. Lista de entregas con estado. Mapa con visualización de ruta (Google Maps). Calculador de tiempos. Asignar pedidos. Acciones: iniciar/detener/completar ruta. |
| **Visualización** | `/routes-view` | Panel de visualización de rutas en tiempo real con mapa. Seguimiento del progreso. Solo gerencia. |
| **Optimización IA** | `/route-optimization` | Optimización de rutas con algoritmos: IA predictiva, algoritmo genético, TSP (2-opt/3-opt), algoritmo mixto. 3 pestañas: Optimizador, Analíticas, Tráfico en vivo. |

**Tabla DB**: `routes` (name, date, cadete_id, start_time, end_time, status)

### 5.3 Panel de Armado

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Panel de Armado** | `/assembly` | Gestión de pedidos que requieren armado/instalación. Control de estado de armado. Solo gerencia. |

**Tabla DB**: `orders` (campo `requiere_armado`, `assembly_photos`)

---

## 6. MÓDULO DE FINANZAS

> Gestión financiera completa: pagos, cajas, compras, proveedores y créditos.

### 6.1 Panel Financiero

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Finanzas** | `/finance` | Vista consolidada de movimientos financieros. Filtros por tipo: cobros, pagos, transferencias, tarjeta de crédito, crédito moderna. Filtros por estado. Panel de liquidación de tarjetas. Confirmación de pagos con tarjeta. Gestión de recargos. |

### 6.2 Gestión de Cajas

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Gestión de Cajas** | `/cash-management` | Gestión de cajas registradoras por sucursal con 5 pestañas: Cajas, Cierre Diario, Gastos Menores, Movimientos, Reportes. Selección de caja y seguimiento de saldo. Cierre diario con conteo manual. Gastos menores (caja chica). Movimientos del día: pagos, cobros, gastos. Envío a central. |

**Tablas DB**: `branch_cash_registers`, `daily_cash_closures`, `petty_cash_expenses`

### 6.3 Pagos

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Pagos** | `/payments` | Listado de pagos asociados a pedidos. Estados: pendiente, pagado, fallido, reembolsado, liquidado. Método de pago y referencia. Crear pagos manuales. |

**Tabla DB**: `payments` (order_id, amount, method, reference, status)

### 6.4 Compras

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Compras** | `/purchases` | Gestión de compras a proveedores con 3 pestañas: Compras, Solicitudes, Configuración. Búsqueda por número o proveedor. Filtro por estado. Soporte multi-moneda (USD, UYU). Tipo de cambio. Condiciones de pago. Modal de ingreso a stock. |

**Tabla DB**: `purchases` (purchase_number, supplier, items, currency, exchange_rate, payment_terms)

### 6.5 Pago a Proveedores

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Pago Proveedores** | `/supplier-payments` | Gestión de pagos a proveedores con 2 pestañas: Pagos, Cheques. Búsqueda por proveedor, compra o cheque. Filtro por estado: pendiente, pagado, vencido. Métodos: efectivo, transferencia, cheque. Gestión de cheques (número, vencimiento, imagen). Carga de comprobantes. |

**Tabla DB**: `supplier_payments`, `supplier_payment_checks`

### 6.6 Crédito Moderna

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Crédito Moderna** | `/credito-moderna` | Sistema de financiación en cuotas. Ver cuotas: pendiente, pagado, vencido. Vista resumen por cliente. Métricas: monto pendiente, vence hoy, vencido, total cuotas pagadas. Dos vistas: por cliente o por cuota. Solo gerencia. |

**Tabla DB**: `credit_moderna_installments` (customer_id, amount, due_date, status, paid_at)

---

## 7. MÓDULO E-COMMERCE

> Integración con tiendas online: WooCommerce y Shopify. Sincronización de productos y campañas de precios.

### 7.1 Configuración WooCommerce

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Tienda Online** | `/woocommerce-config` | Configuración de la conexión WooCommerce. URL de la tienda, Consumer Key y Secret. Activar/desactivar sync. Sucursal y depósito por defecto. Configuración de armado. Auto-asignar a ruta. Verificación de conexión. Solo gerencia. |

**Tabla DB**: `woocommerce_config` (store_url, consumer_key, consumer_secret, default_branch_id, default_warehouse_id)

### 7.2 Pedidos Online

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Pedidos Online** | `/woocommerce-review` | Revisión de pedidos importados de WooCommerce. Auto-refresco cada 10 segundos. 2 secciones: Pendientes de revisión, Ya revisados. Resaltar pedidos sin sucursal asignada. Modal de revisión con configuración. Solo gerencia. |

### 7.3 Productos Online

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Productos WooCommerce** | `/woocommerce-products` | Gestión de productos en WooCommerce. Lista paginada (20 por página). Búsqueda y filtro por categoría/estado. Modo edición masiva con tracking de cambios. CRUD de productos. Gestión de categorías. SKU, precio, stock. Solo gerencia. |
| **Productos Shopify** | `/shopify-products` | Similar a WooCommerce pero con API de Shopify. Paginación de 250 por página. |

### 7.4 Sincronización

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Sincronización** | `/product-sync` | Panel dual: WooCommerce ↔ Shopify. Mapeo de productos entre plataformas. Coincidencia masiva por título (Bulk Title Match). Crear productos nuevos desde Shopify. Seguimiento de sync en segundo plano. Búsqueda y filtro por estado. Solo gerencia. |
| **Historial Sync** | `/product-sync-history` | Historial de trabajos de sincronización. Estado: completado, error, procesando. Detalle de errores por ítem. Fecha y hora de cada operación. Solo gerencia. |

**Tablas DB**: `product_mappings`, `sync_jobs`, `sync_job_items`, `product_sync_history`

### 7.5 Campañas de Precios

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Campañas** | `/ecommerce-campaigns` | Crear campañas de precios promocionales. Aplicar y revertir campañas en WooCommerce. Seguimiento de progreso de aplicación masiva. Solo gerencia. |

**Hook**: `useEcommerceCampaigns` — CRUD completo con aplicación por lotes (20 productos por batch)
**Edge Function**: `apply-campaign` — Procesamiento en segundo plano con tracking de progreso
**Tablas DB**: `ecommerce_campaigns`, `ecommerce_campaign_products`, `ecommerce_campaign_variations`

---

## 8. MÓDULO DE ADMINISTRACIÓN

> Configuración del sistema, gestión de usuarios, reportes y herramientas administrativas.

| Herramienta | Ruta | Descripción |
|-------------|------|-------------|
| **Gestión de Usuarios** | `/user-management` | Administración de usuarios. Filtro por rol y estado. Crear usuarios con email, contraseña y rol. Editar roles. Eliminar usuarios. Ver último inicio de sesión y verificación de email. Solo gerencia. |
| **Cadetes** | `/cadetes` | Listado y gestión de personal de entrega. Crear cadetes con perfil extendido. Buscar por nombre. Click para ver detalle. |
| **Detalle Cadete** | `/cadetes/:id` | Ficha completa: datos personales, licencia de conducir (número, categoría, vencimiento), contacto de emergencia, obra social, datos bancarios, estado civil, fecha de nacimiento. |
| **Vehículos** | `/vehiculos` | Gestión de vehículos de entrega. Búsqueda por patente, marca, modelo. CRUD completo. Datos: marca, modelo, año, patente, color, seguro, inspección técnica, tipo, estado. Cadete asignado. |
| **Armadores** | `/armadores` | CRUD de trabajadores de armado/instalación. Nombre, teléfono, email, estado activo/inactivo. Solo gerencia. |
| **Reportes** | `/reports` | Generador de reportes de negocio. Selector de período: 7, 14, 30, 60+ días. Estadísticas: pedidos, entregas, ingresos, incidencias, rutas. Reportes avanzados personalizados. |
| **Gestión Empresarial** | `/business` | Panel avanzado con 5 pestañas: Dashboard Ejecutivo, Sistema CRM, Inventario Inteligente, Calidad y Facturación, Administración. |
| **Importación Masiva** | `/bulk-import` | Importar clientes, productos y movimientos en masa desde archivos. Estadísticas de importación. Historial de importaciones. |
| **Incidencias** | `/incidents` | Reporte y seguimiento de incidencias operativas. Estados: abierto, en proceso, resuelto, cerrado. Tipos: entrega fallida, daño de producto, cliente no disponible, etc. Vinculación a pedido. |
| **Configuración** | `/settings` | Configuración general del sistema. 6 secciones: Datos de empresa, Notificaciones, Sistema, Usuarios, Sync de moneda, Actualizaciones. |
| **Mi Perfil** | `/profile` | Perfil de usuario con 3 pestañas: Perfil (nombre, teléfono, email, avatar), Seguridad (cambio de contraseña, 2FA), Sesiones (historial de login con IP y user agent). |
| **Analytics** | `/analytics` | Dashboard de analytics con IA: Analíticas Predictivas, Motor de Recomendaciones, Analíticas en Tiempo Real. |
| **Referencias** | `/references` | Consulta de números de referencia de categorías (principales y sub) y marcas. Copiar referencia al portapapeles. |
| **Notificaciones** | `/notifications` | Centro de notificaciones con 4 pestañas: Centro, Configuración, Alertas, Push. Configurar: sonido, push, email, SMS. Horarios de silencio. Tipos: pedidos, entregas, incidencias, rutas, problemas. Alertas por ubicación. |

---

## 9. HEADER (Barra Superior)

> Elementos siempre visibles en la parte superior de la aplicación.

| Elemento | Descripción |
|----------|-------------|
| **Toggle Sidebar** | Colapsar/expandir el menú lateral |
| **Badge de Rol** | Muestra el rol del usuario actual con color |
| **Cotización USD** | Tipo de cambio actual del dólar (vía DolarAPI Uruguay) |
| **Actualizaciones** | Botón con contador de actualizaciones del sistema no leídas |
| **Feedback** | Botón de feedback (badge visible solo para gerencia) |
| **Notificaciones** | Campanita con contador de notificaciones no leídas, dropdown con listado |
| **Menú Usuario** | Foto, nombre, enlace a perfil y cerrar sesión |

---

## 10. SERVICIOS BACKEND

### 10.1 Edge Functions (Supabase/Deno)

| Función | Descripción |
|---------|-------------|
| **google-maps-key** | Entrega segura de la API Key de Google Maps desde el servidor. Protege la clave evitando exponerla en el frontend. |
| **create-cadete** | Creación de cuentas de cadete con perfil extendido. Crea usuario en Auth, perfil básico y perfil de cadete (licencia, emergencia, obra social, banco). |
| **woocommerce-webhook** | Receptor de webhooks de WooCommerce. Procesa pedidos entrantes: busca/crea cliente, transforma productos, detecta método de envío, mapea método de pago y estado, crea o actualiza pedido en el sistema. |
| **woocommerce-products** | Proxy para la API REST v3 de WooCommerce. Soporta GET/POST/PUT/PATCH/DELETE. Maneja productos, categorías, variantes y operaciones batch. Autenticación con consumer key/secret. |
| **shopify-products** | Proxy para API de Shopify. Soporta GraphQL (búsqueda) y REST (listado con paginación por cursor). Extrae productos con imágenes, variantes, opciones y tags. |
| **background-sync** | Sincronización de productos Shopify → WooCommerce en segundo plano. Procesamiento por lotes de 20. Copia imágenes, descripciones, precios y variantes. Crea mapeos de productos. |
| **apply-campaign** | Aplicación masiva de campañas de precios a WooCommerce. Procesamiento por lotes con bloqueo para evitar duplicados. Guarda precios originales antes de aplicar. Soporta productos simples y con variantes. Cancelación con rollback. |
| **send-notification** | Envío de notificaciones por WhatsApp, SMS y email (simulado, preparado para integración con Twilio/MessageBird). Genera IDs únicos por mensaje. |
| **sync-currency-rates** | Sincronización de tipos de cambio USD desde DolarAPI Uruguay. Actualiza tasas de compra y venta en la base de datos. |

### 10.2 Servicios Internos (Frontend)

| Servicio | Archivo | Descripción |
|----------|---------|-------------|
| **Notification Service** | `notificationService.ts` | Lógica de negocio para envío de notificaciones por dominio. Notifica según rol: nuevo pedido (a gerencia), pedido asignado (a cadete), entrega completada/fallida (a gerencia y vendedor), incidencia creada/resuelta, ruta creada/iniciada, problema en pedido. |
| **Advanced Notification Service** | `advancedNotificationService.ts` | Notificaciones multi-canal: push (service worker), WhatsApp, SMS, email. Alertas por ubicación (geofencing con fórmula Haversine). Proximidad: 200m acercándose, 50m llegando. Notificaciones programadas. |
| **Route Optimization Service** | `routeOptimizationService.ts` | Optimización avanzada de rutas con múltiples algoritmos: IA Predictiva (factores múltiples), Algoritmo Genético (100 población, 200 generaciones, 2% mutación), TSP con mejoras 2-opt y 3-opt, Algoritmo Mixto (clustering geográfico + zonas). Considera tráfico, ventanas horarias, prioridad, distancia, hora del día (picos: 7-9h, 12-14h, 17-19h). |

### 10.3 Hooks Personalizados

| Hook | Descripción |
|------|-------------|
| `useAuth` | Autenticación y perfil de usuario. Listener de cambios de sesión. signIn, signUp, signOut. |
| `useNotifications` | Notificaciones en tiempo real con suscripción Supabase. Marcar leídas. Contador de no leídas. Límite: 50 más recientes. |
| `useNotificationToast` | Muestra toasts para notificaciones nuevas (dentro de 5 segundos de creación). Toast destructivo para entregas fallidas e incidencias. |
| `useCurrencyRates` | Consulta y cacheo de tipos de cambio. Tasa USD específica. Trigger de sync manual. Cache: 5 min stale, 10 min refetch. |
| `useEcommerceCampaigns` | CRUD de campañas de precios. Aplicar/revertir campañas con procesamiento por lotes. Tracking de progreso. Cancelación. |
| `useWooCommerceProducts` | CRUD completo de productos WooCommerce. Subida de imágenes a Supabase Storage. Variantes: crear, editar, eliminar, batch. |
| `useWooCommerceCategories` | CRUD de categorías WooCommerce via edge function. |
| `useShopifyProducts` | Configuración y consulta de productos Shopify. Paginación por cursor. Búsqueda. |
| `useProductMappings` | Mapeo de productos WooCommerce ↔ Shopify. Crear, consultar y eliminar mapeos. |
| `useGoogleMaps` | Carga e inicialización de Google Maps API. Obtiene API key del edge function. |
| `useFeedback` | Sistema de feedback de usuarios. CRUD, cambiar estado/prioridad, contador de pendientes. |
| `useSystemUpdates` | Anuncios y actualizaciones del sistema. Tracking de lecturas por usuario. CRUD (admin). |
| `use-toast` | Sistema de toasts (notificaciones visuales). Reducer pattern. Máximo 1 toast simultáneo. |
| `use-mobile` | Detección de viewport móvil (breakpoint 768px). |

---

## 11. BASE DE DATOS (Tablas Principales)

### Negocio Core
| Tabla | Propósito |
|-------|-----------|
| `profiles` | Perfiles de usuario (nombre, rol, teléfono, estado) |
| `customers` | Base de datos de clientes |
| `orders` | Gestión de pedidos |
| `deliveries` | Seguimiento de entregas |
| `routes` | Gestión de rutas |
| `incidents` | Registro de incidencias |

### Finanzas
| Tabla | Propósito |
|-------|-----------|
| `payments` | Pagos de pedidos |
| `collections` | Cobranzas |
| `accounts_receivable` | Cuentas por cobrar |
| `supplier_payments` | Pagos a proveedores |
| `supplier_payment_checks` | Cheques de pago a proveedores |
| `daily_cash_closures` | Cierres diarios de caja |
| `petty_cash_expenses` | Gastos de caja chica |
| `branch_cash_registers` | Cajas registradoras por sucursal |
| `card_liquidations` | Liquidaciones de tarjeta |
| `currency_rates` | Tipos de cambio |
| `credit_moderna_installments` | Cuotas de crédito Moderna |

### Inventario
| Tabla | Propósito |
|-------|-----------|
| `products` | Catálogo de productos |
| `categories` | Categorías de productos |
| `brands` | Marcas |
| `product_variants` | Variantes de producto |
| `product_variant_types` | Configuración de tipos de variante |
| `inventory_items` | Niveles de stock |
| `inventory_movements` | Transacciones de stock |
| `inventory_valuations` | Valuación de inventario |
| `warehouses` | Depósitos |
| `branch_warehouses` | Inventario por sucursal |
| `stock_movements` | Movimientos de mercadería |

### Operaciones
| Tabla | Propósito |
|-------|-----------|
| `cadete_profiles` | Perfiles extendidos de cadetes (licencia, emergencia, banco) |
| `vehicles` | Vehículos de entrega |
| `branches` | Sucursales |
| `armadores` | Trabajadores de armado |
| `assembly_photos` | Fotos de armado |
| `purchases` | Compras a proveedores |

### E-commerce
| Tabla | Propósito |
|-------|-----------|
| `woocommerce_config` | Credenciales WooCommerce |
| `shopify_config` | Credenciales Shopify |
| `product_mappings` | Mapeo de productos entre plataformas |
| `product_sync_history` | Historial de sincronización |
| `sync_jobs` | Trabajos de sync en segundo plano |
| `sync_job_items` | Ítems de cada trabajo de sync |
| `ecommerce_campaigns` | Campañas de precios |
| `ecommerce_campaign_products` | Productos de campañas |
| `ecommerce_campaign_variations` | Variantes de campañas |

### Sistema
| Tabla | Propósito |
|-------|-----------|
| `notifications` | Notificaciones de usuario |
| `notification_log` | Historial de notificaciones |
| `notification_preferences` | Preferencias de notificación |
| `push_subscriptions` | Suscripciones push |
| `system_updates` | Actualizaciones del sistema |
| `system_updates_read` | Tracking de lectura de actualizaciones |
| `user_feedback` | Feedback de usuarios |
| `role_permissions` | Permisos por rol (RBAC) |
| `location_alerts` | Alertas por ubicación (geofencing) |
| `customer_movements` | Movimientos de clientes |
| `sales` | Registros de ventas |

---

## 12. INTEGRACIONES EXTERNAS

| Integración | Propósito | Conexión |
|-------------|-----------|----------|
| **WooCommerce** | Tienda online, productos, pedidos, categorías | API REST v3 via Edge Function `woocommerce-products` |
| **Shopify** | Catálogo de productos, variantes | GraphQL + REST API via Edge Function `shopify-products` |
| **Google Maps** | Visualización de rutas, tracking, autocompletado de direcciones | JS API via Edge Function `google-maps-key` |
| **DolarAPI Uruguay** | Tipos de cambio USD (compra/venta) | REST API via Edge Function `sync-currency-rates` |
| **Supabase Realtime** | Notificaciones en vivo, dashboard en tiempo real | PostgreSQL CDC (Change Data Capture) |
| **Supabase Storage** | Imágenes de productos WooCommerce, fotos de armado | Bucket `woocommerce-images` |

---

## 13. FLUJO DE DATOS PRINCIPAL

```
                    ┌─────────────┐
                    │   USUARIO   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  INTERFAZ   │  React + shadcn/ui + Tailwind
                    │  (Frontend) │  51 páginas · 189 componentes
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
      ┌───────▼──────┐ ┌──▼───┐ ┌──────▼──────┐
      │  React Query  │ │Hooks │ │  Services   │
      │  (Cache/Sync) │ │ (14) │ │    (3)      │
      └───────┬──────┘ └──┬───┘ └──────┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  SUPABASE   │
                    │  (Backend)  │
                    └──────┬──────┘
                           │
         ┌─────────┬───────┼───────┬──────────┐
         │         │       │       │          │
    ┌────▼───┐ ┌───▼──┐ ┌──▼──┐ ┌──▼──┐ ┌────▼────┐
    │  Auth  │ │  DB  │ │Edge │ │Real │ │Storage  │
    │        │ │ 60+  │ │Func.│ │time │ │(Images) │
    │ Email/ │ │tablas│ │ (9) │ │ CDC │ │         │
    │ Pass   │ │      │ │     │ │     │ │         │
    └────────┘ └──────┘ └──┬──┘ └─────┘ └─────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌────▼────┐ ┌─────▼─────┐
        │WooCommerce│ │ Shopify │ │Google Maps│
        │  REST v3  │ │GraphQL+ │ │  JS API   │
        │           │ │REST API │ │           │
        └──────────┘ └─────────┘ └───────────┘
```

---

*Documento generado el 2 de marzo de 2026. Basado en el análisis completo del código fuente de Moderna Logi-Flow.*
