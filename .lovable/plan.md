

# Plan: Agregar ID de n8n a clientes

## Resumen

Agregar una nueva columna `n8n_id` a la tabla `retainers` para almacenar el identificador único de cada cliente en n8n. Esto permitirá recibir datos de sentimiento y estado desde n8n y vincularlos correctamente.

## Cambios a realizar

### 1. Migración de base de datos

Agregar columna `n8n_id` de tipo texto, única y nullable:

```sql
ALTER TABLE retainers 
ADD COLUMN n8n_id text DEFAULT NULL;

CREATE UNIQUE INDEX idx_retainers_n8n_id 
ON retainers (n8n_id) 
WHERE n8n_id IS NOT NULL;

COMMENT ON COLUMN retainers.n8n_id IS 
  'ID unico del cliente en n8n para sincronizacion';
```

### 2. Poblar datos iniciales

Script SQL para asignar los IDs de n8n basado en el mapeo de las imagenes:

| Cliente (Supabase) | n8n_id |
|--------------------|--------|
| AutoCash | 3nuuwjh |
| Centro Urologico | 86dtqvqr1 |
| CDA | 86drbpmmp |
| Cendigastro | 86dw5rh34 |
| Clinica Dental Obarrio | 86du2fx0d |
| Clinica Ford | 3nuuwr2 |
| Copac | 3nuuvcy |
| Cremaciones la Gloria | 86du5t3jy |
| Docati | 86dvdy783 |
| Dr. Alejandro | 865d9e8n7 |
| Dr. Carlos Rebollon | 3nuuve5 |
| Dr. Christopher Chung | 86dqy50ce |
| Dr. David Espinosa | 86dumpm4d |
| Dr Fernando Agreda | 86drmh86q |
| Dr Fernando Ku | 86dvuzjnm |
| Dr. Guillermo Julio Tatis | 3nuuvnh |
| Dr. Humberto Juarez | 86dr1eduj |
| Dr Jose Batista | 86dtn2ccp |
| Dr. Jose Felix | 3nuuwvg |
| Dr Jose Francisco | 86drwz1m5 |
| Dr Kam | 86dtg2nyx |
| Dr Lech | 3nuuvtk |
| Dr. Mario | 3nuuwz0 |
| Dr Nelson | 86dv66ncy |
| Dr. Oman | 86dw784c8 |
| Dr Raul | 86dt1tayx |
| Dr. Roberto Garcia | 3nuux8e |
| Dr. Trejos | 3nuuwug |
| Eco Ink | 866a05kpj |
| eurocash | 3y7yg8w |
| Fudimi | 86dqktuby |
| Fumigadora Express | 86dwjwyh9 |
| funeraria virgen | 86dv2aaj7 |
| Grupo Tecnik | 86dr4razm |
| Julio effio | 866am5r12 |
| Laboratorio America | 86dv7jc0g |
| Legalia | 861n7r2r8 |
| Panama Gili | 86dtgg9er |
| Panama Vision Institute | 86dwx9zq4 |
| Petclub | 86dxzxxdx |
| PGS Legal | 8669gx0tb |
| Think Safety | 3nuuw65 |
| Biosinfex | 86dwqjzwp |
| CDA Express | 86dt115bd |
| Cheers | 86dx2vdkd |
| Dra. Brenda | 3nuuwak |
| Dra. Diana Tejada | 3nuuwv9 |
| Dra Maria Alejandra | 85ztuz3b7 |
| Dra Yurielis | 86dvzftby |
| Dr Cesar Diaz | 86dwc0pcm |
| BH Contadores | 86dvf4tvg |
| Alfa Panama | 86dxtdch4 |
| Arcom | (falta en imagenes) |
| Optirex | 86duttbhc |
| Transporte Serrano | 3nuuv5e |
| ... | ... |

(Total: ~75 clientes para mapear)

### 3. Actualizar tipos TypeScript

El archivo `src/integrations/supabase/types.ts` se actualizara automaticamente con:
```typescript
n8n_id: string | null
```

### 4. Agregar campo al formulario (opcional)

Si quieres poder editar el n8n_id manualmente, agregarlo a `RetainerFormDialog.tsx` como campo de solo lectura o editable.

### 5. Mostrar en tabla (opcional)

Agregar columna visible en `RetainersTable.tsx` para verificar que el mapeo sea correcto.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Agregar columna `n8n_id` |
| Script SQL | Poblar IDs existentes |
| `src/integrations/supabase/types.ts` | Se regenera automaticamente |
| `src/components/Retainers/RetainerFormDialog.tsx` | (Opcional) Campo para ver/editar n8n_id |

---

## Notas importantes

1. **Mapeo manual necesario**: Los nombres no coinciden exactamente, asi que hare el mejor esfuerzo de mapear. Algunos casos ambiguos:
   - "Ortopedas Panama" puede ser "Centro Esp. Ortopedicas" o "CEOSA" 
   - "Dr. Guillermo Brennan" no existe en tu base de datos
   - "Doctor Premier" / "pruebas" parecen ser cuentas de prueba

2. **Clientes sin ID de n8n**: Algunos clientes en tu base de datos no aparecen en las imagenes (ej: "Carlos Esposo Irma", "Fonoaudiologia"). Quedaran con `n8n_id = NULL`.

3. **Indice unico**: El indice garantiza que no haya duplicados, pero permite NULLs multiples.

