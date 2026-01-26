
# Plan: Agregar Campos Faltantes a Retainers

## Resumen

Se agregarán 3 nuevos campos a la tabla `retainers` para coincidir con la estructura del Excel: indicador de Stripe, artículos por mes, y bot de WhatsApp.

---

## Nuevos Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `uses_stripe` | boolean | Indica si el cliente paga mediante Stripe (default: false) |
| `articles_per_month` | integer | Cantidad de artículos entregados por mes (default: 0) |
| `has_whatsapp_bot` | boolean | Indica si el cliente tiene bot de WhatsApp (default: false) |

---

## Archivos a Modificar

### 1. Migración SQL (nueva)
Agregar los 3 campos a la tabla `retainers`:
```sql
ALTER TABLE retainers
  ADD COLUMN uses_stripe boolean NOT NULL DEFAULT false,
  ADD COLUMN articles_per_month integer NOT NULL DEFAULT 0,
  ADD COLUMN has_whatsapp_bot boolean NOT NULL DEFAULT false;
```

### 2. `src/components/Retainers/RetainerFormDialog.tsx`
Agregar inputs para los 3 nuevos campos:
- Switch para "Stripe"
- Input numérico para "Artículos/mes"
- Switch para "WhatsApp Bot"

### 3. `src/components/Retainers/RetainersTable.tsx`
Agregar 3 columnas nuevas a la tabla:
- Stripe (Sí/No)
- Artículos/mes (número)
- WhatsApp Bot (Sí/No)

### 4. `src/components/Retainers/CsvPasteDialog.tsx`
Actualizar el mapeo CSV para reconocer las nuevas columnas al importar.

### 5. `src/pages/Retainers.tsx`
Actualizar la función `exportCsv` para incluir los nuevos campos en la exportación.

---

## Resumen de Cambios

| Tipo | Cantidad |
|------|----------|
| Migración SQL | 1 |
| Archivos a modificar | 4 |

---

## Orden de Implementación

1. Crear migración SQL para agregar columnas
2. Actualizar `RetainerFormDialog.tsx` con nuevos inputs
3. Actualizar `RetainersTable.tsx` con nuevas columnas
4. Actualizar `CsvPasteDialog.tsx` para mapeo de nuevos campos
5. Actualizar `Retainers.tsx` para exportación CSV
6. Los tipos de Supabase se actualizarán automáticamente

---

## Sección Tecnica

### Estructura Final de Retainers

```text
retainers
├── id (uuid)
├── client_name (text)
├── specialty (text, nullable)
├── net_income (numeric)
├── social_media_cost (numeric)
├── total_expenses (numeric)
├── uses_stripe (boolean)         -- NUEVO
├── articles_per_month (integer)  -- NUEVO
├── has_whatsapp_bot (boolean)    -- NUEVO
├── active (boolean)
├── notes (text, nullable)
├── metadata (jsonb)
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── canceled_at (timestamptz, nullable)
```

### Mapeo CSV Actualizado

| Header CSV esperado | Campo DB |
|---------------------|----------|
| Cliente | client_name |
| Especialidad | specialty |
| income / Ingreso neto | net_income |
| Stripe | uses_stripe |
| Articulos/mes | articles_per_month |
| Redes | social_media_cost |
| Total Gastos | total_expenses |
| wha bot / WhatsApp | has_whatsapp_bot |
| Activo | active |
| Notas | notes |

### Actualización del Formulario

El formulario de retainer tendrá esta estructura:
- Fila 1: Cliente | Especialidad
- Fila 2: Ingreso neto | Redes (costo)
- Fila 3: Total gastos | Artículos/mes
- Fila 4: Stripe (switch) | WhatsApp Bot (switch) | Activo (switch)
- Fila 5: Notas (textarea, ancho completo)

### Actualización de la Tabla

Nueva estructura de columnas:
```text
Cliente | Especialidad | Ingreso | Stripe | Art/mes | Redes | Gastos | Margen | Margen% | WA Bot | Activo | Acciones
```
