

# Solución: Indicador de Estado y Carga de Datos

## Problema Identificado

El contexto compartido `FinancialDataContext` solo recibe datos cuando:
1. El usuario visita el Dashboard Financiero
2. El usuario presiona el botón para cargar datos de Stripe/Zoho
3. El componente `RefinedFinancialSummary` se renderiza y sincroniza los datos

Si el usuario va directamente a Retainers sin cargar el dashboard, los valores son 0.

---

## Solución Propuesta

### Opción A: Indicador Visual + Mensaje Claro (Recomendado)

Mostrar un banner informativo cuando los datos financieros no están cargados, indicando al usuario que debe cargar el dashboard primero.

### Cambios:

**Archivo:** `src/components/Retainers/ProfitabilityDashboard/KPISummaryCards.tsx`

Agregar un alert/banner cuando `hasRealData` es `false`:

```tsx
{!metrics.hasRealData && (
  <Alert className="mb-4 bg-yellow-50 border-yellow-200">
    <AlertCircle className="h-4 w-4 text-yellow-600" />
    <AlertTitle>Datos estimados</AlertTitle>
    <AlertDescription>
      Para ver datos reales de Stripe y Zoho, primero carga el 
      <a href="/" className="underline font-medium ml-1">Dashboard Financiero</a>
    </AlertDescription>
  </Alert>
)}
```

---

## Datos de OPEX

Según la base de datos, `opex_amount: 0` es el valor real configurado en `monthly_balances`.

Si deseas agregar OPEX:
1. Ve al Dashboard Financiero
2. Edita el balance mensual de enero 2026
3. Agrega el valor de OPEX

---

## Flujo Correcto para el Usuario

```text
1. Ir a Dashboard Financiero (/)
2. Seleccionar rango de fechas (ej: enero 2026)
3. Presionar "Cargar datos" para obtener Stripe + Zoho
4. Los datos se sincronizan automáticamente al contexto
5. Ir a Retainers → Dashboard de Rentabilidad muestra datos reales
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Retainers/ProfitabilityDashboard/KPISummaryCards.tsx` | Agregar alert informativo |

