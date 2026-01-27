

# Plan: Implementar Revenue Churn (Churn de Ingresos)

## Resumen

Agregar metricas de Revenue Churn junto al Logo Churn existente para medir el impacto financiero real de las bajas y altas de clientes. Esto incluye MRR perdido, MRR ganado, y Net Revenue Retention (NRR).

---

## Metricas a Implementar

| Metrica | Formula | Descripcion |
|---------|---------|-------------|
| MRR Inicial | Suma de `net_income` de clientes activos al inicio del mes | Ingresos recurrentes al comenzar el periodo |
| MRR Perdido (Churned) | Suma de `net_income` de clientes que cancelaron en el mes | Impacto financiero de las bajas |
| MRR Nuevo | Suma de `net_income` de clientes nuevos en el mes | Ingresos por nuevos clientes |
| MRR Final | Suma de `net_income` de clientes activos al cierre | Ingresos recurrentes al final del periodo |
| Revenue Churn Rate | MRR Perdido / MRR Inicial | Porcentaje de ingresos perdidos |
| Net Revenue Retention (NRR) | (MRR Final / MRR Inicial) x 100 | Retencion neta de ingresos |

---

## Comparacion Logo Churn vs Revenue Churn

```text
Ejemplo:
- Pierdes 2 clientes que pagaban $100/mes cada uno = $200 perdidos
- Ganas 1 cliente nuevo que paga $500/mes = $500 ganados

Logo Churn: -2 clientes (parece malo)
Revenue Churn: +$300 neto (realidad positiva)
NRR: >100% (crecimiento)
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useChurnCalculator.ts` | Agregar calculo de Revenue Churn |
| `src/pages/Retainers.tsx` | Mostrar nuevas metricas en la UI |

---

## Cambios en la UI

La seccion "Churn de retainers" tendra dos subsecciones:

### Logo Churn (existente)
- Activos al inicio
- Nuevos
- Bajas
- Activos al cierre
- Churn Rate
- Retention Rate

### Revenue Churn (nuevo)
- MRR Inicial
- MRR Perdido
- MRR Nuevo
- MRR Final
- Revenue Churn Rate
- Net Revenue Retention (NRR)

---

## Indicadores Visuales

| Metrica | Color |
|---------|-------|
| NRR >= 100% | Verde (crecimiento) |
| NRR 90-99% | Amarillo (alerta) |
| NRR < 90% | Rojo (problema) |

---

## Seccion Tecnica

### Nuevo tipo RevenueChurnMetrics

```text
type RevenueChurnMetrics = {
  startingMRR: number;      // MRR al inicio del mes
  churnedMRR: number;       // MRR perdido por bajas
  newMRR: number;           // MRR de nuevos clientes
  endingMRR: number;        // MRR al cierre
  revenueChurnRate: number; // churnedMRR / startingMRR (0..1)
  netRevenueRetention: number; // endingMRR / startingMRR (0..1+)
}
```

### Logica de calculo

```text
Para cada retainer:
  - Si estaba activo al inicio del mes:
      startingMRR += net_income
  
  - Si se cancelo durante el mes:
      churnedMRR += net_income
  
  - Si se creo durante el mes:
      newMRR += net_income
  
  - Si esta activo al cierre del mes:
      endingMRR += net_income

revenueChurnRate = churnedMRR / max(startingMRR, 1)
netRevenueRetention = endingMRR / max(startingMRR, 1)
```

### Nuevo hook combinado

El hook `useChurnMetrics` retornara tanto Logo Churn como Revenue Churn en un solo objeto para evitar multiples iteraciones sobre los datos.

