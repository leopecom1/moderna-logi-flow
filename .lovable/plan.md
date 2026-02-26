

## Plan: Organizar categorías WooCommerce por raíz/subcategorías con creación jerárquica

### Cambios en `src/components/forms/CategoriesWooCommerceModal.tsx`

1. **Agrupar categorías en estructura de árbol**: Procesar el array plano de categorías usando el campo `parent` para construir una jerarquía (raíz = `parent === 0`, subcategorías = `parent === id_de_raíz`).

2. **Renderizar lista jerárquica**: Reemplazar la tabla plana por una vista con acordeón/collapsible donde:
   - Las categorías raíz se muestran como encabezados expandibles con nombre, slug, cantidad de productos y acciones (editar/eliminar)
   - Las subcategorías aparecen indentadas debajo de su padre con las mismas acciones
   - Las categorías sin hijos se muestran sin expandir

3. **Mejorar el selector "Categoría Padre"**: En el formulario de creación/edición, mostrar solo categorías raíz (`parent === 0`) como opciones de padre, evitando anidar más de un nivel (consistente con WooCommerce).

4. **Botones rápidos de "Crear subcategoría"**: Agregar un botón junto a cada categoría raíz que pre-seleccione esa categoría como padre en el formulario, facilitando la creación de subcategorías.

5. **Mantener búsqueda funcional**: El filtro de búsqueda mostrará tanto categorías raíz como subcategorías que coincidan, mostrando la raíz si alguna subcategoría coincide.

### Sección técnica

- Archivo único: `src/components/forms/CategoriesWooCommerceModal.tsx`
- Se usa `Collapsible` de Radix UI (ya instalado) para expandir/contraer subcategorías
- La agrupación se hace client-side con `useMemo` sobre el array de categorías existente
- No requiere cambios en edge functions ni en la API de WooCommerce (la data de `parent` ya viene en la respuesta)
- No requiere migraciones de base de datos

