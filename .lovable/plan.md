

# Plan: Marcar clientes como "Legacy" para cálculo de churn correcto

## Problema

Todos los clientes importados tienen `created_at` igual a la fecha de importación, lo que hace que el sistema los cuente como "nuevos" este mes, distorsionando las métricas de churn.

## Solución

Agregar un campo `is_legacy` a la tabla `retainers`. Los clientes marcados como legacy:
- NO se cuentan como "nuevos" en ningún mes
- SÍ se cuentan para churn si se cancelan
- SÍ se incluyen en el MRR inicial/final

---

## Cambios requeridos

| Componente | Cambio |
|------------|--------|
| Base de datos | Agregar columna `is_legacy` (boolean, default false) |
| Migración de datos | Marcar todos los existentes como `is_legacy = true` |
| useChurnCalculator.ts | Excluir legacy del conteo de "nuevos" |
| RetainerFormDialog.tsx | Agregar toggle "Cliente legacy" |
| RetainersTable.tsx | Mostrar indicador visual de legacy |

---

## Lógica de churn actualizada

```text
Para cada retainer:

Logo Churn:
  - Si es legacy: NO contar como nuevo
  - Si NO es legacy y created_at en el mes: contar como nuevo
  - Si canceled_at en el mes: contar como baja (sin importar legacy)

Revenue Churn:
  - MRR Inicial: incluir legacy (ya existían)
  - MRR Nuevo: solo clientes NO legacy creados en el mes
  - MRR Perdido: cualquier cancelación en el mes
```

---

## Flujo de usuario

```text
Importación masiva (ya hecha)
         |
         v
Migración marca todos como legacy = true
         |
         v
Nuevos clientes -> is_legacy = false (automático)
         |
         v
Churn calcula correctamente:
  - Legacy NO cuentan como nuevos
  - Cancelaciones SÍ cuentan como bajas
```

---

## UI del formulario

Se agregará un toggle "Cliente legacy" que:
- Por defecto: false (nuevo cliente)
- Si se activa: el cliente no contará como "nuevo" en ningún mes
- Útil para ajustar manualmente si es necesario

---

## Indicadores visuales en la tabla

Los clientes legacy mostrarán un badge "Legacy" junto al nombre para identificarlos fácilmente.

---

## Sección Técnica

### Migración SQL

```sql
-- Agregar columna is_legacy
ALTER TABLE retainers 
ADD COLUMN is_legacy boolean NOT NULL DEFAULT false;

-- Marcar todos los existentes como legacy
UPDATE retainers SET is_legacy = true;
```

### Cambio en calculateChurn

```text
// Solo contar como nuevo si:
// 1. NO es legacy
// 2. created_at está en el período
const isNewThisPeriod = !r.is_legacy && 
  isOnOrAfter(createdAt, periodStart) && 
  isOnOrBefore(createdAt, periodEnd);

// Las bajas se cuentan sin importar legacy
const isChurnedThisPeriod = !!canceledAt && 
  isOnOrAfter(canceledAt, periodStart) && 
  isOnOrBefore(canceledAt, periodEnd);
```

### Toggle en formulario

Agregar después del toggle "Activo":
- Label: "Cliente legacy (importado)"
- Descripción: "No contará como cliente nuevo"
- Default para nuevos: false
- Marcar legacy existentes vía migración

