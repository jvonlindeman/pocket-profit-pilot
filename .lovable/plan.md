
# Plan: Agregar funcionalidad de baja de retainers para calcular churn

## Resumen

Actualmente el sistema tiene la columna `canceled_at` en la base de datos y el cálculo de churn la usa correctamente, pero **no existe forma de establecer esta fecha desde la interfaz**. Se agregará la opción de dar de baja a un cliente registrando la fecha de cancelación.

---

## Estado Actual

| Componente | Estado |
|------------|--------|
| Columna `canceled_at` en BD | Ya existe |
| Cálculo de churn con `canceled_at` | Funcionando |
| Campo en formulario para `canceled_at` | No existe |
| Automatización al desactivar | No existe |

---

## Solución Propuesta

### Opción elegida: Campo de fecha + automatización

Cuando el usuario desactive un retainer (toggle "Activo" = off):
1. Mostrar un campo de fecha para seleccionar la fecha de baja
2. Si no se especifica fecha, usar la fecha actual automáticamente
3. Si se reactiva el cliente, limpiar `canceled_at`

---

## Flujo de Usuario

```text
Usuario edita retainer
        |
        v
Desactiva toggle "Activo"
        |
        v
Aparece campo "Fecha de baja"
(pre-llenado con fecha actual)
        |
        v
Usuario puede ajustar fecha
        |
        v
Al guardar -> canceled_at = fecha seleccionada
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Retainers/RetainerFormDialog.tsx` | Agregar campo de fecha de baja condicional |
| `src/components/Retainers/RetainersTable.tsx` | Mostrar fecha de baja en tabla (opcional) |
| `src/types/retainers.ts` | Verificar que `canceled_at` esté tipado |

---

## Cambios en el Formulario

El formulario mostrará:
- Toggle "Activo" (ya existe)
- Cuando "Activo" = false: campo "Fecha de baja" (input type="date")
- Pre-llenado con fecha actual si no hay valor previo

---

## Lógica de Guardado

```text
Si active = true:
  -> canceled_at = null (cliente activo, sin cancelación)

Si active = false:
  -> canceled_at = fecha seleccionada o fecha actual
```

---

## Impacto en Churn

| Escenario | Antes | Después |
|-----------|-------|---------|
| Desactivar cliente | Solo cambia `active` | Registra `canceled_at` |
| Cálculo de bajas | Siempre 0 (sin fechas) | Cuenta bajas reales |
| Reactivar cliente | - | Limpia `canceled_at` |

---

## Sección Técnica

### Nuevo estado en RetainerFormDialog

```text
const [canceledAt, setCanceledAt] = useState<string | null>(null);
```

### Campo condicional en el formulario

Mostrar solo cuando `active = false`:
- Input type="date"
- Valor por defecto: fecha actual en formato YYYY-MM-DD
- Label: "Fecha de baja"

### Modificación del payload

```text
payload = {
  ...existingFields,
  active,
  canceled_at: active ? null : (canceledAt || new Date().toISOString())
}
```

### Columna adicional en tabla (opcional)

Agregar columna "Fecha baja" que muestre `canceled_at` formateada si existe, o "-" si está activo.
