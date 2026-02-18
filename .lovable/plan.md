
# Configuración de Stock Web + Asociación de Producto WooCommerce

## Diagnóstico completo del estado actual

### Base de datos (`products`)
La tabla `products` actualmente **no tiene ninguna columna** que vincule el producto interno con WooCommerce ni que almacene la configuración de stock web. Toda la relación existe solo del lado de WooCommerce (WooCommerce guarda su propio stock). Se necesita agregar columnas nuevas al schema.

### Flujo de WooCommerce
El hook `useCreateWooCommerceProduct` llama a la edge function `woocommerce-products` con el payload de creación. La API de WooCommerce gestiona su propio stock internamente (`manage_stock`, `stock_quantity`, `backorders`).

### Puntos de entrada en el código
- **`CreateProductModal.tsx`** — ya tiene la pestaña "Producto Web" (implementada en el paso anterior)
- **`EditProductModal.tsx`** — solo tiene el formulario interno, sin pestaña web
- **`InventoryProducts.tsx`** — muestra productos en inventario, sin ningún vínculo a WooCommerce
- **`ProductsPage.tsx`** — tabla de productos `/products`, donde ya existe el `EditProductModal`

---

## Schema nuevo necesario

Se agrega a la tabla `products` las siguientes columnas:

```sql
-- Vinculación con WooCommerce
woocommerce_product_id INTEGER NULL  -- ID del producto en WooCommerce (null = sin producto web)

-- Configuración de stock para la tienda web
web_stock_mode TEXT DEFAULT 'virtual' 
  CHECK (web_stock_mode IN ('virtual', 'real', 'disabled'))
  -- 'virtual'  = stock simulado fijo (umbral)
  -- 'real'     = stock real del depósito
  -- 'disabled' = sin gestión de stock (siempre "en stock")

web_virtual_stock INTEGER DEFAULT 10  -- cantidad a mostrar si modo virtual
web_stock_warehouse_id UUID NULL REFERENCES warehouses(id)
  -- si NULL en modo 'real' → suma todos los depósitos
  -- si tiene valor en modo 'real' → usa ese depósito específico
```

---

## Qué se implementa

### 1. Migración de base de datos
Nueva migración SQL con los 4 campos sobre `products`. Políticas RLS ya cubiertas por las existentes (gerencia/vendedor ALL).

### 2. Pestaña "Producto Web" en `CreateProductModal` — ampliar campos de stock

Se agrega dentro del formulario de la pestaña web (que ya existe), **debajo del precio**, una nueva sección "Configuración de Stock":

```
Gestión de Stock en la tienda web
  ○ Sin gestión de stock (siempre disponible)
  ○ Stock Virtual Simulado  → campo: "Cantidad a mostrar"  (ej: 10)
  ○ Stock Real del Depósito → selector de depósito
       [Todos los depósitos]
       [Depósito Principal]
       [Depósito Secundario]
```

Al guardar, si `createWooProduct = true`, el payload enviado a WooCommerce ya incluye:
- `manage_stock: true/false`  
- `stock_quantity: N` (si virtual o real)
- `backorders: 'no'`

Y en Supabase se persiste:
- `woocommerce_product_id` = el ID retornado por WooCommerce
- `web_stock_mode` = 'virtual' | 'real' | 'disabled'
- `web_virtual_stock` = N
- `web_stock_warehouse_id` = UUID | null

### 3. Ampliar `EditProductModal` — agregar pestaña "Producto Web"

El `EditProductModal` actualmente solo tiene el formulario interno en `sm:max-w-[500px]`. Se convierte en un modal con Tabs igual al de creación:

**Pestaña 1: Producto Interno** — exactamente igual que ahora  
**Pestaña 2: Producto Web** — muestra uno de dos estados:

**Estado A — Producto SIN producto web (`woocommerce_product_id = null`)**:
```
┌─────────────────────────────────────────────────────┐
│  Este producto no tiene un producto web asociado.   │
│                                                     │
│  [Crear nuevo en WooCommerce]  [Asociar existente]  │
└─────────────────────────────────────────────────────┘
```

**Estado B — Producto CON producto web (`woocommerce_product_id != null`)**:
```
┌─────────────────────────────────────────────────────┐
│  ✓ Vinculado a WooCommerce ID: 12345                │
│                                                     │
│  Configuración de Stock Web:                        │
│  ○ Sin gestión  ○ Virtual [10]  ○ Real [Depósito ▼] │
│                                                     │
│  [Guardar cambios de stock]  [Desvincular]         │
└─────────────────────────────────────────────────────┘
```

### 4. Lógica de "Asociar producto web existente"

Un sub-modal (Dialog dentro del Dialog) que:
1. Carga la lista de productos de WooCommerce (usando `useWooCommerceProducts`)
2. Permite buscar por nombre
3. Al seleccionar, llama a `supabase.from('products').update({ woocommerce_product_id: N })` y actualiza la configuración de stock

### 5. Badge en `ProductsPage` (tabla de productos)

En la columna "Estado" o una nueva columna "Web" de la tabla en `/products`, mostrar:
- Badge `🌐 Web` verde si `woocommerce_product_id != null`
- Badge `Sin web` gris si `woocommerce_product_id = null`

