
# Corregir Error de Selección de Facturas Stripe

## Problema Identificado

Al intentar seleccionar facturas de Stripe en la sección de Receivables, aparece el error **"Error updating selection"**.

### Causa Raíz

El código en `useReceivablesData.tsx` está enviando `user_id: null` en el upsert:

```typescript
// Línea 280 actual
user_id: null, // Set to null for anonymous access
```

Pero las políticas RLS actuales requieren autenticación y los registros existentes tienen `user_id` asignado correctamente.

### Flujo del Error

```text
Usuario hace clic en checkbox
       ↓
handleItemToggle() en StripeReceivablesSection
       ↓
updateSelection() en useReceivablesData
       ↓
supabase.upsert({ user_id: null, ... })  ← PROBLEMA
       ↓
Conflicto con RLS o constraint
       ↓
"Error updating selection"
```

---

## Solución

Modificar `updateSelection` para obtener el `user_id` del usuario autenticado en lugar de usar `null`.

### Cambio Requerido

**Archivo**: `src/hooks/useReceivablesData.tsx`

**Antes** (líneas 262-283):
```typescript
const updateSelection = async (...) => {
  try {
    const { error } = await supabase
      .from('receivables_selections')
      .upsert({
        selection_type: selectionType,
        item_id: itemId,
        selected,
        amount,
        metadata,
        user_id: null, // ← PROBLEMA: null en lugar de user_id real
      }, {
        onConflict: 'selection_type,item_id'
      });
```

**Después**:
```typescript
const updateSelection = async (...) => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      toast.error('Please log in to save selections');
      return false;
    }
    
    const { error } = await supabase
      .from('receivables_selections')
      .upsert({
        selection_type: selectionType,
        item_id: itemId,
        selected,
        amount,
        metadata,
        user_id: user.id, // ← CORREGIDO: usar el ID del usuario autenticado
      }, {
        onConflict: 'selection_type,item_id'
      });
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useReceivablesData.tsx` | Modificar `updateSelection` para obtener y usar `user.id` |

---

## Impacto

- Las selecciones se guardarán correctamente asociadas al usuario
- Se eliminará el error "Error updating selection"
- Los checkboxes funcionarán como se espera

---

## Nota sobre Errores de Red

Los logs también muestran errores "Failed to fetch" para `monthly_balances`. Esto parece ser un problema de conectividad temporal separado, pero no es la causa del error de selección que reportas.
