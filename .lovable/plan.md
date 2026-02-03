
# Mejorar Visualización de Contraction MRR

## Problema Identificado

La lógica de contraction **funciona correctamente** - el cliente "Clinica Dental Obarrio" tiene $356 registrados en `contraction_amount`. Sin embargo, la UI no comunica esto claramente:

| Componente | Situación Actual | Problema |
|------------|------------------|----------|
| **Diálogo de edición** | Muestra "MRR: $794" | No indica que hubo reducción del plan |
| **Tabla de retainers** | Muestra "+USD 197" (upsell) | No muestra contracciones acumuladas |
| **Accordion de Ingresos** | Solo suma base + upsell | No distingue visualmente la contracción |

## Solución Propuesta

Agregar indicadores visuales claros de contracción en tres lugares:

### 1. Diálogo - Header de Ingresos

Mostrar el MRR con indicador de contracción cuando existe:

```text
Antes:  MRR: $794
Después: MRR: $794 (base bajó $253)
```

Esto se mostrará solo cuando estás editando un retainer y el `base_income` ingresado es menor al guardado en la BD.

### 2. Diálogo - Campo "Ingreso base"

Agregar una nota debajo del campo cuando hay contracción pendiente o histórica:

```text
┌─────────────────────┐
│ Ingreso base        │
│ ┌─────────────────┐ │
│ │ 597             │ │
│ └─────────────────┘ │
│ ⚠️ Reducción de $253│  ← Solo visible si bajó
└─────────────────────┘
```

### 3. Tabla - Columna de Ingreso

Mostrar contracción acumulada en rojo junto al upsell verde:

```text
Antes:  USD 794 +USD 197
Después: USD 794 +USD 197 ↓$356
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Retainers/RetainerFormDialog.tsx` | Agregar indicador de reducción en header y campo de ingreso base |
| `src/components/Retainers/RetainersTable.tsx` | Mostrar contraction_amount en rojo si > 0 |

---

## Detalle Técnico

### RetainerFormDialog.tsx

Agregar cálculo de contractionDelta en tiempo real (no solo al guardar):

```typescript
// Calcular contracción en tiempo real para mostrar en UI
const currentBaseIncome = parseNumberLike(baseIncome);
const previousBaseIncome = initial 
  ? (Number((initial as any).base_income) || Number(initial.net_income) || 0) 
  : 0;
const liveContractionDelta = initial && currentBaseIncome < previousBaseIncome 
  ? previousBaseIncome - currentBaseIncome 
  : 0;
const accumulatedContraction = Number((initial as any)?.contraction_amount) || 0;
```

En el header del accordion:
```typescript
<span className="text-muted-foreground font-normal ml-2">
  MRR: ${totalMRR.toLocaleString('es-PA', { maximumFractionDigits: 0 })}
  {liveContractionDelta > 0 && (
    <span className="text-red-500 ml-1">
      (base bajó ${liveContractionDelta.toLocaleString('es-PA', { maximumFractionDigits: 0 })})
    </span>
  )}
</span>
```

Debajo del campo de ingreso base:
```typescript
{liveContractionDelta > 0 && (
  <p className="text-xs text-red-500 mt-1">
    ↓ Reducción de ${liveContractionDelta.toLocaleString()}
  </p>
)}
```

### RetainersTable.tsx

En la columna de ingreso, después del upsell:
```typescript
{Number((r as any).contraction_amount ?? 0) > 0 && (
  <span className="text-xs text-red-500 ml-1">
    ↓{formatCurrency(Number((r as any).contraction_amount))}
  </span>
)}
```

---

## Resultado Visual Esperado

**Diálogo al editar "Clinica Dental Obarrio":**
```text
$ Ingresos    MRR: $794 (base bajó $253)

Ingreso base           Upsells
┌─────────────┐       ┌─────────────┐
│ 597         │       │ 197         │
└─────────────┘       └─────────────┘
↓ Reducción de $253
```

**Tabla de retainers:**
```text
Clinica Dental O...   Dentista   USD 794 +USD 197 ↓$356
```

Esto permite ver de un vistazo:
- El MRR actual ($794)
- Cuánto es expansión (+$197 en verde)
- Cuánto se ha perdido por reducciones (↓$356 en rojo)
