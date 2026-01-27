

# Plan: Dashboard de Rentabilidad por Cliente

## Objetivo

Crear un dashboard visual que muestre la rentabilidad de cada cliente (retainer), permitiendo identificar rápidamente cuáles generan más valor y cuáles tienen márgenes bajos o negativos.

---

## Datos disponibles en la tabla `retainers`

| Campo | Descripción |
|-------|-------------|
| `client_name` | Nombre del cliente |
| `specialty` | Especialidad/vertical |
| `net_income` | Ingreso mensual del retainer |
| `social_media_cost` | Costo de gestión de redes sociales |
| `total_expenses` | Gastos totales asociados al cliente |
| `articles_per_month` | Artículos mensuales (para estimar costo) |
| `has_whatsapp_bot` | Si usa bot de WhatsApp |
| `uses_stripe` | Si paga por Stripe (comisiones) |
| `active` | Estado activo/inactivo |

---

## Cálculos de rentabilidad

```text
Para cada cliente:

  Ingreso Bruto = net_income
  
  Gastos Directos:
    - Redes sociales: social_media_cost
    - Otros gastos: total_expenses (ya incluye todo)
  
  Margen = net_income - total_expenses
  Margen % = (Margen / net_income) * 100
  
  Clasificación:
    - Alto (>50%): verde
    - Medio (20-50%): amarillo  
    - Bajo (<20%): rojo
    - Negativo (<0%): rojo oscuro
```

---

## Componentes del dashboard

### 1. Resumen General (Cards KPI)
- Total clientes activos
- Ingreso total mensual (suma de net_income)
- Gastos totales (suma de total_expenses)
- Margen promedio ponderado
- Cliente más rentable
- Cliente menos rentable

### 2. Gráfico de Distribución de Márgenes (Pie/Donut)
- Segmentos por rango de margen (Alto/Medio/Bajo/Negativo)
- Cantidad de clientes en cada segmento

### 3. Gráfico de Barras - Top 10 Clientes por Margen
- Barras horizontales ordenadas de mayor a menor margen
- Mostrar monto de margen y porcentaje

### 4. Tabla de Rentabilidad Detallada
- Todas las columnas relevantes
- Ordenable por cualquier columna
- Indicadores visuales de estado (badges de color)
- Filtrable por rango de margen

### 5. Análisis por Especialidad
- Agrupar clientes por especialidad
- Mostrar margen promedio por vertical
- Identificar especialidades más/menos rentables

---

## Estructura de archivos

```text
src/
  components/
    Retainers/
      ProfitabilityDashboard/
        index.tsx                    # Componente principal
        KPISummaryCards.tsx          # Cards de KPIs
        MarginDistributionChart.tsx  # Gráfico pie de distribución
        TopClientsChart.tsx          # Gráfico barras top 10
        ProfitabilityTable.tsx       # Tabla detallada
        SpecialtyAnalysis.tsx        # Análisis por especialidad
  hooks/
    useProfitabilityMetrics.ts       # Hook con cálculos
```

---

## Integración en la página

Se agregará una nueva sección en `/retainers` debajo del área de Churn, o como una pestaña/tab separada para mantener la página organizada.

---

## Mockup visual

```text
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard de Rentabilidad                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Clientes │ │ Ingreso │ │ Gastos  │ │ Margen  │ │  Mejor  │  │
│  │  30     │ │ $25,000 │ │ $8,500  │ │  66%    │ │ Cliente │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                 │
│  ┌────────────────────────┐  ┌────────────────────────────────┐│
│  │  Distribución Márgenes │  │  Top 10 Clientes               ││
│  │        ┌───┐           │  │  ████████████████ Cliente A    ││
│  │       /     \          │  │  ██████████████   Cliente B    ││
│  │      │ Alto │          │  │  ████████████     Cliente C    ││
│  │       \     /          │  │  ██████████       Cliente D    ││
│  │        └───┘           │  │  ████████         Cliente E    ││
│  └────────────────────────┘  └────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Cliente    │ Ingreso │ Gastos │ Margen │ Margen% │ Estado  ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Cliente A  │ $2,500  │ $500   │ $2,000 │  80%    │ ● Alto  ││
│  │ Cliente B  │ $1,800  │ $600   │ $1,200 │  67%    │ ● Alto  ││
│  │ Cliente C  │ $1,500  │ $800   │ $700   │  47%    │ ● Medio ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Sección Técnica

### Hook useProfitabilityMetrics

```typescript
interface ProfitabilityMetrics {
  // KPIs globales
  totalClients: number;
  totalIncome: number;
  totalExpenses: number;
  totalMargin: number;
  averageMarginPercent: number;
  
  // Distribución
  distribution: {
    high: number;    // >50%
    medium: number;  // 20-50%
    low: number;     // 0-20%
    negative: number; // <0%
  };
  
  // Por cliente
  clientMetrics: Array<{
    id: string;
    clientName: string;
    specialty: string;
    income: number;
    expenses: number;
    margin: number;
    marginPercent: number;
    status: 'high' | 'medium' | 'low' | 'negative';
  }>;
  
  // Por especialidad
  bySpecialty: Array<{
    specialty: string;
    clientCount: number;
    totalIncome: number;
    totalExpenses: number;
    averageMarginPercent: number;
  }>;
  
  // Top/Bottom
  topClient: ClientMetric | null;
  bottomClient: ClientMetric | null;
}
```

### Gráfico de barras con Recharts

```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={top10Clients} layout="vertical">
    <XAxis type="number" />
    <YAxis dataKey="clientName" type="category" width={120} />
    <Tooltip />
    <Bar dataKey="margin" fill="#10b981">
      {top10Clients.map((entry, index) => (
        <Cell 
          key={`cell-${index}`} 
          fill={getColorByMargin(entry.marginPercent)} 
        />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### Clasificación de colores

```typescript
function getMarginStatus(marginPercent: number) {
  if (marginPercent >= 50) return { status: 'high', color: '#10b981', label: 'Alto' };
  if (marginPercent >= 20) return { status: 'medium', color: '#f59e0b', label: 'Medio' };
  if (marginPercent >= 0) return { status: 'low', color: '#ef4444', label: 'Bajo' };
  return { status: 'negative', color: '#7f1d1d', label: 'Negativo' };
}
```

---

## Pasos de implementación

1. Crear hook `useProfitabilityMetrics` con todos los cálculos
2. Crear componente `KPISummaryCards` con las métricas principales
3. Crear gráfico de distribución con PieChart de Recharts
4. Crear gráfico de barras top 10 con BarChart
5. Crear tabla de rentabilidad con ordenamiento
6. Crear componente de análisis por especialidad
7. Integrar todos los componentes en `ProfitabilityDashboard`
8. Agregar sección en la página de Retainers

