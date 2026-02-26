

## Bug: "Crear nueva categoría" checkbox doesn't work

**Root Cause** (line 311 in `CreateProductModal.tsx`):
```typescript
// Current (broken):
finalCategory = newCategory.name;  // Sets category NAME as category_id

// Fix:
finalCategory = newCategory.id;    // Should set category ID
```

When the checkbox is enabled, the category IS created in the database, but the product gets the category's name stored as `category_id` instead of its UUID. Since `category_id` is a text field (not a foreign key), no database error is thrown — it just silently stores the wrong value.

## Implementation

1. **Fix line 311** in `src/components/forms/CreateProductModal.tsx`: Change `finalCategory = newCategory.name` to `finalCategory = newCategory.id`

This single-line fix ensures the newly created category's UUID is correctly assigned to the product.

