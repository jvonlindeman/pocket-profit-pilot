

# Agregar Sistema de Upsells para Retainers

## Objetivo

Implementar un sistema para trackear upsells (ventas adicionales) en clientes existentes, permitiendo ver el crecimiento del MRR por cliente y calcular metricas de expansion revenue.

---

## Enfoque Propuesto

Agregar dos campos nuevos a la tabla `retainers`:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `base_income` | numeric | MRR inicial cuando el cliente empezo |
| `upsell_income` | numeric | Suma de todos los upsells vendidos |

La formula seria: `net_income = base_income + upsell_income`

Esto permite:
- Ver cuanto paga cada cliente de base vs upsells
- Calcular **Expansion MRR** (crecimiento por upsells)
- Identificar clientes con mayor potencial de crecimiento

---

## Vista en Formulario

```text
+------------------------------------------+
| Ingreso base        | $400              | <- Lo que pagaba antes
+------------------------------------------+
| Upsells             | $597              | <- Lo que le vendiste adicional
+------------------------------------------+
| Total MRR           | $997 (calculado)  | <- Suma automatica
+------------------------------------------+
```

---

## Vista en Tabla

Nueva columna o tooltip mostrando el desglose:

```text
| Cliente         | MRR     | Upsell  | Margen |
|-----------------|---------|---------|--------|
| Fernando Agreda | $997    | +$597   | 45%    |
| Otro Cliente    | $500    | -       | 60%    |
```

Los clientes con upsells mostrarian un indicador visual (ej. flecha verde hacia arriba).

---

## Cambios Necesarios

### 1. Base de Datos (Migracion)

Agregar columnas a tabla `retainers`:
```sql
ALTER TABLE retainers
ADD COLUMN base_income numeric NOT NULL DEFAULT 0,
ADD COLUMN upsell_income numeric NOT NULL DEFAULT 0;
```

### 2. Actualizar Tipos (src/integrations/supabase/types.ts)

Agregar `base_income` y `upsell_income` a los tipos Row/Insert/Update de retainers.

### 3. Formulario (RetainerFormDialog.tsx)

- Cambiar campo "Ingreso neto" por dos campos: "Ingreso base" y "Upsells"
- Mostrar el total calculado (readonly)
- Al guardar: `net_income = base_income + upsell_income`

### 4. Tabla (RetainersTable.tsx)

- Agregar indicador visual en columna MRR cuando hay upsells
- Tooltip mostrando desglose: "Base: $400 + Upsell: $597"

### 5. Metricas de Expansion (useProfitabilityMetrics.ts)

Agregar nuevas metricas:
- `totalUpsellRevenue`: Suma de todos los upsells
- `clientsWithUpsells`: Cantidad de clientes con upsells
- `expansionRate`: Porcentaje de ingresos provenientes de upsells

### 6. KPIs en Dashboard de Rentabilidad

Nuevo card mostrando:
- **Expansion MRR**: $X,XXX (suma de upsells)
- **% Expansion**: X% del MRR total viene de upsells

---

## Migracion de Datos Existentes

Para clientes actuales, se asume:
- `base_income = net_income` (todo el ingreso actual es base)
- `upsell_income = 0`

Puedes ajustar manualmente los clientes que ya tenian upsells.

---

## Ejemplo con tu Caso

Fernando Agreda:
- Antes: `net_income = 400`, `base_income = 0`, `upsell_income = 0`
- Despues de migracion: `base_income = 400`, `upsell_income = 0`
- Despues del upsell: `base_income = 400`, `upsell_income = 597`, `net_income = 997`

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Agregar columnas `base_income` y `upsell_income` |
| `src/integrations/supabase/types.ts` | Actualizar tipos de retainers |
| `src/types/retainers.ts` | Actualizar tipos si es necesario |
| `src/components/Retainers/RetainerFormDialog.tsx` | Dividir ingreso en base + upsell |
| `src/components/Retainers/RetainersTable.tsx` | Mostrar indicador de upsell |
| `src/hooks/useProfitabilityMetrics.ts` | Agregar metricas de expansion |
| `src/components/Retainers/ProfitabilityDashboard/KPISummaryCards.tsx` | Card de Expansion MRR |

---

## Seccion Tecnica

- La migracion usa `DEFAULT 0` para que todos los valores existentes sean validos
- Se actualiza `net_income` automaticamente al guardar (suma de base + upsell)
- El calculo de churn NO cambia - sigue usando `net_income` para MRR total
- Los upsells se consideran parte del cliente existente, no "nuevo MRR"
- Para expansion revenue: solo se cuenta `upsell_income` de clientes activos

