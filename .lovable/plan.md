

# Implementar Rastreo de Contraction MRR (Reducciones de Tarifa)

## Objetivo

Permitir que el sistema detecte y registre cuando un cliente reduce su tarifa mensual, para calcular correctamente el **Contraction MRR** en el análisis de Churn y obtener métricas más precisas de retención de ingresos.

---

## Situación Actual

| Campo | Estado |
|-------|--------|
| `base_income` | ✅ Existe - MRR base del cliente |
| `upsell_income` | ✅ Existe - Expansiones (aumentos) |
| `previous_income` | ❌ No existe - No se guarda el valor anterior |
| `contraction_amount` | ❌ No existe - No hay forma de registrar reducciones |
| Historial de precios | ❌ No existe - Los cambios se sobrescriben |

**Resultado**: Cuando editas el `base_income` de $1,000 a $800, el sistema pierde la información de que hubo una reducción de $200/mes.

---

## Solución Propuesta

### Estrategia: Campo `contraction_amount` + Detección Automática

En lugar de crear una tabla de historial compleja, agregaremos:

1. **Nuevo campo** `contraction_amount` en `retainers` - Acumula reducciones del período
2. **Detección automática** al guardar - Compara ingreso nuevo vs anterior
3. **Cálculo en Churn** - Usa el campo para mostrar Contraction MRR real

---

## Cambios a Realizar

### Fase 1: Migración de Base de Datos

```sql
ALTER TABLE retainers 
ADD COLUMN contraction_amount numeric DEFAULT 0 NOT NULL;

COMMENT ON COLUMN retainers.contraction_amount IS 
  'Monto acumulado de reducciones de tarifa en el período actual';
```

### Fase 2: Lógica de Detección Automática

**Archivo**: `src/components/Retainers/RetainerFormDialog.tsx`

Al guardar, comparar el `net_income` nuevo vs el anterior:

```typescript
const handleSubmit = async () => {
  const newNetIncome = baseIncomeValue + upsellIncomeValue;
  const previousNetIncome = initial?.net_income ?? 0;
  
  // Detectar contracción
  let contractionDelta = 0;
  if (initial && newNetIncome < previousNetIncome) {
    contractionDelta = previousNetIncome - newNetIncome;
  }
  
  const payload = {
    // ... otros campos
    net_income: newNetIncome,
    contraction_amount: (initial?.contraction_amount ?? 0) + contractionDelta,
  };
};
```

### Fase 3: Actualizar Cálculo de Churn

**Archivo**: `src/hooks/useChurnCalculator.ts`

```typescript
// Revenue Contraction - suma de todas las reducciones
if (wasActiveAtStart && !isChurnedThisPeriod && wasActiveAtEnd) {
  contractionMRR += Number((r as any).contraction_amount) || 0;
}

// Gross Revenue Churn ahora incluye contracciones reales
const grossRevenueChurn = churnedMRR + contractionMRR;
```

### Fase 4: UI para Visualizar Contracciones

**Archivo**: `src/components/Retainers/ChurnMetricsCard.tsx`

Agregar indicador visual cuando hay contracción:

```text
┌─────────────────────────────────────────────┐
│  Revenue Churn                              │
├─────────────────────────────────────────────┤
│  Cancelaciones:        $2,500               │
│  Contracciones:        $450    ← NUEVO      │
│  ─────────────────────────────              │
│  Gross Revenue Churn:  $2,950               │
│                                             │
│  Expansiones:          +$800                │
│  Net Revenue Churn:    $2,150               │
└─────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| Migración SQL | CREAR - Nuevo campo `contraction_amount` |
| `src/integrations/supabase/types.ts` | REGENERAR - Incluir nuevo campo |
| `src/components/Retainers/RetainerFormDialog.tsx` | MODIFICAR - Detectar y guardar contracciones |
| `src/hooks/useChurnCalculator.ts` | MODIFICAR - Incluir contractionMRR real |
| `src/components/Retainers/ChurnMetricsCard.tsx` | MODIFICAR - Mostrar contracciones en UI |

---

## Flujo de Usuario

```text
Usuario edita retainer "Cliente ABC"
    │
    ▼
Ingreso base: $1,000 → $800 (reducción de $200)
    │
    ▼
Sistema detecta: newIncome < previousIncome
    │
    ▼
Guarda: contraction_amount = 0 + 200 = $200
    │
    ▼
Dashboard Churn muestra:
  • Contraction MRR: $200
  • Gross Revenue Churn: (cancelaciones) + $200
```

---

## Consideraciones

### Reset Mensual

El campo `contraction_amount` podría:
- **Opción A**: Acumularse indefinidamente (historial total)
- **Opción B**: Resetearse cada mes (solo período actual)

**Recomendación**: Opción A (acumulativo) porque:
1. Más simple de implementar
2. Permite análisis histórico
3. El cálculo de Churn ya filtra por período con `wasActiveAtStart`

### Expansiones que Compensan Contracciones

Si un cliente baja de $1,000 a $800 y luego sube a $900:
- Contracción registrada: $200
- Upsell registrado: $100
- **Net effect**: -$100 (visible en Net Revenue Churn)

---

## Métricas Mejoradas

Con este cambio, el análisis de Churn mostrará:

| Métrica | Antes | Después |
|---------|-------|---------|
| Contraction MRR | Siempre $0 | Valor real |
| Gross Revenue Churn | Solo cancelaciones | Cancelaciones + Contracciones |
| Net Revenue Retention | Incompleto | (EndingMRR + Contraction) / StartingMRR |

---

## Detalles Técnicos

### Tipos TypeScript

```typescript
// En RetainerRow
contraction_amount: number; // Nuevo campo

// En ChurnMetrics (ya existe, ahora con valor real)
contractionMRR: number;
```

### Validación

- `contraction_amount` nunca puede ser negativo
- Solo se incrementa cuando `newNetIncome < previousNetIncome`
- No se decrementa automáticamente (es acumulativo)

