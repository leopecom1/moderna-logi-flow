
Objetivo: corregir el flujo “Crear nueva categoría” en `CreateProductModal` para que sí ejecute el submit y cree categoría + producto.

1) Corregir validación condicional del formulario en `src/components/forms/CreateProductModal.tsx`
- Cambiar `formSchema` para que:
  - `category` no sea obligatoria cuando `createNewCategory === true`.
  - `newCategoryName` sea obligatoria (y con `trim`) cuando `createNewCategory === true`.
- Implementar con `superRefine` (o `discriminated union`) para evitar bloqueos silenciosos de `handleSubmit`.

2) Sincronizar estado al alternar el checkbox “Crear nueva categoría”
- Al activar:
  - limpiar `category` (`""` o `none` según patrón actual).
- Al desactivar:
  - limpiar `newCategoryName`.
- Evita que queden valores inválidos ocultos y mejora UX.

3) Endurecer guardas en `onSubmit`
- Si `createNewCategory` está activo y `newCategoryName` está vacío, mostrar `toast` destructivo y abortar explícitamente.
- Mantener `finalCategory = newCategory.id` (ya corregido) y validar que exista antes de insertar producto.

4) Corregir warning de React en el selector de categorías
- Reemplazar el uso de `<React.Fragment>` dentro de `SelectContent` (en el `map`) por elementos renderizados sin Fragment.
- Esto elimina el warning `Invalid prop data-lov-id supplied to React.Fragment` y evita comportamiento inesperado en Radix Select.

5) Validación funcional post-fix (E2E)
- Caso A: checkbox OFF + categoría existente → crea producto.
- Caso B: checkbox ON + nombre nueva categoría → crea categoría en `categories` y producto con `category_id` UUID correcto.
- Caso C: checkbox ON + nombre vacío → muestra error visible, no submit silencioso.
- Verificar también que la categoría nueva aparezca luego en el selector (refetch/listado actualizado).

Sección técnica (resumen):
- Archivo principal: `src/components/forms/CreateProductModal.tsx`.
- Problema real actual: validación de Zod exige `category` siempre (`min(1)`), pero el campo queda oculto cuando se usa nueva categoría; eso bloquea `handleSubmit` sin pasar por `try/catch` ni mostrar toast.
- Hallazgo complementario: warning de Fragment en el render del Select, consistente con los logs compartidos.
