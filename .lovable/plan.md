

# Dashboard de Análisis OPEX: Presupuesto vs Real

## Objetivo

Visualizar el **OPEX controlable** (colaboradores + herramientas/servicios de Zoho) vs tu presupuesto mental, para saber cuánto margen tienes para contratar o invertir.

---

## Definición de OPEX Real

| Incluido | Fuente | Ejemplo |
|----------|--------|---------|
| Colaboradores | Zoho - categoría "Pagos a colaboradores" | $8,000 |
| Otros Gastos | Zoho - otras transacciones expense | $2,500 |
| **Total OPEX Real** | | **$10,500** |

**Excluido**: Stripe fees (no controlables, proporcionales a ingresos)

---

## Visualización Propuesta

```text
┌────────────────────────────────────────────────────────────────────┐
│  Análisis OPEX                                                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ Presupuesto│  │ Real       │  │ Diferencia │  │ Disponible │   │
│  │ (Mental)   │  │ (Zoho)     │  │            │  │ p/Crecer   │   │
│  │ $13,000    │  │ $10,500    │  │ +$2,500    │  │ $6,200     │   │
│  │            │  │            │  │ bajo pres. │  │ /mes       │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                    │
│  Desglose:                                                         │
│  ├─ Colaboradores:     $8,000  (76%)                              │
│  └─ Otros Gastos:      $2,500  (24%)                              │
│                                                                    │
│  Insights:                                                         │
│  • Tienes ~$2,500/mes bajo tu presupuesto                         │
│  • Margen para 1 contratación de ~$1,500 sin riesgo               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Métricas Clave

| Métrica | Cálculo | Para qué sirve |
|---------|---------|----------------|
| **OPEX Presupuestado** | `monthly_balances.opex_amount` | Lo que esperas gastar |
| **OPEX Real** | Colaboradores + Otros (Zoho) | Lo que realmente gastas |
| **Varianza** | Presupuesto - Real | Indica si estás sobre/bajo |
| **Disponible para Crecer** | MRR Total - OPEX Real Promedio | Margen para inversión |

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/hooks/useOpexAnalysis.ts` | CREAR | Hook para calcular OPEX real vs presupuestado |
| `src/components/Retainers/OpexAnalysisPanel.tsx` | CREAR | Panel con KPIs, desglose y insights |
| `src/pages/Retainers.tsx` | MODIFICAR | Integrar panel debajo de ProfitabilityDashboard |

---

## Detalle Técnico

### Hook: useOpexAnalysis

```typescript
interface OpexAnalysis {
  // Presupuesto (de monthly_balances)
  budgetedOpex: number;
  
  // Real (de Zoho, sin Stripe fees)
  realOpex: {
    collaborators: number;    // Pagos a colaboradores
    otherExpenses: number;    // Otros gastos operativos
    total: number;
  };
  
  // Análisis
  variance: number;           // Presupuesto - Real
  variancePercent: number;
  
  // Para planificación
  totalMRR: number;
  availableForGrowth: number; // MRR - OPEX Real
  
  // Estado
  hasRealData: boolean;       // Si hay datos de Zoho cargados
}
```

### Datos Necesarios

Se obtienen del `FinancialDataContext` existente:
- `collaboratorExpenses`: Ya se filtra por categoría "Pagos a colaboradores"
- `totalZohoExpenses`: Total de gastos Zoho
- `opexAmount`: Del `monthly_balances` actual

Cálculo:
```typescript
const collaboratorTotal = collaboratorExpenses.reduce((sum, cat) => sum + cat.total, 0);
const otherExpenses = totalZohoExpenses - collaboratorTotal;
const realOpex = collaboratorTotal + otherExpenses; // = totalZohoExpenses
```

### Componente: OpexAnalysisPanel

Recibe datos del contexto financiero y muestra:
1. **4 KPI Cards**: Presupuesto, Real, Varianza, Disponible
2. **Desglose colapsable**: Colaboradores vs Otros con porcentajes
3. **Insights automáticos**: Basados en la varianza

---

## Integración con Datos Existentes

El panel usará `FinancialDataContext` que ya contiene:
- `opexAmount` (presupuesto del mes)
- `collaboratorExpenses` (desglose por colaborador)
- `totalZohoExpenses` (gastos Zoho totales)

Solo necesita calcular las diferencias y mostrarlas visualmente.

---

## Nota sobre Historial

Para una primera versión, mostraremos solo el **mes actual**. Si quieres ver tendencias históricas, necesitaríamos almacenar snapshots mensuales de OPEX real (actualmente solo se guarda el presupuestado en `monthly_balances`).

