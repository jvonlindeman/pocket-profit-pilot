

# Plan: Remover Sistema de Gestión de Ahorros

## Resumen

Se eliminará completamente la funcionalidad de "Gestión de Ahorros" que incluye el registro manual de depósitos mensuales, resumen de ahorros totales y historial.

---

## Archivos a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `src/components/Dashboard/Savings/MonthlySavingsManager.tsx` | Componente principal del manager |
| `src/components/Dashboard/Savings/SavingsFormDialog.tsx` | Diálogo para registrar/editar ahorros |
| `src/components/Dashboard/Savings/SavingsHistory.tsx` | Tabla de historial de ahorros |
| `src/components/Dashboard/Savings/SavingsSummaryCard.tsx` | Tarjeta de resumen con totales |
| `src/hooks/useMonthlySavings.tsx` | Hook con CRUD de ahorros |

---

## Archivos a Modificar

### 1. `src/components/Dashboard/DashboardContent.tsx`
**Cambios**:
- Remover import de `MonthlySavingsManager`
- Eliminar `<MonthlySavingsManager />` del render (línea ~217)

### 2. `src/types/financial.ts`
**Cambios**:
- Eliminar la interface `MonthlySavings` (líneas 192-201)

---

## Migración de Base de Datos

Se eliminará la tabla `monthly_savings` de Supabase:

```sql
DROP TABLE IF EXISTS monthly_savings CASCADE;
```

---

## Resumen de Cambios

| Tipo | Cantidad |
|------|----------|
| Archivos a eliminar | 5 |
| Archivos a modificar | 2 |
| Tablas a eliminar | 1 |

---

## Orden de Implementación

1. **Modificar `DashboardContent.tsx`** - Remover import y uso del componente
2. **Eliminar directorio `src/components/Dashboard/Savings/`** - Todos los componentes UI
3. **Eliminar `src/hooks/useMonthlySavings.tsx`** - Hook de CRUD
4. **Modificar `src/types/financial.ts`** - Remover interface MonthlySavings
5. **Migración de base de datos** - Eliminar tabla `monthly_savings`

---

## Sección Técnica

### Estructura de Archivos a Eliminar

```text
src/
├── components/
│   └── Dashboard/
│       └── Savings/                  (eliminar directorio completo)
│           ├── MonthlySavingsManager.tsx
│           ├── SavingsFormDialog.tsx
│           ├── SavingsHistory.tsx
│           └── SavingsSummaryCard.tsx
└── hooks/
    └── useMonthlySavings.tsx
```

### Actualización de Tipos Supabase

Después de eliminar la tabla `monthly_savings`, se actualizará automáticamente `src/integrations/supabase/types.ts` para reflejar el nuevo schema sin esa tabla.

---

## Beneficios

1. **Menos código**: 5 archivos menos de mantener
2. **UI más simple**: Dashboard sin sección de ahorros vacía
3. **Menos tablas DB**: Una tabla menos en Supabase

