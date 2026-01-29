

# Estado Elaborado de Clientes - Nuevos Campos de n8n

## Situación Actual

La Edge Function `sync-client-status` recibe solo estos campos desde n8n:

```typescript
interface N8nClientStatus {
  client_id: string;
  name: string;
  status: string;    // "OK", "Agradecido", "En seguimiento", etc.
  date: string;      // Fecha del último contacto
}
```

Se muestran en la tabla como un badge de estado con tooltip de fecha.

---

## Datos Adicionales Disponibles

Según el reporte que compartes, n8n tiene más información que podríamos sincronizar:

| Campo | Ejemplo | Uso en UI |
|-------|---------|-----------|
| Días desde contacto | "14 días", "hoy" | Indicador visual de urgencia |
| Quién envió último mensaje | "Doctor Premier" / "Cliente" | Badge diferenciador |
| Project Manager | "Sin PM asignado" | Agrupación/filtrado |

---

## Plan de Implementación

### Fase 1: Migración de Base de Datos

Agregar columnas a la tabla `retainers`:

```sql
ALTER TABLE retainers 
ADD COLUMN days_since_contact integer DEFAULT NULL,
ADD COLUMN last_message_from text DEFAULT NULL,
ADD COLUMN project_manager text DEFAULT NULL;
```

### Fase 2: Actualizar Edge Function

Modificar `supabase/functions/sync-client-status/index.ts`:

```typescript
interface N8nClientStatus {
  client_id: string;
  name: string;
  status: string;
  date: string;
  days_since_contact?: number;      // NUEVO
  last_message_from?: string;       // NUEVO: "Doctor Premier" | "Cliente"
  project_manager?: string;         // NUEVO
}

// En el update:
.update({
  client_status: trimmedStatus,
  client_status_date: client.date,
  days_since_contact: client.days_since_contact ?? null,
  last_message_from: client.last_message_from ?? null,
  project_manager: client.project_manager ?? null,
})
```

### Fase 3: Actualizar UI de la Tabla

En `src/components/Retainers/RetainersTable.tsx`, enriquecer la columna Estado:

```text
Actual:                          Propuesto:
┌──────────────┐                ┌────────────────────────────┐
│ ✅ OK        │       →        │ ✅ OK · 14d · 👤 Cliente   │
│              │                │ PM: Sin asignar            │
└──────────────┘                └────────────────────────────┘
```

**Diseño visual propuesto:**

```tsx
<TableCell className="py-2">
  <div className="space-y-0.5">
    {/* Línea 1: Estado + días + quién */}
    <div className="flex items-center gap-1 flex-wrap">
      <Badge className={getStatusBadgeClass(clientStatus)}>
        {clientStatus || "—"}
      </Badge>
      {daysAgo !== null && (
        <span className={`text-[10px] ${daysAgo > 7 ? 'text-orange-600' : 'text-muted-foreground'}`}>
          {daysAgo === 0 ? 'hoy' : `${daysAgo}d`}
        </span>
      )}
      {lastMessageFrom && (
        <Badge variant="outline" className="text-[10px] px-1">
          {lastMessageFrom === 'Cliente' ? '👤' : '🏢'}
        </Badge>
      )}
    </div>
    {/* Línea 2: PM (si hay) */}
    {projectManager && (
      <span className="text-[10px] text-muted-foreground">
        PM: {projectManager}
      </span>
    )}
  </div>
</TableCell>
```

### Fase 4: Alertas de Urgencia

Clientes con más de 7 días sin contacto y último mensaje de Cliente se resaltan automáticamente.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Agregar 3 columnas |
| `supabase/functions/sync-client-status/index.ts` | Procesar nuevos campos |
| `src/integrations/supabase/types.ts` | Regenerar tipos (automático) |
| `src/components/Retainers/RetainersTable.tsx` | UI enriquecida |

---

## Requisito Previo: Actualizar Webhook de n8n

Para que esto funcione, el webhook de n8n debe retornar los campos adicionales:

```json
{
  "client_id": "abc123",
  "name": "Dr. Jose Batista",
  "status": "OK",
  "date": "2025-01-15",
  "days_since_contact": 14,
  "last_message_from": "Doctor Premier",
  "project_manager": null
}
```

---

## Resultado Esperado

Antes:
```
| Estado        |
|---------------|
| ✅ OK         |
```

Después:
```
| Estado                      |
|-----------------------------|
| ✅ OK · 14d · 🏢            |
| PM: Sin asignar             |
```

La tabla mostrará información mucho más rica sobre el estado de comunicación con cada cliente.

