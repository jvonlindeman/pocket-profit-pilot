

# Corrección de Doble Conteo de Gastos en Dashboard de Rentabilidad

## Problema Identificado

El cálculo actual de "Profit Real" está restando dos veces los mismos gastos:

```text
ACTUAL (incorrecto):
Real Profit = Net Income - expenses - opexShare - zohoExpenseShare
                           ^^^^^^^              ^^^^^^^^^^^^^^^
                           MISMO DATO (doble conteo)
```

Los gastos de "redes", "social media", etc. que están en la tabla de retainers son los mismos que vienen de Zoho Books.

---

## Solución

Cuando tenemos datos financieros reales de Zoho, **NO debemos restar los gastos directos del retainer** porque ya están incluidos en `totalZohoExpenses`.

```text
CORRECTO:
Real Profit = Net Income - OPEX - Zoho Expenses (prorrateado)
```

---

## Cambios a Implementar

### Archivo: `src/hooks/useProfitabilityMetrics.ts`

**Línea 142** - Cálculo por cliente:
```typescript
// ANTES (doble conteo):
const realProfit = netIncome - expenses - opexShare - zohoExpenseShare;

// DESPUÉS (correcto):
// Si tenemos datos reales de Zoho, NO restamos expenses porque ya están en zohoExpenseShare
const realProfit = financialData?.totalZohoExpenses 
  ? netIncome - opexShare - zohoExpenseShare  // Datos reales: evitar doble conteo
  : netIncome - expenses - opexShare;         // Sin datos reales: usar expenses directos
```

**Línea 183** - Cálculo total:
```typescript
// ANTES (doble conteo):
const totalRealProfit = totalNetIncome - totalExpenses - totalOpex - totalZohoExpenses;

// DESPUÉS (correcto):
const totalRealProfit = financialData?.totalZohoExpenses
  ? totalNetIncome - totalOpex - totalZohoExpenses  // Datos reales
  : totalNetIncome - totalExpenses - totalOpex;     // Sin datos reales
```

---

## Resultado Esperado

| Métrica | Antes (doble conteo) | Después (correcto) |
|---------|---------------------|-------------------|
| Gastos contados | Retainer + Zoho | Solo Zoho |
| Profit Real | ~USD 32,089 | ~USD 35,000+ |
| Margen Real | ~69.3% | Mayor |

---

## Lógica de Fallback

- **Con datos de Zoho**: Usar solo gastos prorrateados de Zoho (evita doble conteo)
- **Sin datos de Zoho**: Usar gastos directos del retainer como aproximación

