

# Integrar Webhook n8n para Estado de Clientes

## Resumen

Crear una edge function que consulte el webhook de n8n para obtener el estado/sentimiento de cada cliente y actualizar la tabla `retainers` con esa informacion. El estado se mostrara visualmente en la tabla de retainers.

---

## Paso 1: Agregar columnas a la tabla retainers

Nuevas columnas para almacenar el estado del cliente:

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `client_status` | `text` | Estado actual ("OK", "Agradecido", "En seguimiento", etc.) |
| `client_status_date` | `timestamptz` | Fecha de la ultima actualizacion del estado |

Los 11 valores posibles de status:
- OK, Agradecido, En seguimiento, Con pendiente, Esperando respuesta
- Duda o consulta, Insatisfecho leve, Enojado, Frustrado
- Amenaza con irse, Reclamo grave

---

## Paso 2: Crear Edge Function `sync-client-status`

La funcion realizara:

1. **Fetch al webhook n8n** - Consultar `https://drpremiern8n.lat/webhook/dc0d2f76-3d5c-4d59-9f8c-e34a55712254`
2. **Parsear respuesta** - Obtener array de `{client_id, name, status, date}`
3. **Actualizar retainers** - Para cada item, hacer UPDATE donde `n8n_id = client_id`
4. **Retornar resumen** - Cuantos actualizados, cuantos no encontrados

Configuracion en `config.toml`:
- `verify_jwt = true` (solo usuarios autenticados pueden sincronizar)

---

## Paso 3: Visualizacion en la UI

### 3.1 Badge de estado en RetainersTable

Agregar una columna "Estado" con badge de color segun el sentimiento:

| Color | Estados |
|-------|---------|
| Verde | OK, Agradecido |
| Azul | En seguimiento, Esperando respuesta |
| Amarillo | Duda o consulta, Con pendiente |
| Naranja | Insatisfecho leve |
| Rojo | Enojado, Frustrado, Amenaza con irse, Reclamo grave |

### 3.2 Boton de sincronizacion

En la pagina Retainers, agregar boton "Sincronizar estado n8n" que:
- Llame a la edge function
- Muestre toast con resultado
- Refresque la query de retainers

---

## Paso 4: Actualizar tipos TypeScript

Agregar a `RetainerRow`:
- `client_status: string | null`
- `client_status_date: string | null`

(Los tipos se regeneran automaticamente tras la migracion)

---

## Flujo de datos

```text
+------------------+     HTTP GET     +-------------------------+
|  Pagina          | --------------> |  Edge Function          |
|  Retainers.tsx   |                 |  sync-client-status     |
|  (boton sync)    |                 +-------------------------+
+------------------+                           |
        ^                                      | fetch webhook
        |                                      v
        |                          +-------------------------+
        |   invalidate query       |  n8n Webhook            |
        |<-------------------------|  (datos de sentimiento) |
        |                          +-------------------------+
        |                                      |
        |                                      | parse response
        v                                      v
+------------------+     UPDATE      +-------------------------+
|  React Query     | <------------- |  Supabase DB            |
|  useRetainers    |                 |  tabla retainers        |
+------------------+                 +-------------------------+
```

---

## Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| `supabase/functions/sync-client-status/index.ts` | Crear |
| `supabase/config.toml` | Agregar funcion |
| `src/components/Retainers/RetainersTable.tsx` | Agregar columna estado |
| `src/pages/Retainers.tsx` | Agregar boton sync |
| `src/hooks/queries/useRetainers.ts` | Agregar mutation para sync |

---

## Seccion Tecnica

### Edge Function (sync-client-status/index.ts)

```typescript
// Pseudocodigo
const response = await fetch(N8N_WEBHOOK_URL);
const clients = await response.json();

for (const client of clients) {
  await supabase
    .from('retainers')
    .update({
      client_status: client.status.trim(),
      client_status_date: client.date
    })
    .eq('n8n_id', client.client_id);
}
```

### Mapeo de colores para badges

```typescript
const statusColors: Record<string, string> = {
  'OK': 'bg-green-100 text-green-800',
  'Agradecido': 'bg-green-100 text-green-800',
  'En seguimiento': 'bg-blue-100 text-blue-800',
  'Esperando respuesta': 'bg-blue-100 text-blue-800',
  'Duda o consulta': 'bg-yellow-100 text-yellow-800',
  'Con pendiente': 'bg-yellow-100 text-yellow-800',
  'Insatisfecho leve': 'bg-orange-100 text-orange-800',
  'Enojado': 'bg-red-100 text-red-800',
  'Frustrado': 'bg-red-100 text-red-800',
  'Amenaza con irse': 'bg-red-100 text-red-800',
  'Reclamo grave': 'bg-red-100 text-red-800',
};
```

### Idempotencia (evitar llamadas duplicadas)

Para cumplir con el requisito de "solo una vez":
- La funcion usa service_role para updates directos
- No hay riesgo de duplicacion porque es una operacion de lectura del webhook + update puntual
- El boton de sync se deshabilitara mientras este en progreso (loading state)

---

## Consideraciones

1. **Sin n8n_id**: Clientes que no tienen `n8n_id` asignado no se actualizaran. El endpoint reportara cuantos quedaron sin match.

2. **Trim de status**: El webhook trae espacios al inicio (" Agradecido"), se hara `.trim()` antes de guardar.

3. **Refresh automatico**: Tras sincronizar, se invalida la query para mostrar datos actualizados.

