
# Nueva Pestaña "Producto Web" en el Modal de Crear Producto

## Objetivo
Agregar una segunda pestaña llamada "Producto Web" dentro del modal `CreateProductModal` existente en `/products`. Esta pestaña permitirá crear el producto en WooCommerce al mismo tiempo que se crea el producto interno, pre-llenando el nombre y la marca desde los datos ya ingresados en la primera pestaña. Los precios del producto web estarán fijados siempre en Pesos Uruguayos (UYU), independientemente de la moneda del producto interno.

---

## Análisis del Estado Actual

### `CreateProductModal.tsx`
- Es un `Dialog` con un único `<form>` que usa `react-hook-form` con validación Zod.
- Contiene campos: nombre, precios (lista 1 y lista 2), costo, moneda, garantía, código proveedor, categoría, marca, variantes y precio automático.
- Al guardar exitosamente (`onSubmit`), inserta en la tabla `products` de Supabase.

### `ProductWooCommerceModal.tsx`
- Modal independiente que usa estado local (`useState`) para el formulario.
- Llama a la edge function `woocommerce-products` vía el hook `useCreateWooCommerceProduct`.
- Soporta productos simples y variables, con manejo de imágenes, categorías WooCommerce y variaciones.

### Flujo WooCommerce
- El hook `useCreateWooCommerceProduct` → `callWooCommerceAPI('/products', 'POST', data)` → Edge Function.
- Las categorías WooCommerce se obtienen con `useWooCommerceCategories`.
- Las imágenes se suben a Supabase Storage (`woocommerce-images`) y se envían como URLs.

---

## Diseño de la Solución

### Estructura con Tabs
El modal pasará de tener un único formulario a tener dos pestañas usando el componente `Tabs` de Radix ya disponible:

```
[ Pestaña: Producto Interno ] [ Pestaña: Producto Web (WooCommerce) ]
```

La pestaña "Producto Web" es **opcional**: si el usuario no la completa, simplemente se crea solo el producto interno (comportamiento actual).

### Lógica de Pre-llenado
Cuando el usuario cambia a la pestaña "Producto Web", los campos se sincronizan automáticamente desde los valores del formulario principal:
- **Nombre**: `watch("name")` → `wooFormData.name`
- **Descripción corta**: se puede completar como marca + nombre (ej: "Samsung TV 55\"")

### Precio siempre en UYU
- El campo de precio en la pestaña WooCommerce **no tiene selector de moneda**.
- Se muestra un badge/etiqueta fija "🇺🇾 UYU" junto al campo de precio regular.
- Si el producto interno tiene moneda USD, aparece un aviso: "El precio web debe ingresarse en pesos uruguayos".

---

## Campos de la Pestaña "Producto Web"

### Sección 1: Información básica (pre-llenada)
- **Nombre** (pre-llenado desde pestaña 1, editable)
- **Tipo**: Simple / Variable (select)
- **Descripción corta** (Textarea, opcional)

### Sección 2: Precio en UYU
- **Precio Regular** (en UYU, sin opción de cambiar moneda)
- **Precio en oferta** (opcional, aparece si toggle "En Oferta" está activo)
- Badge indicativo: "Precio en Pesos Uruguayos (UYU)"

### Sección 3: Estado y visibilidad
- Toggle: Publicado / Borrador
- Toggle: Destacado

### Sección 4: Categorías WooCommerce
- Badges clickeables con las categorías de WooCommerce (igual que en `ProductWooCommerceModal`)

### Sección 5: Imágenes (opcional)
- Componente `WooCommerceImageUpload` existente

---

## Implementación Técnica

### Solo un archivo modificado: `CreateProductModal.tsx`

Se añadirá:
1. Importación de `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` de Radix.
2. Importación de `useCreateWooCommerceProduct` y `useWooCommerceCategories`.
3. Importación de `WooCommerceImageUpload`.
4. Un estado local `wooFormData` para los datos de la pestaña web (independiente de react-hook-form).
5. Un estado `createWooProduct` (boolean) para indicar si el usuario quiere crear el producto web también.
6. Un `useEffect` que sincroniza `name` y `brand` del formulario principal → `wooFormData` cuando cambian.

### Flujo de guardado modificado (`onSubmit`)

```
1. Crear producto interno (Supabase) — siempre
2. Si createWooProduct === true Y campos web mínimos completados (nombre + precio):
   → llamar useCreateWooCommerceProduct con los datos de wooFormData
   → mostrar toast de éxito/error por separado
3. Cerrar modal
```

El guardado del producto web es **independiente**: si falla WooCommerce, el producto interno ya se creó y se muestra un toast de advertencia explicando que el producto interno se creó pero el web falló.

### Estado local para WooCommerce (dentro de CreateProductModal)

```typescript
const [wooFormData, setWooFormData] = useState({
  name: '',
  type: 'simple' as 'simple' | 'variable',
  short_description: '',
  regular_price: '',       // siempre UYU
  sale_price: '',
  on_sale: false,
  status: 'publish' as 'publish' | 'draft',
  featured: false,
  categories: [] as number[],
  images: [] as string[],
});

const [createWooProduct, setCreateWooProduct] = useState(false);
```

### Sincronización automática nombre/marca

```typescript
const watchedName = form.watch("name");
const watchedBrand = form.watch("brand");

useEffect(() => {
  if (watchedName) {
    setWooFormData(prev => ({
      ...prev,
      name: watchedBrand && watchedBrand !== 'none'
        ? `${watchedBrand} ${watchedName}`
        : watchedName,
    }));
  }
}, [watchedName, watchedBrand]);
```

### Aviso de moneda USD

```typescript
const watchedCurrency = form.watch("currency");
// Si currency === 'USD', mostrar alerta en la pestaña web:
// "Este producto tiene precio en USD. Ingresá el precio equivalente en pesos uruguayos para la web."
```

---

## Cambios de UI en el Modal

### Antes:
```
Dialog → Form único
```

### Después:
```
Dialog →
  Tabs
    TabsList: ["Producto Interno", "Producto Web"]
    TabsContent "interno": (todo el formulario actual)
    TabsContent "web":
      - Toggle "Publicar también en la tienda web"
      - [si toggle ON]: formulario web simplificado con UYU fijo
      - [si toggle OFF]: mensaje "Activá esta opción para crear el producto en la tienda web al mismo tiempo"
```

El tamaño del modal se ajusta de `sm:max-w-[800px]` a `sm:max-w-[900px]` para acomodar mejor las dos pestañas.

---

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `src/components/forms/CreateProductModal.tsx` | MODIFICAR — Agregar Tabs, estado wooFormData, lógica de guardado dual |

No se necesitan nuevos archivos. Se reutilizan hooks y componentes ya existentes.

---

## Casos Borde

- **Sin configuración WooCommerce**: Si la edge function falla por falta de configuración, se muestra un toast específico indicando que el producto interno se creó bien pero el web no pudo crearse.
- **Precio vacío en WooCommerce**: La pestaña web solo intentará crear si el precio regular está completado.
- **Usuario ignora la pestaña web**: Si nunca activa el toggle, el comportamiento es exactamente igual al actual.
