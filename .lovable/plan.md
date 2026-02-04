

# Mover Panel de Análisis OPEX al Dashboard Financiero

## Objetivo

Reubicar el componente `OpexAnalysisPanel` de la página de Retainers al Dashboard Financiero, donde hace más sentido contextual ya que:
- Los datos de OPEX real provienen de Zoho (ya cargados en el Dashboard)
- El presupuesto OPEX viene del `monthly_balances` (ya disponible en Dashboard)
- Permite ver gastos presupuestados vs reales junto con el resto de métricas financieras

---

## Cambios a Realizar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/components/Dashboard/DashboardContent.tsx` | MODIFICAR | Agregar `OpexAnalysisPanel` después de `FinancialPredictionCard` |
| `src/pages/Retainers.tsx` | MODIFICAR | Remover `OpexAnalysisPanel` del `ProfitabilityDashboardSection` |

---

## Ubicación Propuesta en Dashboard

```text
┌─────────────────────────────────────────┐
│  SalaryCalculator                       │
├─────────────────────────────────────────┤
│  PersonalSalaryCalculator               │
├─────────────────────────────────────────┤
│  RefinedFinancialSummary                │
├─────────────────────────────────────────┤
│  ReceivablesManager                     │
├─────────────────────────────────────────┤
│  FinancialPredictionCard                │
├─────────────────────────────────────────┤
│  OpexAnalysisPanel  ← NUEVO AQUÍ        │
├─────────────────────────────────────────┤
│  TransactionCategorySummary             │
├─────────────────────────────────────────┤
│  Transacciones                          │
└─────────────────────────────────────────┘
```

---

## Detalle Técnico

### DashboardContent.tsx

Importar el componente y pasarle el `totalMRR`. Como en el Dashboard no tenemos el MRR de retainers directamente, usaremos el ingreso neto de Zoho (`regularIncome`) como aproximación del ingreso recurrente mensual:

```typescript
import { OpexAnalysisPanel } from '@/components/Retainers/OpexAnalysisPanel';

// Dentro del JSX, después de FinancialPredictionCard:
<OpexAnalysisPanel totalMRR={regularIncome + stripeNet} />
```

### Retainers.tsx

Remover la línea que renderiza `OpexAnalysisPanel` del `ProfitabilityDashboardSection`:

```typescript
// Antes:
<ProfitabilityDashboard ... />
<OpexAnalysisPanel totalMRR={totalMRR} />

// Después:
<ProfitabilityDashboard ... />
```

---

## Consideraciones

- El panel seguirá usando `FinancialDataContext` para obtener los datos de OPEX
- Como el Dashboard ya tiene toda la data, el panel mostrará información correcta inmediatamente
- El `totalMRR` se calculará como `regularIncome + stripeNet` (ingreso total del período)

