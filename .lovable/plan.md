

# Vista de Resumen Anual 2025 (Year-to-Date)

## Objetivo

Crear un dashboard consolidado que muestre los KPIs financieros acumulados del año 2025, incluyendo ingresos totales, gastos, profit y margen de ganancia, con visualizaciones de tendencia mensual.

---

## Situación Actual

| Fuente | Datos Disponibles |
|--------|-------------------|
| `monthly_financial_summaries` | Solo Abril y Mayo 2025 (parcial) |
| APIs Zoho/Stripe | Datos en tiempo real para cualquier rango |
| DateRangePicker | Ya tiene opción "Este año" que carga Ene-hoy |

El sistema puede obtener todos los datos de 2025 seleccionando "Este año", pero no hay una vista consolidada con KPIs anuales y gráficos de tendencia.

---

## Solución Propuesta

### Componente: `YearToDateSummary`

Un nuevo componente que se mostrará al seleccionar un rango anual, con:

```text
┌──────────────────────────────────────────────────────────────┐
│  📊 Resumen Anual 2025                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Ingresos │  │ Gastos   │  │  Profit  │  │ Margen % │     │
│  │ $XXX,XXX │  │ $XX,XXX  │  │ $XX,XXX  │  │   XX%    │     │
│  │ ↑ vs mes │  │ ↓ vs mes │  │ ↑ vs mes │  │ ▲ trend  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Ingresos vs Gastos por Mes                   │ │
│  │  $50K ─┤                                               │ │
│  │  $40K ─┤     ████                                      │ │
│  │  $30K ─┤ ████████ ████                                 │ │
│  │  $20K ─┤ ████████ ████ ████                            │ │
│  │  $10K ─┤ ████████ ████ ████ ████                       │ │
│  │     0 ─┼─────────────────────────────────              │ │
│  │         Ene  Feb  Mar  Abr  May  ...                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ Mejor Mes: Marzo    │  │ Promedio Mensual:   │           │
│  │ Profit: $15,230     │  │ Income: $12,450     │           │
│  └─────────────────────┘  │ Expense: $9,800     │           │
│                           └─────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementación Técnica

### Fase 1: Hook para Datos Anuales

Crear `src/hooks/useYearToDateSummary.tsx`:

```typescript
interface YearToDateMetrics {
  // Totales acumulados
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  profitMargin: number;
  
  // Desglose por fuente
  stripeIncome: number;
  stripeFees: number;
  zohoIncome: number;
  
  // Por mes (para gráficos)
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    income: number;
    expense: number;
    profit: number;
  }>;
  
  // Estadísticas
  bestMonth: { month: string; profit: number };
  worstMonth: { month: string; profit: number };
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  
  // Comparativas
  momGrowth: number; // Month-over-month growth
  ytdVsLastYear?: number; // Si hay datos del año anterior
}
```

El hook procesará las transacciones del rango actual y calculará todas las métricas.

### Fase 2: Componente de Visualización

Crear `src/components/Dashboard/YearToDateSummary/`:

```text
YearToDateSummary/
├── index.tsx              # Componente principal
├── YTDKPICards.tsx        # Tarjetas de KPIs consolidados
├── MonthlyTrendChart.tsx  # Gráfico de barras Recharts
├── YearInsights.tsx       # Mejor mes, promedios, etc.
└── types.ts               # Tipos compartidos
```

### Fase 3: Integración con Dashboard

Modificar `DashboardContent.tsx` para detectar cuándo el rango seleccionado es anual:

```typescript
// Detectar si es un rango anual
const isYearRange = useMemo(() => {
  if (!dateRange.startDate || !dateRange.endDate) return false;
  const diffDays = differenceInDays(dateRange.endDate, dateRange.startDate);
  return diffDays > 60; // Más de 2 meses = mostrar vista anual
}, [dateRange]);

// Renderizar componente apropiado
{isYearRange ? (
  <YearToDateSummary 
    transactions={financialData.transactions}
    stripeData={{ income: stripeIncome, fees: stripeFees, net: stripeNet }}
    zohoIncome={regularIncome}
  />
) : (
  // Vista mensual actual...
)}
```

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/useYearToDateSummary.tsx` | CREAR - Lógica de cálculos |
| `src/components/Dashboard/YearToDateSummary/index.tsx` | CREAR - Componente principal |
| `src/components/Dashboard/YearToDateSummary/YTDKPICards.tsx` | CREAR - Tarjetas de KPIs |
| `src/components/Dashboard/YearToDateSummary/MonthlyTrendChart.tsx` | CREAR - Gráfico mensual |
| `src/components/Dashboard/YearToDateSummary/YearInsights.tsx` | CREAR - Insights anuales |
| `src/components/Dashboard/DashboardContent.tsx` | MODIFICAR - Condicional de vista |

---

## KPIs a Mostrar

### Tarjetas Principales (4 cards)

1. **Ingresos Totales YTD**: Suma de Stripe Net + Zoho Income
2. **Gastos Totales YTD**: Suma de todos los gastos
3. **Profit YTD**: Ingresos - Gastos
4. **Margen de Profit %**: (Profit / Ingresos) × 100

### Desglose Adicional

- Ingresos Stripe (Gross, Fees, Net)
- Ingresos Zoho
- Gastos Colaboradores vs Otros
- Mejor y peor mes del año
- Promedio mensual de ingresos y gastos
- Tendencia de crecimiento MoM

### Gráfico de Tendencia

Gráfico de barras agrupadas (Recharts) mostrando:
- Barras verdes: Ingresos por mes
- Barras rojas: Gastos por mes  
- Línea: Profit acumulado

---

## Flujo de Uso

1. Usuario selecciona "Este año" en el DateRangePicker
2. Sistema carga transacciones Ene 1 - Hoy
3. Dashboard detecta rango > 60 días
4. Se muestra `YearToDateSummary` en lugar de la vista mensual
5. Los datos se calculan dinámicamente de las transacciones cargadas

---

## Detalles Técnicos

### Agrupación por Mes

```typescript
const groupByMonth = (transactions: Transaction[]) => {
  return transactions.reduce((acc, tx) => {
    const month = new Date(tx.date).getMonth() + 1;
    if (!acc[month]) {
      acc[month] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      acc[month].income += tx.amount;
    } else {
      acc[month].expense += tx.amount;
    }
    return acc;
  }, {} as Record<number, { income: number; expense: number }>);
};
```

### Recharts para Gráfico

```typescript
<BarChart data={monthlyData}>
  <XAxis dataKey="monthName" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="income" fill="#22c55e" name="Ingresos" />
  <Bar dataKey="expense" fill="#ef4444" name="Gastos" />
  <Line dataKey="profit" stroke="#3b82f6" name="Profit" />
</BarChart>
```

---

## Resultado Esperado

Al seleccionar "Este año":

```text
📊 Resumen Anual 2025

┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Ingresos   │   Gastos    │   Profit    │  Margen %   │
│  $83,450    │  $61,230    │  $22,220    │   26.6%     │
│  ▲ +12%     │  ▼ -5%      │  ▲ +18%     │  Saludable  │
└─────────────┴─────────────┴─────────────┴─────────────┘

[Gráfico de barras Ene-Presente]

Insights:
• Mejor mes: Marzo 2025 ($18,500 profit)
• Promedio mensual: $16,690 ingresos
• Stripe representa 62% de ingresos
```

