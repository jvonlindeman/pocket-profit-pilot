
# Sincronización Automática n8n + Vista de JSON

## Resumen

Sincronizar automáticamente el estado de clientes desde n8n cuando se carga la página de Retainers, y agregar un panel colapsable para ver el JSON de respuesta del webhook.

---

## Cambios a Implementar

### 1. Sincronización Automática al Cargar

Agregar un `useEffect` que dispare la sincronización automáticamente cuando:
- La página carga por primera vez
- Los datos de retainers ya están disponibles

Para evitar llamadas duplicadas, se usará una referencia (`useRef`) que trackea si ya se ejecutó la sincronización en esta sesión.

### 2. Panel de Debug con JSON de Respuesta

Agregar un componente colapsable debajo del botón de sincronización que muestre:
- Resultado de la última sincronización (updated, notFound, notFoundClients)
- JSON completo formateado
- Estado visual (éxito/error)

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/queries/useRetainers.ts` | Modificar `useSyncClientStatus` para exponer los datos de respuesta |
| `src/pages/Retainers.tsx` | Agregar `useEffect` para sync automático + componente de debug JSON |

---

## Sección Técnica

### Hook Modificado (useRetainers.ts)

La mutación ya retorna `SyncClientStatusResult` en `onSuccess`. Necesitamos exponer `data` del mutation result:

```typescript
// El hook ya retorna esto:
const syncStatusMut = useSyncClientStatus();

// Podemos acceder a:
syncStatusMut.data    // SyncClientStatusResult después de éxito
syncStatusMut.error   // Error si falló
syncStatusMut.status  // 'idle' | 'pending' | 'success' | 'error'
```

### Sincronización Automática (Retainers.tsx)

```typescript
// Referencia para evitar doble sync
const hasSyncedRef = React.useRef(false);

// Auto-sync al cargar (una sola vez)
React.useEffect(() => {
  if (!isLoading && rows.length > 0 && !hasSyncedRef.current) {
    hasSyncedRef.current = true;
    syncStatusMut.mutate();
  }
}, [isLoading, rows.length]);
```

### Panel de Debug Colapsable

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Code } from "lucide-react";

// Estado para controlar apertura
const [debugOpen, setDebugOpen] = React.useState(false);

// En el JSX, después del botón de sincronizar:
{syncStatusMut.data && (
  <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" className="gap-1">
        <Code className="h-4 w-4" />
        Ver respuesta JSON
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          debugOpen && "rotate-180"
        )} />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Card className="mt-2 bg-slate-50">
        <CardContent className="pt-4">
          <div className="text-sm space-y-2">
            <div className="flex gap-4">
              <Badge variant="success">{syncStatusMut.data.updated} actualizados</Badge>
              {syncStatusMut.data.notFound > 0 && (
                <Badge variant="secondary">{syncStatusMut.data.notFound} sin n8n_id</Badge>
              )}
            </div>
            <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(syncStatusMut.data, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </CollapsibleContent>
  </Collapsible>
)}
```

### Flujo Completo

```text
1. Usuario abre /retainers
2. useRetainersQuery carga los datos
3. useEffect detecta que rows.length > 0 y hasSyncedRef es false
4. Dispara syncStatusMut.mutate() automáticamente
5. UI muestra spinner en el botón mientras carga
6. Al completar, syncStatusMut.data contiene el resultado
7. Usuario puede expandir el panel de debug para ver el JSON
```

### Consideraciones

- **Single call**: La referencia `hasSyncedRef` asegura que solo se llama una vez por sesión de página
- **No bloquea UI**: La sincronización corre en background mientras el usuario ya puede ver los datos
- **Debug opcional**: El JSON está oculto por defecto para no saturar la UI
