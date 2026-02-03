
# Corrección del Cálculo de Contraction MRR

## Problema Identificado

El sistema actual detecta contracción comparando el **ingreso total** (base + upsell) anterior vs nuevo. Esto falla cuando hay simultáneamente:

1. **Reducción del plan base** (contracción)
2. **Venta de servicios adicionales** (expansión)

**Ejemplo del usuario:**
- Plan bajó de ~$1,000 a $597 → Contracción: $403
- Se vendió WhatsApp Bot $197 → Expansión: $197
- Sistema muestra: Net MRR = $794 (solo suma, sin contexto)

**Resultado incorrecto:** El sistema no detecta la contracción porque el total puede ser similar o compensado por el upsell.

---

## Solución

Cambiar la lógica para comparar **solo el ingreso base** entre versiones, ignorando los upsells en el cálculo de contracción.

### Lógica Corregida

```text
Antes:
  contractionDelta = previousNetIncome - newNetIncome  
  (compara totales)

Después:
  contractionDelta = previousBaseIncome - newBaseIncome  
  (compara solo base)
```

Esto permite:
- **Contracción**: Se detecta si el base_income bajó
- **Expansión**: Se rastrea independientemente via upsell_income
- **Ambos pueden ocurrir simultáneamente**

---

## Cambios a Realizar

### Archivo: `src/components/Retainers/RetainerFormDialog.tsx`

Modificar la detección de contracción (líneas 96-103):

```typescript
// ANTES - Compara totales (incorrecto)
let contractionDelta = 0;
if (initial) {
  const previousNetIncome = Number(initial.net_income) || 0;
  if (newNetIncome < previousNetIncome) {
    contractionDelta = previousNetIncome - newNetIncome;
  }
}

// DESPUÉS - Compara solo base_income
let contractionDelta = 0;
if (initial) {
  const previousBaseIncome = Number((initial as any).base_income) || 0;
  if (baseIncomeValue < previousBaseIncome) {
    contractionDelta = previousBaseIncome - baseIncomeValue;
  }
}
```

---

## Resultado Esperado

Con el ejemplo del usuario:

| Campo | Antes | Después |
|-------|-------|---------|
| base_income | $1,000 | $597 |
| upsell_income | $0 | $197 |
| net_income | $1,000 | $794 |
| **contraction_amount** | $0 | **$403** |

Dashboard mostrara:
- **Contraction MRR**: $403 (reducción del plan)
- **Expansion MRR**: $197 (WhatsApp Bot)
- **Net effect**: -$206

---

## Consideración Adicional

Si el `base_income` anterior no existe en el registro (clientes legacy importados antes de agregar el campo), usaremos `net_income` como fallback para el cálculo inicial.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Retainers/RetainerFormDialog.tsx` | Comparar `base_income` en lugar de `net_income` para detectar contracción |
