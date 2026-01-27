
# Agregar Modo Debug para Ver Respuesta Raw de n8n

## Objetivo

Agregar un parametro `debug=true` a la Edge Function para que retorne la respuesta raw del webhook sin procesarla. Esto te permitira ver exactamente que estructura esta enviando n8n.

---

## Solucion

Modificar la Edge Function para aceptar un query parameter `?debug=true` que:

1. Llama al webhook de n8n (una sola vez)
2. Retorna la respuesta raw completa en lugar de procesarla
3. Incluye metadata util: tipo de dato, si es array, keys del objeto, etc.

---

## Cambios en sync-client-status/index.ts

### 1. Detectar modo debug (despues de linea 52)

```typescript
// Check for debug mode
const url = new URL(req.url);
const debugMode = url.searchParams.get("debug") === "true";
```

### 2. Retornar respuesta raw si debug=true (despues de linea 70)

```typescript
// If debug mode, return raw response for inspection
if (debugMode) {
  return new Response(
    JSON.stringify({
      debug: true,
      responseType: typeof rawResponse,
      isArray: Array.isArray(rawResponse),
      keys: rawResponse && typeof rawResponse === 'object' ? Object.keys(rawResponse) : null,
      itemCount: Array.isArray(rawResponse) ? rawResponse.length : null,
      rawData: rawResponse,
      sampleItem: Array.isArray(rawResponse) && rawResponse.length > 0 ? rawResponse[0] : null,
    }, null, 2),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Como Usar

### Opcion A: Modificar el frontend temporalmente

Agregar `?debug=true` a la URL del fetch en `useRetainers.ts`:

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-client-status?debug=true`, {
```

### Opcion B: Llamar directamente desde consola del navegador

```javascript
const token = (await supabase.auth.getSession()).data.session.access_token;
const res = await fetch('https://rstexocnpvtxfhqbnetn.supabase.co/functions/v1/sync-client-status?debug=true', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await res.json());
```

---

## Resultado Esperado

Cuando llames con `?debug=true`, recibiras algo como:

```json
{
  "debug": true,
  "responseType": "object",
  "isArray": false,
  "keys": ["client_id", "name", "status", "date"],
  "itemCount": null,
  "rawData": {
    "client_id": "86dxj8mba",
    "name": "Dr. Guillermo Brennan",
    "status": "Activo",
    "date": "2026-01-27"
  },
  "sampleItem": null
}
```

Esto confirma que n8n esta enviando un solo objeto en lugar de un array.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/sync-client-status/index.ts` | Agregar logica de debug mode |

---

## Seccion Tecnica

La implementacion:
1. Extrae query params de la URL de la request
2. Si `debug=true`, retorna inmediatamente despues de parsear el JSON
3. Incluye metadatos utiles para diagnostico
4. El webhook solo se llama una vez (cumple con el requisito de single call)
5. En modo normal (sin debug), el comportamiento es identico al actual
