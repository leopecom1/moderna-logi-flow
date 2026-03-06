# AUDITORÍA COMPLETA — Moderna Logi-Flow

**Fecha:** 2026-03-05
**Alcance:** Seguridad, Rendimiento, UI/UX, Base de Datos, Calidad de Código
**Archivos analizados:** 150+
**Líneas auditadas:** ~15,000+

---

## RESUMEN EJECUTIVO

| Categoría | Críticos | Altos | Medios | Bajos |
|-----------|----------|-------|--------|-------|
| Seguridad | 4 | 3 | 3 | 2 |
| Rendimiento | 2 | 2 | 3 | 1 |
| UI/UX | 0 | 1 | 2 | 0 |
| Base de Datos | 2 | 3 | 2 | 0 |
| Código | 1 | 2 | 3 | 2 |
| **TOTAL** | **9** | **11** | **13** | **5** |

---

## 1. SEGURIDAD

### CRÍTICO

#### 1.1 Credenciales hardcodeadas en código fuente
- **`src/integrations/supabase/client.ts:5-6`** — URL y API key de Supabase hardcodeadas en el código (no usa `import.meta.env`)
- **`.env` commiteado en git** — Credenciales expuestas en historial
- **`.gitignore` no excluye `.env`**

#### 1.2 URLs de Edge Functions hardcodeadas
- `src/hooks/useWooCommerceCategories.ts:6`
- `src/hooks/useGoogleMaps.ts:63`
- `src/pages/WooCommerceConfigPage.tsx:457`

