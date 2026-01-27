
# Integrar Upsells en Cálculo de Churn

## Problema Actual

El cálculo de churn en `useChurnCalculator.ts` no considera:
- **Expansion MRR**: Ingresos adicionales por upsells a clientes existentes
- **Contraction MRR**: Reducción de ingresos si un cliente baja de plan

Actualmente:
- `newMRR` = solo clientes nuevos
- `churnedMRR` = solo clientes cancelados

## Solución Propuesta

Usar el campo `upsell_income` existente para calcular Expansion MRR:

```text
+---------------------------+---------------------------------------------+
| Métrica                   | Cálculo                                     |
+---------------------------+---------------------------------------------+
| Expansion MRR             | Suma de upsell_income de clientes activos   |
| Net New MRR               | newMRR + expansionMRR                       |
| Gross Revenue Churn       | churnedMRR + contractionMRR                 |
| Net Revenue Retention     | (startingMRR + expansion - churn) / start   |
+---------------------------+---------------------------------------------+
```

## Cambios en ChurnMetrics

Agregar al tipo `ChurnMetrics`:

| Campo | Descripción |
|-------|-------------|
| `expansionMRR` | Suma de upsell_income de clientes activos |
| `contractionMRR` | Para futuro: cuando se baje un plan |
| `netNewMRR` | newMRR + expansionMRR |
| `grossRevenueChurn` | churnedMRR + contractionMRR |

## Cambios en UI (Retainers.tsx)

Actualizar las cards de churn para mostrar:

```text
+---------------------+---------------------+
| MRR Nuevo           | MRR Perdido         |
| $2,500              | $400                |
| (+$1,500 expansion) | (contraction: $0)   |
+---------------------+---------------------+
```

## Sobre Contraction MRR

Para trackear reducciones de plan necesitaríamos:
1. Guardar el ingreso anterior cuando se edita un cliente
2. O crear historial de cambios de ingresos

Por ahora, podemos calcular Expansion MRR usando `upsell_income` y dejar Contraction MRR en 0 (o implementar historial después).

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useChurnCalculator.ts` | Agregar expansionMRR, netNewMRR al cálculo |
| `src/pages/Retainers.tsx` | Mostrar expansionMRR en las cards de churn |

---

## Sección Técnica

### Lógica en useChurnCalculator.ts

```typescript
// Nuevo en el loop
const upsellIncome = Number((r as any).upsell_income) || 0;

// Para clientes activos que existían antes del período
if (wasActiveAtStart && !isNewThisPeriod && wasActiveAtEnd && !isPausedAtEnd) {
  expansionMRR += upsellIncome;
}

// Nuevas métricas
const netNewMRR = newMRR + expansionMRR;
const grossRevenueChurn = churnedMRR + contractionMRR;
```

### Vista en UI

```
MRR Nuevo: $2,500
├── Clientes nuevos: $1,000
└── Expansion (upsells): $1,500

MRR Perdido: $400
├── Cancelaciones: $400
└── Contraction: $0
```

---

## Consideración Importante

Este enfoque asume que todos los `upsell_income` son expansión del período actual. Si necesitas trackear cuándo ocurrió cada upsell, se requeriría:
1. Agregar campo `upsell_date` a retainers, o
2. Crear tabla de historial de cambios de ingresos

Por ahora, el enfoque simple funciona para ver el impacto de upsells en las métricas de churn.
