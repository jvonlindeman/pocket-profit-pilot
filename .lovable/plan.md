
# Integración de Datos Financieros Reales en Dashboard de Rentabilidad

## Situación Actual

El dashboard financiero ya calcula datos **reales**:

| Dato | Variable | Descripción |
|------|----------|-------------|
| Fees Stripe | `stripeFees` | Total real de comisiones Stripe del mes |
| % Fees Stripe | `stripeFeePercentage` | Porcentaje real (~4.43%) |
| Gastos Zoho | `totalZohoExpenses` | Suma de gastos operativos de Zoho |
| Colaboradores | `collaboratorExpenses` | Gastos por colaborador |
| OPEX | `monthlyBalance.opex_amount` | Configurado en monthly_balances |

Estos datos se pueden compartir con el dashboard de Retainers.

---

## Solución: Hook Compartido de Datos Financieros

Crear un contexto o hook que exponga los datos financieros reales para usarlos en Retainers.

---

## Arquitectura Propuesta

```text
┌──────────────────────────────────────────────────────────────────────┐
│                    useFinancialContext (nuevo)                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ stripeFees: number           // Total real del mes             │ │
│  │ stripeFeePercentage: number  // % real (ej: 4.43)              │ │
│  │ totalZohoExpenses: number    // Gastos operativos Zoho         │ │
│  │ collaboratorExpenses: array  // Desglose por colaborador       │ │
│  │ opexAmount: number           // OPEX configurado               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│            │                              │                          │
│            ▼                              ▼                          │
│    ┌───────────────┐             ┌────────────────────┐              │
│    │   Dashboard   │             │     Retainers      │              │
│    │  Financiero   │             │ Profitability      │              │
│    └───────────────┘             └────────────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Enfoque de Integración

### Opción A: Context Global (recomendado)

Exponer los datos financieros en un contexto que ambas páginas puedan consumir.

### Opción B: Hook de Resumen Financiero

Crear un hook ligero que obtenga solo los totales necesarios.

---

## Cambios a Implementar

### Fase 1: Contexto de Datos Financieros

Crear `FinancialDataContext` que almacene los datos del dashboard.

### Fase 2: Integración en Retainers

Consumir el contexto en la página de Retainers y pasar los datos al hook de rentabilidad.

### Fase 3: Cálculo de Profit Real

Usar los datos reales para calcular:
- Fees Stripe reales por cliente (proporcional a su ingreso)
- Gastos Zoho prorrateados
- Profit real = Ingreso - Fees - Gastos directos - OPEX prorrateado

---

## Archivos a Modificar/Crear

| Archivo | Cambio |
|---------|--------|
| Nuevo: `src/contexts/FinancialDataContext.tsx` | Contexto compartido de datos financieros |
| `src/App.tsx` | Envolver con el provider |
| `src/pages/Retainers.tsx` | Consumir el contexto |
| `src/hooks/useProfitabilityMetrics.ts` | Usar datos reales |
| `src/components/Retainers/ProfitabilityDashboard/KPISummaryCards.tsx` | Mostrar fees reales |
| `src/components/Retainers/ProfitabilityDashboard/ProfitabilityTable.tsx` | Columna de fees |

---

## Sección Tecnica

### Nuevo Contexto: FinancialDataContext

```typescript
// src/contexts/FinancialDataContext.tsx
interface FinancialDataState {
  // Stripe data
  stripeFees: number;
  stripeFeePercentage: number;
  stripeIncome: number;
  stripeNet: number;
  
  // Zoho data
  totalZohoExpenses: number;
  collaboratorExpenses: CategorySummary[];
  regularIncome: number;
  
  // OPEX
  opexAmount: number;
  
  // Status
  isLoaded: boolean;
  lastUpdated: Date | null;
}

export const FinancialDataContext = createContext<FinancialDataState>(defaultState);

// Provider que envuelve la app
export const FinancialDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Obtener datos del dashboard
  const { 
    stripeFees, stripeFeePercentage, stripeIncome, stripeNet,
    totalZohoExpenses, collaboratorExpenses, regularIncome 
  } = useFinanceData();
  
  const { monthlyBalance } = useMonthlyBalance({ currentDate: new Date() });
  
  const value = useMemo(() => ({
    stripeFees,
    stripeFeePercentage,
    stripeIncome,
    stripeNet,
    totalZohoExpenses,
    collaboratorExpenses,
    regularIncome,
    opexAmount: monthlyBalance?.opex_amount ?? 0,
    isLoaded: stripeFees > 0 || totalZohoExpenses > 0,
    lastUpdated: new Date(),
  }), [stripeFees, ...deps]);
  
  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
};