#### 1.3 nginx.conf sin headers de seguridad
- Sin `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- Sin `Content-Security-Policy`, `Strict-Transport-Security`
- Sin `Referrer-Policy`, `Permissions-Policy`
- Vulnerable a clickjacking, content-type sniffing, XSS

#### 1.4 30+ rutas sin ProtectedRoute en App.tsx
Rutas como `/customers`, `/orders`, `/finance`, `/user-management`, `/settings` están envueltas en `DemoRoute` pero NO en `ProtectedRoute`. `DemoRoute` solo filtra por versión demo, no verifica autenticación.

### ALTO

#### 1.5 Validación de input inconsistente
- `CreateCustomerModal.tsx` — Sin validación Zod (datos se insertan directo)
- `CreateProductModal.tsx` — SÍ usa Zod (inconsistencia)

#### 1.6 Políticas RLS demasiado permisivas
- Vendedores y gerencia pueden ver TODAS las colecciones sin filtro
- `user_feedback` visible para cualquier usuario autenticado

#### 1.7 localStorage para tokens de auth
- `src/integrations/supabase/client.ts:13` — Tokens en localStorage, accesibles por JavaScript

### MEDIO

#### 1.8 dangerouslySetInnerHTML en `chart.tsx:79`
#### 1.9 Funciones SECURITY DEFINER en migraciones SQL requieren auditoría
#### 1.10 Contraseñas almacenadas en estado React (`ProfilePage.tsx`)

---

## 2. RENDIMIENTO

### CRÍTICO

#### 2.1 Bundle de 2841KB — Sin lazy loading
**`src/App.tsx:7-54`** — 45+ páginas importadas estáticamente. Ninguna usa `React.lazy()`. Todo se carga en el bundle inicial.

**Solución:** Usar `React.lazy()` + `Suspense` para todas las páginas excepto Index y Auth.

#### 2.2 N+1 Queries en CustomersPage
**`src/pages/CustomersPage.tsx:72-105`** — Por cada cliente hace 3 queries adicionales:
1. `orders` count
2. `credit_moderna_installments`
3. `orders` last order branch

Con 100 clientes = 300 queries individuales.

### ALTO

#### 2.3 Listados sin paginación (cargan TODOS los registros)
- `CustomersPage.tsx:64-67` — `SELECT *` sin LIMIT
- `ProductsPage.tsx:75-81` — sin LIMIT
- `OrdersPage.tsx:82-96` — sin LIMIT
- `RoutesPage.tsx:38-41` — sin LIMIT
- `DeliveriesPage.tsx:42-53` — sin LIMIT
- `ReportsPage.tsx:43-70` — múltiples queries sin LIMIT

#### 2.4 N+1 en UserManagement
**`src/components/admin/UserManagement.tsx:51-74`** — 1 query por usuario para obtener email via `auth.admin.getUserById()`

### MEDIO

#### 2.5 SELECT * innecesarios en `InventoryProducts.tsx:131`
#### 2.6 Inline callbacks sin useCallback en formularios
#### 2.7 Componentes grandes sin dividir (CRMSystem.tsx 300+ líneas)

---

## 3. UI/UX

### ALTO

#### 3.1 Errores de fetch sin notificación al usuario
- `CreateDeliveryModal.tsx:77-79` — catch solo hace `console.error`, sin toast
- `CreateDeliveryModal.tsx:94-96` — idem para cadetes
- `CreateDeliveryModal.tsx:99-101` — idem para rutas
- `CreateIncidentModal.tsx:62-64` — idem para órdenes

### MEDIO

#### 3.2 Alt text genérico en avatares (`sign-in.tsx` — `alt="avatar"`)
#### 3.3 Algunos labels de botones sin texto visible

### LO QUE ESTÁ BIEN
- Botones: todos tienen onClick definido
- Links: no hay links rotos
- Formularios: todos tienen onSubmit
- Modales: todos tienen control open/close
- Responsive: correcto con Tailwind
- Estados vacíos: todos los listados tienen mensaje
- Navegación: todas las páginas de detalle tienen botón volver
- Idioma: mayormente en español

---

## 4. BASE DE DATOS Y SERVICIOS

### CRÍTICO

#### 4.1 Transacciones faltantes en operaciones multi-tabla
- **`useEcommerceCampaigns.ts:338-472`** — `useRevertCampaign()` hace múltiples updates y deletes secuenciales sin transacción. Si falla en medio = datos inconsistentes.
- **`useShopifyProducts.ts:43-82`** — Desactiva configs existentes + inserta nueva sin transacción
- **`BulkImportModal.tsx:199-238`** — Bulk import con inserts secuenciales

#### 4.2 Error handling deficiente en notificationService
- **`src/services/notificationService.ts`** — 15+ inserts/queries sin verificar error
- Queries anidadas sin manejo de error en la query interna

### ALTO

#### 4.3 Mutaciones sin invalidación completa de cache
- `useUploadWooCommerceImage()` — Sin `onSuccess`, no invalida ninguna query
- `useCreateWooCommerceVariation()` — Invalida variaciones pero no el producto
- `useUpdateWooCommerceVariation()` — Idem
- `useBatchCreateWooCommerceVariations()` — Idem

#### 4.4 Tipos `any` en servicios Supabase
| Archivo | Cantidad |
|---------|----------|
| `useWooCommerceProducts.ts` | 6 usos de `any` |
| `advancedNotificationService.ts` | 3 usos |
| `routeOptimizationService.ts` | 3 usos |
| `notificationService.ts` | 2 usos |

#### 4.5 Casteos forzados (`as Type[]`) en vez de tipos genéricos
- `useCurrencyRates.ts`, `useEcommerceCampaigns.ts`, `useFeedback.ts`, `useProductMappings.ts`, `useShopifyProducts.ts`, `useSystemUpdates.ts`

### MEDIO

#### 4.6 Lógica duplicada `callWooCommerceAPI()` en 2 archivos
#### 4.7 Subscriptions en `useAuth.ts` con setTimeout anti-patrón

---

## 5. CALIDAD DE CÓDIGO

### CRÍTICO

#### 5.1 39 console.log/error en producción
Archivos principales afectados:
- `advancedNotificationService.ts` — 11 instancias
- `routeOptimizationService.ts` — 6 instancias
- `FinancePage.tsx` — 5 instancias (incluye debug logs)
- `UserManagementPage.tsx` — 5 instancias
- `useWooCommerceProducts.ts` — 5 instancias
- `useAuth.ts` — 3 instancias
- `useNotifications.ts` — 4 instancias

### ALTO

#### 5.2 Funcionalidad simulada (no real)
- **`UserManagementPage.tsx:113-160`** — `createUser` NO llama a Supabase, solo crea en memoria con `Math.random()` como ID
- **`UserManagementPage.tsx:90`** — Emails generados con patrón fake: `user${id}@rutamod.com`
- **`advancedNotificationService.ts`** — Push, WhatsApp, SMS y email solo hacen `console.log`, no envían nada real

#### 5.3 Archivo deprecated sin eliminar
- **`src/pages/CustomersPageOld.tsx`** — Copia vieja del componente, 259 líneas de dead code

### MEDIO

#### 5.4 Anti-patrón setTimeout con async/await en `useAuth.ts:46,82`
#### 5.5 Magic numbers sin constantes (distancias en routeOptimizationService)
#### 5.6 Naming inconsistente: `loading` vs `isLoading` vs `importing`

---

## PLAN DE ACCIÓN RECOMENDADO

### Prioridad 1 — Inmediato (Seguridad)
1. Mover credenciales de Supabase a `import.meta.env` y limpiar `client.ts`
2. Agregar `.env` a `.gitignore`
3. Agregar headers de seguridad a `nginx.conf`
4. Envolver rutas sensibles con `ProtectedRoute`

### Prioridad 2 — Urgente (Rendimiento)
5. Implementar `React.lazy()` en todas las páginas de `App.tsx`
6. Resolver N+1 queries en `CustomersPage.tsx` (usar JOIN o view SQL)
7. Agregar paginación a todos los listados

### Prioridad 3 — Importante (Estabilidad)
8. Eliminar 39 `console.log/error` o reemplazar con logger configurable
9. Implementar transacciones en operaciones multi-tabla
10. Agregar toasts de error en modales (`CreateDeliveryModal`, `CreateIncidentModal`)
11. Eliminar `CustomersPageOld.tsx`

### Prioridad 4 — Mejora (Código)
12. Reemplazar funcionalidad simulada en `UserManagementPage` con llamadas reales
13. Tipar correctamente los `any` en hooks y servicios
14. Unificar `callWooCommerceAPI` en un servicio compartido
15. Estandarizar naming de estados de carga