### 6. `InventoryProducts.tsx` — botón "Asociar web" en productos sin vinculación

En la vista tabla de inventario (`/inventory`), en la columna de acciones de cada producto, agregar un botón pequeño `Asociar web` si `woocommerce_product_id = null`. Al hacer click, abre el mismo sub-modal de búsqueda y asociación.

---

## Flujo de sincronización de stock real

Cuando `web_stock_mode = 'real'`, la cantidad enviada a WooCommerce se calcula al momento de guardar:

```
Si web_stock_warehouse_id != null:
  stock = inventory_items.current_stock WHERE product_id = X AND warehouse_id = Y

Si web_stock_warehouse_id = null (todos):
  stock = SUM(inventory_items.current_stock) WHERE product_id = X
```

Esta sincronización ocurre **en el momento de guardar la configuración** (al crear o editar). No es tiempo real automático — es una sincronización manual bajo demanda. Si el usuario quiere actualizar el stock en WooCommerce, lo hace desde el modal de edición.

> Nota: sincronización automática en tiempo real requeriría webhooks o cron jobs que están fuera del scope de esta implementación.

---

## Implementación técnica detallada

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `supabase/migrations/[nueva].sql` | CREAR — 4 columnas nuevas en `products` |
| `src/components/forms/CreateProductModal.tsx` | MODIFICAR — agregar sección de stock web + guardar `woocommerce_product_id` |
| `src/components/forms/EditProductModal.tsx` | MODIFICAR — agregar Tabs, pestaña web completa con los 2 estados |
| `src/pages/ProductsPage.tsx` | MODIFICAR — agregar badge de vinculación web en la tabla |
| `src/components/inventory/InventoryProducts.tsx` | MODIFICAR — agregar botón "Asociar web" en tabla |

No se requieren nuevos archivos de componentes — todo se implementa dentro de los modales existentes.

---

## Detalles de la sección de stock en el formulario web

### Estado del formulario local en CreateProductModal (ampliación)

```typescript
const [wooStockConfig, setWooStockConfig] = useState<{
  mode: 'disabled' | 'virtual' | 'real';
  virtual_quantity: number;
  warehouse_id: string | null; // null = todos
}>({
  mode: 'virtual',
  virtual_quantity: 10,
  warehouse_id: null,
});
```

### Construcción del payload a WooCommerce

```typescript
// Calcular stock a enviar
let stockPayload: { manage_stock: boolean; stock_quantity?: number } = {
  manage_stock: false
};

if (wooStockConfig.mode === 'virtual') {
  stockPayload = { manage_stock: true, stock_quantity: wooStockConfig.virtual_quantity };
} else if (wooStockConfig.mode === 'real') {
  // Consultar stock real de Supabase
  const stockData = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('product_id', product.id)
    .then(({ data }) => {
      if (!wooStockConfig.warehouse_id) {
        return data?.reduce((sum, item) => sum + item.current_stock, 0) ?? 0;
      }
      return data?.find(i => i.warehouse_id === wooStockConfig.warehouse_id)?.current_stock ?? 0;
    });
  stockPayload = { manage_stock: true, stock_quantity: stockData };
}
```

### Guardado en Supabase (tras crear el producto en WooCommerce)

```typescript
const wooResponse = await createWooMutation.mutateAsync(wooPayload);

// Guardar el ID y configuración de stock
await supabase.from('products').update({
  woocommerce_product_id: wooResponse.id,
  web_stock_mode: wooStockConfig.mode,
  web_virtual_stock: wooStockConfig.mode === 'virtual' ? wooStockConfig.virtual_quantity : null,
  web_stock_warehouse_id: wooStockConfig.mode === 'real' ? wooStockConfig.warehouse_id : null,
}).eq('id', product.id);
```

---

## UI de la sección de stock en el modal

```
─── Configuración de Stock en la Tienda Web ───────────────────

  ¿Cómo gestionar el stock online?

  ( ) Sin gestión de stock
      El producto siempre aparecerá como "En stock"

  (●) Stock Virtual Simulado
      Muestra una cantidad fija sin importar el inventario real
      Cantidad a mostrar: [ 10 ]

  ( ) Stock Real del Depósito
      Sincroniza el stock desde el inventario de tu depósito
      Depósito de referencia: [ Todos los depósitos ▼ ]
      Stock actual calculado: 42 unidades

───────────────────────────────────────────────────────────────
```

---

## Casos borde manejados

- **Sin inventario**: si `web_stock_mode = 'real'` y el producto no tiene stock en inventario, se envía `stock_quantity: 0` a WooCommerce (no falla)
- **Desvinculación**: al desvincular, se borra `woocommerce_product_id` y se resetean los campos de stock web en Supabase. El producto en WooCommerce NO se elimina (solo se desvincula)
- **Asociación de existente**: no cambia el precio ni el nombre en WooCommerce, solo guarda el ID localmente y configura la gestión de stock
- **Producto sin `woocommerce_product_id` en `CreateProductModal`**: si el usuario no activa el toggle de producto web, no se tocan los nuevos campos (quedan null)
- **Query de inventory_items**: si el producto aún no tiene ítem en inventario al momento de crear, el stock real será 0 (comportamiento correcto)
