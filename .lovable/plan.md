

## Plan: Agregar creación de categorías/subcategorías WooCommerce inline

### Cambios en `src/components/forms/CreateProductModal.tsx`

1. **Importar `useCreateWooCommerceCategory`** desde `@/hooks/useWooCommerceCategories` (ya existe el hook).

2. **Agregar estado local** para el flujo de creación inline:
   - `showCreateWooCategory: boolean` — checkbox para mostrar/ocultar el formulario
   - `newWooCategoryName: string` — nombre de la nueva categoría
   - `newWooCategoryParent: number` — ID del padre (0 = raíz, o ID de categoría raíz para subcategoría)

3. **Agregar UI debajo de la lista jerárquica de categorías**:
   - Un checkbox "Crear nueva categoría"
   - Al activarse, muestra: campo de texto para nombre + selector de "Categoría padre" (opciones: "Ninguna (raíz)" + lista de categorías raíz existentes)
   - Botón "Crear" que llama a `useCreateWooCommerceCategory` y al completarse invalida la query de categorías para refrescar la lista
   - Al crearse exitosamente, se auto-selecciona la nueva categoría en `wooFormData.categories`

4. **Invalidar queries** tras crear la categoría para que la lista se actualice inmediatamente.

### Sección técnica

- Se reutiliza el hook `useCreateWooCommerceCategory` que ya maneja la llamada a la edge function y los toasts
- El selector de padre solo muestra categorías con `parent === 0` (máximo un nivel de profundidad)
- No requiere cambios en edge functions ni tipos adicionales

