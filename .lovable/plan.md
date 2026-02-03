

# Corregir Cálculo de Expansion MRR

## Problema Identificado

El cálculo actual de Expansion MRR suma **todo el upsell_income acumulado** de cada cliente activo, en lugar de solo los upsells **nuevos del período**.

| Cliente | upsell_income | Situación | Expansion Real |
|---------|---------------|-----------|----------------|
| Clinica Dental | $197 | Upsell nuevo este mes | $197 |
| Cliente X | $500 | Upsell de hace 6 meses | $0 (ya contado) |
| **Total mostrado** | **$697** | | **$197** |

El sistema está re-contando upsells históricos como "nuevos" cada mes.

---

## Solución Propuesta

Similar a como se rastrea `contraction_amount` para reducciones, agregar `previous_upsell_income` para calcular solo los **upsells nuevos del período**.

### Enfoque: Comparar upsell actual vs anterior al guardar

1. **Nuevo campo**: `previous_upsell_income` - Almacena el upsell anterior antes de editar
2. **Al guardar**: Calcular `expansion_delta = upsell_income_nuevo - upsell_income_anterior`
3. **En Churn**: Sumar solo los `expansion_delta` positivos del período

---

## Alternativa Más Simple (Recomendada)

En lugar de agregar otro campo, **reutilizar la lógica existente**:

Agregar `expansion_amount` (análogo a `contraction_amount`) que acumula los incrementos de upsell:

```text
expansion_amount += MAX(0, new_upsell - previous_upsell)
```

---

## Cambios a Realizar

### Fase 1: Migración de Base de Datos

```sql
ALTER TABLE retainers 
ADD COLUMN expansion_amount numeric DEFAULT 0 NOT NULL;
```

### Fase 2: Detectar Expansiones al Guardar

**Archivo**: `src/components/Retainers/RetainerFormDialog.tsx`

```typescript
// Detectar expansión: upsell_income subió
let expansionDelta = 0;
if (initial) {
  const previousUpsell = Number((initial as any).upsell_income) || 0;
  if (upsellIncomeValue > previousUpsell) {
    expansionDelta = upsellIncomeValue - previousUpsell;
  }
}

const payload = {
  // ... otros campos
  expansion_amount: (Number((initial as any)?.expansion_amount) || 0) + expansionDelta,
};
```

### Fase 3: Usar expansion_amount en Cálculo de Churn

**Archivo**: `src/hooks/useChurnCalculator.ts`

```typescript
// ANTES - Usa todo el upsell acumulado (incorrecto)
if (wasActiveAtStart && !isNewThisPeriod && wasActiveAtEnd && !isPausedAtEnd) {
  expansionMRR += upsellIncome;
}

// DESPUÉS - Usa solo las expansiones registradas
if (wasActiveAtStart && wasActiveAtEnd && !isChurnedThisPeriod) {
  expansionMRR += Number((r as any).expansion_amount) || 0;
}
```

---

## Resultado Esperado

Con el caso de "Clinica Dental Obarrio":

| Campo | Antes | Después |
|-------|-------|---------|
| base_income | $850 | $597 |
| upsell_income | $0 | $197 |
| contraction_amount | $0 | $253 (850-597) |
| **expansion_amount** | $0 | **$197** (nuevo) |

Dashboard mostrará:
- **MRR Nuevo (Net)**: $197 (solo el upsell nuevo)
- **MRR Perdido (Gross)**: $356 (contracciones)
- **Net Effect**: $197 - $356 = -$159

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | CREAR - Nuevo campo `expansion_amount` |
| `src/integrations/supabase/types.ts` | REGENERAR - Incluir nuevo campo |
| `src/components/Retainers/RetainerFormDialog.tsx` | MODIFICAR - Detectar y guardar expansiones |
| `src/hooks/useChurnCalculator.ts` | MODIFICAR - Usar expansion_amount en lugar de upsell_income total |

---

## Nota sobre Datos Históricos

Para clientes con `upsell_income > 0` pero sin `expansion_amount` (no se rastrea cuándo ocurrió):
- Se considerará `expansion_amount = 0` (no se "re-cuenta" retroactivamente)
- Solo se rastreará hacia adelante cuando edites el cliente

Alternativamente, podemos hacer una migración para copiar `upsell_income` inicial a `expansion_amount` como punto de partida.

