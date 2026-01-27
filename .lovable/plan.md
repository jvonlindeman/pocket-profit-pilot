

# Plan: Agregar estado de Pausa a clientes

## Concepto

Agregar un tercer estado para clientes: **Pausado**. Un cliente pausado:
- Sigue existiendo como cliente (no es un "logo" perdido)
- Pero no genera ingresos temporalmente

## Estados de cliente

| Estado | active | canceled_at | paused_at | Descripción |
|--------|--------|-------------|-----------|-------------|
| Activo | true | null | null | Cliente normal generando MRR |
| Pausado | true | null | fecha | Cliente temporalmente sin generar MRR |
| Perdido | false | fecha | null | Cliente cancelado definitivamente |

## Impacto en Churn Rate

| Métrica | Activo | Pausado | Perdido |
|---------|--------|---------|---------|
| Logo Churn (cuenta como cliente) | Si | Si | No |
| Revenue Churn (cuenta en MRR) | Si | No | No |
| Ending Active count | Si | Si | No |
| Ending MRR | Si | No | No |

Esto significa:
- Un cliente pausado **no** incrementa `churnedThisPeriod` (logo churn)
- Un cliente pausado **si** reduce el `endingMRR` (revenue churn)
- El Retention Rate de logos no se ve afectado por pausas
- El Net Revenue Retention baja cuando hay clientes pausados

---

## Diseño de UI

### En la tabla de retainers

```text
| Cliente              | Espec. | Ingreso | ... | Estado |
|----------------------|--------|---------|-----|--------|
| Dr. Batista          | Cardio | $800    | ... | Activo |
| Dr. Lopez            | Neuro  | $650    | ... | Pausado [icon] |
| Clinica ABC          | Clinica| $1200   | ... | Perdido |
```

El indicador visual cambia:
- Verde: Activo
- Amarillo/Naranja: Pausado
- Rojo: Perdido/Cancelado

### En el formulario de edición

```text
Estado del cliente:
┌─────────────────────────────────────────────┐
│ ( ) Activo                                  │
│ ( ) Pausado   [Fecha de pausa: ____]        │
│ ( ) Cancelado [Fecha de baja: ____]         │
└─────────────────────────────────────────────┘
```

### En los filtros

El filtro de "Estado" tendrá 4 opciones:
- Todos
- Solo activos (incluye pausados)
- Solo pausados
- Solo perdidos

---

## Sección Técnica

### 1. Migración de base de datos

Agregar columna `paused_at` a la tabla `retainers`:

```sql
ALTER TABLE retainers 
ADD COLUMN paused_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN retainers.paused_at IS 'Fecha en que el cliente entró en pausa. NULL = no está pausado.';
```

### 2. Actualizar tipos TypeScript

Archivo: `src/integrations/supabase/types.ts`

El tipo se regenerará automáticamente con la migración, pero incluirá:
```typescript
paused_at: string | null
```

### 3. Modificar cálculo de Churn

Archivo: `src/hooks/useChurnCalculator.ts`

Lógica actualizada:
```typescript
const pausedAt: Date | null = toDate((r as any).paused_at);

// Un cliente está "activo para logos" si:
// - Fue creado antes del período Y
// - No está cancelado (o fue cancelado después del período)
// Nota: pausado NO afecta logo churn

// Para Revenue Churn, un cliente pausado NO contribuye al MRR
const isPausedDuringPeriod = !!pausedAt && isOnOrBefore(pausedAt, periodEnd);

// Logo Churn (sin cambios para pausados)
if (wasActiveAtEnd) endingActive += 1;

// Revenue Churn (pausados no contribuyen)
if (wasActiveAtEnd && !isPausedDuringPeriod) {
  endingMRR += netIncome;
}
```

### 4. Actualizar métricas de Churn

Agregar nuevas métricas al tipo `ChurnMetrics`:
```typescript
pausedCount: number;      // Clientes actualmente pausados
pausedMRR: number;        // MRR de clientes pausados
```

### 5. Actualizar formulario de edición

Archivo: `src/components/Retainers/RetainerFormDialog.tsx`

Cambiar de toggle "Activo" a radio buttons con 3 estados:
- Activo
- Pausado (muestra campo fecha de pausa)
- Cancelado (muestra campo fecha de baja)

### 6. Actualizar tabla de retainers

Archivo: `src/components/Retainers/RetainersTable.tsx`

Cambiar indicador de estado:
```typescript
// Color del indicador
const getStatusColor = (r: RetainerRow) => {
  if (!r.active) return 'bg-red-500';      // Perdido
  if (r.paused_at) return 'bg-yellow-500'; // Pausado
  return 'bg-green-500';                   // Activo
};

// Tooltip o texto
const getStatusLabel = (r: RetainerRow) => {
  if (!r.active) return 'Perdido';
  if (r.paused_at) return 'Pausado';
  return 'Activo';
};
```

### 7. Actualizar filtros

Archivo: `src/pages/Retainers.tsx`

Cambiar el Select de estado:
```typescript
type StatusFilter = "all" | "active" | "paused" | "lost";

// En el filtrado:
if (statusFilter === "active" && (!r.active || r.paused_at)) return false;
if (statusFilter === "paused" && (!r.active || !r.paused_at)) return false;
if (statusFilter === "lost" && r.active) return false;
```

### 8. Actualizar sección de Churn en UI

Mostrar nuevas métricas:
```text
┌─────────────────────────────────────────────────────────┐
│ Churn Rate (Enero 2026)                                │
├─────────────────────────────────────────────────────────┤
│ Logo Retention: 95.2%  │  Revenue Retention: 89.5%     │
│ Perdidos: 2            │  Pausados: 3 ($1,500 MRR)     │
└─────────────────────────────────────────────────────────┘
```

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar columna `paused_at` |
| `src/integrations/supabase/types.ts` | Se regenera automáticamente |
| `src/hooks/useChurnCalculator.ts` | Lógica de churn parcial para pausados |
| `src/components/Retainers/RetainerFormDialog.tsx` | Radio buttons para estado |
| `src/components/Retainers/RetainersTable.tsx` | Indicador visual de pausa |
| `src/pages/Retainers.tsx` | Filtro "Solo pausados" |
| `src/types/retainers.ts` | Helpers para estado de cliente |

---

## Resultado esperado

- Nuevo estado "Pausado" disponible para clientes
- Los clientes pausados siguen contando como "logos activos"
- Los clientes pausados NO contribuyen al MRR (afecta Revenue Churn)
- UI clara con indicadores de color (verde/amarillo/rojo)
- Filtros actualizados para ver solo pausados
- Métricas de churn muestran cuántos clientes y MRR están pausados