// Hook para consumir
export const useFinancialData = () => useContext(FinancialDataContext);
```

### Hook de Rentabilidad Actualizado

```typescript
// src/hooks/useProfitabilityMetrics.ts
export function useProfitabilityMetrics(
  retainers: RetainerRow[],
  financialData?: {
    stripeFees: number;
    stripeFeePercentage: number;
    stripeIncome: number;
    totalZohoExpenses: number;
    opexAmount: number;
  }
): ProfitabilityMetrics {
  return useMemo(() => {
    const activeRetainers = retainers.filter((r) => r.active);
    
    // Calcular ingresos totales de clientes con Stripe
    const totalStripeClientIncome = activeRetainers
      .filter(r => r.uses_stripe)
      .reduce((sum, r) => sum + (Number(r.net_income) || 0), 0);
    
    // Total income para prorrateo
    const totalIncome = activeRetainers.reduce(
      (sum, r) => sum + (Number(r.net_income) || 0), 0
    );
    
    const clientMetrics: ClientMetric[] = activeRetainers.map((r) => {
      const income = Number(r.net_income) || 0;
      const expenses = Number(r.total_expenses) || 0;
      
      // FEES REALES: Prorratear fees de Stripe según participación en ingresos Stripe
      let stripeFees = 0;
      if (r.uses_stripe && financialData?.stripeFees && totalStripeClientIncome > 0) {
        const clientStripeShare = income / totalStripeClientIncome;
        stripeFees = financialData.stripeFees * clientStripeShare;
      }
      
      // OPEX REAL: Prorratear según participación en ingresos totales
      let opexShare = 0;
      if (financialData?.opexAmount && totalIncome > 0) {
        const incomeShare = income / totalIncome;
        opexShare = financialData.opexAmount * incomeShare;
      }
      
      // GASTOS ZOHO: Prorratear gastos operativos
      let zohoExpenseShare = 0;
      if (financialData?.totalZohoExpenses && totalIncome > 0) {
        const incomeShare = income / totalIncome;
        zohoExpenseShare = financialData.totalZohoExpenses * incomeShare;
      }
      
      const netIncome = income - stripeFees;
      const realProfit = netIncome - expenses - opexShare - zohoExpenseShare;
      const realMarginPercent = income > 0 ? (realProfit / income) * 100 : 0;
      
      return {
        ...existingFields,
        stripeFees,        // Fees reales prorrateados
        netIncome,
        opexShare,         // OPEX prorrateado
        zohoExpenseShare,  // Gastos Zoho prorrateados
        realProfit,
        realMarginPercent,
      };
    });
    
    // Totales con datos reales
    return {
      ...existingMetrics,
      totalStripeFees: financialData?.stripeFees ?? 0, // REAL, no calculado
      totalNetIncome: totalIncome - (financialData?.stripeFees ?? 0),
      totalOpex: financialData?.opexAmount ?? 0,
      totalZohoExpenses: financialData?.totalZohoExpenses ?? 0,
      totalRealProfit: /* calculo con datos reales */,
      realMarginPercent: /* porcentaje real */,
      hasRealData: !!financialData?.stripeFees, // Indicador
    };
  }, [retainers, financialData]);
}
```

### Integración en Retainers.tsx

```typescript
// src/pages/Retainers.tsx
import { useFinancialData } from '@/contexts/FinancialDataContext';

const RetainersPage: React.FC = () => {
  const { data } = useRetainersQuery();
  const rows = Array.isArray(data) ? data : [];
  
  // Obtener datos financieros reales
  const financialData = useFinancialData();
  
  // Pasar al componente de rentabilidad
  return (
    <ProfitabilityDashboard 
      retainers={rows} 
      financialData={{
        stripeFees: financialData.stripeFees,
        stripeFeePercentage: financialData.stripeFeePercentage,
        stripeIncome: financialData.stripeIncome,
        totalZohoExpenses: financialData.totalZohoExpenses,
        opexAmount: financialData.opexAmount,
      }}
    />
  );
};
```

### Indicador Visual de Datos Reales

```tsx
// En KPISummaryCards.tsx
{financialData.isLoaded ? (
  <Badge variant="outline" className="text-green-600 border-green-300">
    Datos reales
  </Badge>
) : (
  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
    Estimado
  </Badge>
)}
```

---

## Flujo de Datos

```text
1. Usuario carga Dashboard Financiero
   └─► useFinanceData() obtiene datos de Stripe/Zoho
       └─► FinancialDataContext almacena los totales

2. Usuario navega a Retainers
   └─► useFinancialData() (contexto) devuelve datos guardados
       └─► useProfitabilityMetrics() usa datos REALES
           └─► ProfitabilityDashboard muestra profit real
```

---

## Resultado Esperado

### Vista del Dashboard de Rentabilidad

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Datos reales ✓]                                                       │
├─────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│ Clientes    │ Ingreso      │ Fees Stripe  │ Gastos Zoho  │ Profit Real│
│ 25          │ $50,000      │ -$2,215 (R)  │ -$15,000 (R) │ $20,785    │
│             │              │              │              │ (41.6%)    │
└─────────────┴──────────────┴──────────────┴──────────────┴────────────┘
 (R) = Dato real del dashboard financiero
```

### Tabla por Cliente

```text
│ Cliente    │ Ingreso │ Fees (R) │ Gastos │ OPEX    │ Profit Real    │
│ Dr. García │ $2,000  │ -$89     │ -$300  │ -$600   │ $1,011 (50.5%) │
│ Clínica XY │ $1,500  │ -$66     │ -$200  │ -$450   │ $784 (52.3%)   │
│ WEB Corp   │ $800    │ -        │ -$100  │ -$240   │ $460 (57.5%)   │
```

---

## Consideraciones

- **Carga de datos**: Si el usuario no ha cargado el dashboard financiero, se muestra indicador "Datos estimados" y se usa el porcentaje por defecto
- **Sincronización temporal**: Los datos del dashboard corresponden al período seleccionado; idealmente debería coincidir con el mes actual
- **Performance**: El contexto evita llamadas API duplicadas
- **Fallback**: Si no hay datos reales, se usa `stripeFeePercentage = 4.43` como estimado
