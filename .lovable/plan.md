

# Corregir Mapeo de Colores para Estados con Emojis

## Problema Identificado

Los valores de `client_status` en la base de datos incluyen emojis al inicio:
- `🟢 Agradecido`
- `🟢 En seguimiento`  
- `🟡 Esperando respuesta`
- `🟡 Duda o consulta`

El codigo actual busca coincidencias exactas como `"En seguimiento"`, pero no encuentra match porque el valor real es `"🟢 En seguimiento"`.

---

## Solucion

Modificar la funcion `getRowBgClass()` para que busque si el status **contiene** alguna de las palabras clave, en lugar de requerir una coincidencia exacta.

---

## Cambios en RetainersTable.tsx

### Reemplazar la funcion getRowBgClass (lineas 50-69)

```typescript
// Mapeo de colores pastel para el fondo de la fila segun estado
function getRowBgClass(status: string | null): string {
  if (!status) return '';
  
  // Buscar por contenido, no coincidencia exacta (los estados pueden tener emojis)
  const statusLower = status.toLowerCase();
  
  // Estados positivos - verde pastel
  if (statusLower.includes('ok') || statusLower.includes('agradecido')) {
    return 'bg-green-50/70';
  }
  
  // Estados de seguimiento - azul pastel
  if (statusLower.includes('seguimiento') || statusLower.includes('esperando')) {
    return 'bg-blue-50/70';
  }
  
  // Estados de atencion - amarillo/ambar pastel
  if (statusLower.includes('duda') || statusLower.includes('consulta') || statusLower.includes('pendiente')) {
    return 'bg-amber-50/70';
  }
  
  // Estados de alerta leve - naranja pastel
  if (statusLower.includes('insatisfecho')) {
    return 'bg-orange-50/70';
  }
  
  // Estados criticos - rojo pastel
  if (statusLower.includes('enojado') || statusLower.includes('frustrado') || 
      statusLower.includes('amenaza') || statusLower.includes('reclamo')) {
    return 'bg-red-50/60';
  }
  
  return '';
}
```

### Actualizar tambien getStatusBadgeClass (lineas 45-48)

```typescript
function getStatusBadgeClass(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-500 border-gray-200';
  
  const statusLower = status.toLowerCase();
  
  // Estados positivos
  if (statusLower.includes('ok') || statusLower.includes('agradecido')) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  
  // Estados de seguimiento
  if (statusLower.includes('seguimiento') || statusLower.includes('esperando')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  
  // Estados de atencion
  if (statusLower.includes('duda') || statusLower.includes('consulta') || statusLower.includes('pendiente')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
  
  // Estados de alerta
  if (statusLower.includes('insatisfecho')) {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }
  
  // Estados criticos
  if (statusLower.includes('enojado') || statusLower.includes('frustrado') || 
      statusLower.includes('amenaza') || statusLower.includes('reclamo')) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  
  return 'bg-gray-100 text-gray-600 border-gray-200';
}
```

---

## Resultado Esperado

Con esta correccion:
- `🟢 Agradecido` -> detecta "agradecido" -> aplica `bg-green-50/70`
- `🟡 Esperando respuesta` -> detecta "esperando" -> aplica `bg-blue-50/70`
- `🟡 Duda o consulta` -> detecta "duda" -> aplica `bg-amber-50/70`

Las filas ahora mostraran los colores pastel correctos independientemente de si tienen emojis u otros prefijos.

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/Retainers/RetainersTable.tsx` | Cambiar funciones de mapeo para usar `includes()` en lugar de coincidencia exacta |

---

## Seccion Tecnica

- Se usa `toLowerCase()` para hacer la comparacion case-insensitive
- Se usa `includes()` para buscar subcadenas en lugar de coincidencia exacta
- El orden de las condiciones importa: se evaluan de mas especifico a mas general
- Esto hace el codigo mas robusto ante variaciones en el formato del status

