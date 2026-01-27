
# Visibilidad de Clientes Pausados y Cancelados

## Problema Actual

El filtro por defecto está en "Solo activos", lo cual oculta pausados y cancelados. El usuario tiene que cambiar manualmente el filtro para verlos.

## Solución Propuesta

### 1. Cambiar Comportamiento por Defecto

Mostrar **activos + pausados** en la vista principal, ya que los pausados son clientes que podrían reactivarse y necesitan visibilidad.

### 2. Clientes Pausados - Visibilidad Prominente

Mantenerlos en la tabla principal con indicadores visuales claros:
- Fondo de fila amarillo/ámbar suave
- Badge "PAUSADO" visible en la columna de cliente
- Mostrar fecha de reactivación esperada si existe

### 3. Clientes Cancelados - Histórico Sutil

Crear una sección colapsable "Historial de bajas" debajo de las tablas principales:
- Colapsada por defecto
- Estilo más tenue (opacidad reducida, texto gris)
- Solo muestra: nombre, fecha de baja, MRR que se perdió
- Permite ver el histórico sin saturar la vista principal

---

## Cambios en Filtros

Nuevas opciones de estado:

| Valor | Muestra |
|-------|---------|
| `"current"` (default) | Activos + Pausados |
| `"active-only"` | Solo activos (sin pausados) |
| `"paused-only"` | Solo pausados |
| `"history"` | Solo cancelados (histórico) |

---

## Diseño Visual

### Fila de Cliente Pausado

```
┌─────────────────────────────────────────────────────────┐
│ 🟡 Dr. García  [PAUSADO]  │ Cardio │ $500 │ Reactiva: 15 feb │
└─────────────────────────────────────────────────────────┘
  ^ punto amarillo            ^ badge     ^ fecha visible
  ^ fondo fila amarillo suave
```

### Sección de Histórico (colapsada por defecto)

```
▶ Historial de bajas (3 clientes)
  ┌───────────────────────────────────────────────────┐
  │ Clínica Norte  │ Baja: 15 ene 2026  │ $800 MRR   │
  │ Dr. Méndez     │ Baja: 3 dic 2025   │ $500 MRR   │
  │ Alfa Panama    │ Baja: 19 ene 2026  │ $1,200 MRR │
  └───────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Retainers.tsx` | Cambiar filtro default, agregar sección de histórico |
| `src/components/Retainers/RetainersTable.tsx` | Mejorar indicadores visuales para pausados |
| Nuevo: `CanceledClientsHistory.tsx` | Componente colapsable para histórico |

---

## Sección Técnica

### Nuevo Filtro Default

```typescript
// Antes:
const [statusFilter, setStatusFilter] = React.useState<...>("active");

// Después:
const [statusFilter, setStatusFilter] = React.useState<
  "current" | "active-only" | "paused-only" | "history"
>("current");
```

### Lógica de Filtrado Actualizada

```typescript
const filtered = React.useMemo(() => {
  return rows.filter((r) => {
    const isPaused = r.active && !!(r as any).paused_at;
    const isActiveNotPaused = r.active && !(r as any).paused_at;
    const isCanceled = !r.active;
    
    switch (statusFilter) {
      case "current":
        // Activos + Pausados (excluir cancelados)
        return r.active;
      case "active-only":
        return isActiveNotPaused;
      case "paused-only":
        return isPaused;
      case "history":
        return isCanceled;
      default:
        return true;
    }
    // ... resto de filtros
  });
}, [rows, statusFilter, ...]);
```

### Lista de Cancelados (separada del filtro principal)

```typescript
// Siempre calculamos los cancelados para el historial
const canceledClients = React.useMemo(() => {
  return rows
    .filter(r => !r.active)
    .sort((a, b) => {
      // Ordenar por fecha de baja, más reciente primero
      const dateA = a.canceled_at ? new Date(a.canceled_at).getTime() : 0;
      const dateB = b.canceled_at ? new Date(b.canceled_at).getTime() : 0;
      return dateB - dateA;
    });
}, [rows]);
```

### Componente de Histórico

```tsx
// src/components/Retainers/CanceledClientsHistory.tsx
interface Props {
  clients: RetainerRow[];
}

export const CanceledClientsHistory: React.FC<Props> = ({ clients }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  if (clients.length === 0) return null;
  
  const totalLostMRR = clients.reduce((sum, c) => sum + (c.net_income ?? 0), 0);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Archive className="h-4 w-4" />
            <span className="text-sm">
              Historial de bajas ({clients.length} clientes)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalLostMRR)} MRR perdido
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Cliente</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Fecha de baja</TableHead>
                <TableHead className="text-right">MRR perdido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(c => (
                <TableRow key={c.id} className="opacity-70">
                  <TableCell className="font-medium">{c.client_name}</TableCell>
                  <TableCell>{c.specialty ?? "-"}</TableCell>
                  <TableCell>
                    {c.canceled_at 
                      ? new Date(c.canceled_at).toLocaleDateString('es-PA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(c.net_income ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
```

### Mejora Visual en RetainersTable para Pausados

```tsx
// En RetainersTable.tsx, agregar badge más visible para pausados
{(r as any).paused_at && r.active && (
  <Badge className="ml-1 text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 border-yellow-300">
    PAUSADO
  </Badge>
)}

// En la columna de fecha de reactivación (para pausados):
{(r as any).paused_at && r.active && (r as any).expected_reactivation_date && (
  <div className="text-xs text-yellow-600">
    Reactiva: {formatDate((r as any).expected_reactivation_date)}
  </div>
)}
```

### Opciones del Select Actualizadas

```tsx
<Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ...)}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="current">Activos y pausados</SelectItem>
    <SelectItem value="active-only">Solo activos</SelectItem>
    <SelectItem value="paused-only">Solo pausados</SelectItem>
    <SelectItem value="history">Histórico (bajas)</SelectItem>
  </SelectContent>
</Select>
```
