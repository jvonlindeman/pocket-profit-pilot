

# Colorear Filas Segun Estado del Cliente

## Objetivo

Cambiar el color de fondo de toda la fila en la tabla de retainers segun el estado del cliente (`client_status`). Los colores seran pasteles suaves para no ser agresivos visualmente.

---

## Paleta de Colores Pastel por Estado

| Estado | Color de Fila |
|--------|---------------|
| OK / Agradecido | Verde pastel muy suave (`bg-green-50/60`) |
| En seguimiento / Esperando respuesta | Azul pastel (`bg-blue-50/60`) |
| Duda o consulta / Con pendiente | Amarillo pastel (`bg-amber-50/60`) |
| Insatisfecho leve | Naranja pastel (`bg-orange-50/60`) |
| Enojado / Frustrado / Amenaza / Reclamo grave | Rosa/rojo pastel (`bg-red-50/60`) |
| Sin estado | Sin color (fondo normal) |

La opacidad `/60` hace que el color sea aun mas sutil.

---

## Cambios en RetainersTable.tsx

### 1. Agregar funcion para obtener color de fila (linea 49)

```typescript
// Mapeo de colores pastel para el fondo de la fila segun estado
function getRowBgClass(status: string | null): string {
  if (!status) return '';
  
  const rowColors: Record<string, string> = {
    'OK': 'bg-green-50/70',
    'Agradecido': 'bg-green-50/70',
    'En seguimiento': 'bg-blue-50/70',
    'Esperando respuesta': 'bg-blue-50/70',
    'Duda o consulta': 'bg-amber-50/70',
    'Con pendiente': 'bg-amber-50/70',
    'Insatisfecho leve': 'bg-orange-50/70',
    'Enojado': 'bg-red-50/60',
    'Frustrado': 'bg-red-50/60',
    'Amenaza con irse': 'bg-red-50/60',
    'Reclamo grave': 'bg-red-50/60',
  };
  
  return rowColors[status] || '';
}
```

### 2. Aplicar clase a TableRow (linea 85)

Cambiar:
```tsx
<TableRow key={r.id}>
```

Por:
```tsx
<TableRow key={r.id} className={getRowBgClass(clientStatus)}>
```

### 3. Actualizar celda de acciones sticky

La celda sticky necesita heredar el color de fondo para mantener consistencia visual:

```tsx
<TableCell className={`sticky right-0 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] py-2 ${getRowBgClass(clientStatus) || 'bg-background'}`}>
```

---

## Vista Previa Visual

```text
+-----------------------------------------------------+
| Cliente          | Espec.  | Estado         | ... |
+-----------------------------------------------------+
| Dr. Martinez     | Cardio  | OK             | ... | <- Verde pastel
| Dra. Lopez       | Dermato | En seguimiento | ... | <- Azul pastel  
| Dr. Perez        | General | Enojado        | ... | <- Rojo pastel
| Clinica ABC      | Hospital| -              | ... | <- Sin color
+-----------------------------------------------------+
```

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Retainers/RetainersTable.tsx` | Agregar funcion `getRowBgClass` y aplicar a TableRow |

---

## Seccion Tecnica

- Se usa Tailwind con opacidad (`/70` o `/60`) para lograr colores pastel sutiles
- La celda sticky de acciones hereda el color de fondo para evitar discontinuidad visual
- Los estados negativos (Enojado, Frustrado, etc.) usan rojo mas suave (`/60`) para no alarmar
- Las filas sin estado mantienen el fondo por defecto de la tabla
- Compatible con modo oscuro ya que Tailwind ajusta automaticamente los tonos

