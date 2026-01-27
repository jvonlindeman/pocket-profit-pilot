

# Implementar Sistema de Upsells (Continuación)

## Estado Actual

- Plan de upsells fue aprobado anteriormente
- La base de datos **no tiene** las columnas `base_income` ni `upsell_income`
- El formulario sigue usando solo `net_income`

---

## Pasos a Implementar

### 1. Migración de Base de Datos

Agregar las columnas necesarias:

```sql
ALTER TABLE retainers
ADD COLUMN base_income numeric NOT NULL DEFAULT 0,
ADD COLUMN upsell_income numeric NOT NULL DEFAULT 0;

-- Migrar datos existentes: todo el net_income actual es base_income
UPDATE retainers SET base_income = net_income WHERE base_income = 0;
```

### 2. Actualizar Tipos TypeScript

En `src/integrations/supabase/types.ts`, agregar a la definición de retainers:
- `base_income: number`
- `upsell_income: number`

### 3. Modificar Formulario (RetainerFormDialog.tsx)

Cambiar el campo "Ingreso neto" por:
- **Ingreso base**: MRR inicial del cliente
- **Upsells**: Ventas adicionales
- **Total MRR**: Calculado automáticamente (readonly)

```text
+------------------------------------------+
| Ingreso base        | $400              |
+------------------------------------------+
| Upsells             | $597              |
+------------------------------------------+
| Total MRR           | $997 (calculado)  |
+------------------------------------------+
```

### 4. Actualizar Tabla (RetainersTable.tsx)

En la columna de Ingreso, mostrar:
- El total ($997)
- Indicador de upsell si hay (+$597 en verde)
- Tooltip con desglose completo

### 5. Métricas de Expansión (useProfitabilityMetrics.ts)

Agregar nuevas métricas:
- `totalUpsellRevenue`: Suma de todos los upsells
- `clientsWithUpsells`: Cantidad de clientes con upsells
- `expansionRate`: % de ingresos que viene de upsells

### 6. Card de Expansion MRR (KPISummaryCards.tsx)

Nuevo card mostrando Expansion MRR total

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Agregar columnas `base_income` y `upsell_income` |
| `src/integrations/supabase/types.ts` | Tipos actualizados |
| `src/components/Retainers/RetainerFormDialog.tsx` | Campos separados base + upsell |
| `src/components/Retainers/RetainersTable.tsx` | Indicador visual de upsell |
| `src/hooks/useProfitabilityMetrics.ts` | Métricas de expansión |
| `src/components/Retainers/ProfitabilityDashboard/KPISummaryCards.tsx` | Card Expansion MRR |

---

## Ejemplo con Fernando Agreda

Después de implementar:
1. Editas a Fernando Agreda
2. Pones: Base = $400, Upsell = $597
3. El sistema calcula: net_income = $997
4. En la tabla ves: "$997 (+$597)"
5. En KPIs ves: "Expansion MRR: $597"

