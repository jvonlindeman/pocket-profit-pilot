

# Fecha de Reactivación para Clientes Pausados

## Problema

Cuando un cliente está pausado, no hay forma de trackear cuándo se espera que vuelva ni recordar contactarle. El usuario pierde seguimiento de oportunidades de reactivación.

## Solución

Agregar un campo de "Fecha esperada de reactivación" para clientes pausados, con alertas en el dashboard cuando la fecha se acerca.

---

## Funcionalidades a Implementar

### 1. Campo en formulario de edición

Cuando el estado es "Pausado", mostrar un campo adicional:

```
Estado: ⚪ Activo  ⚪ Pausado  ⚪ Cancelado
                     ↓
        +------------------------+
        | Fecha de pausa         |
        | [28 ene 2026]          |
        +------------------------+
        | Fecha de reactivación  |
        | [15 feb 2026]          |
        +------------------------+
```

### 2. Card de Recordatorios en Dashboard

Nueva sección arriba de la tabla que muestre clientes pausados con reactivación próxima:

```
+----------------------------------------------------------+
| ⏰ Clientes a contactar                                   |
+----------------------------------------------------------+
| 🟡 Dr. García - Reactivación: 28 ene (hoy)     [Editar]  |
| 🟡 Clínica Norte - Reactivación: 1 feb (4 días) [Editar] |
+----------------------------------------------------------+
```

- Mostrar clientes cuya fecha de reactivación es dentro de los próximos 7 días
- Resaltar en rojo si la fecha ya pasó (oportunidad perdida)
- Incluir botón para editar directamente

### 3. Indicador visual en la tabla

En la columna de cliente pausado, mostrar la fecha de reactivación:

```
| Cliente       | Estado  | Reactivación |
|---------------|---------|--------------|
| Dr. García (P)| Pausado | 28 ene ⚠️    |
```

---

## Cambios en Base de Datos

Nueva columna en `retainers`:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `expected_reactivation_date` | `date` | Fecha esperada de reactivación (nullable) |

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Agregar columna `expected_reactivation_date` |
| `RetainerFormDialog.tsx` | Campo de fecha cuando status = "paused" |
| `RetainersTable.tsx` | Mostrar fecha de reactivación para pausados |
| `Retainers.tsx` | Componente de alertas de reactivación |

---

## Sección Técnica

### Migración SQL

```sql
ALTER TABLE retainers
ADD COLUMN expected_reactivation_date date NULL;

-- Comentario para documentación
COMMENT ON COLUMN retainers.expected_reactivation_date IS 
  'Fecha esperada de reactivación para clientes pausados';
```

### Lógica de Alertas

```typescript
// En Retainers.tsx
const upcomingReactivations = useMemo(() => {
  const today = new Date();
  const weekFromNow = addDays(today, 7);
  
  return rows
    .filter(r => {
      if (!r.active || !r.paused_at || !r.expected_reactivation_date) return false;
      const reactivationDate = new Date(r.expected_reactivation_date);
      return reactivationDate <= weekFromNow;
    })
    .map(r => ({
      ...r,
      daysUntil: differenceInDays(new Date(r.expected_reactivation_date), today),
      isOverdue: new Date(r.expected_reactivation_date) < today
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}, [rows]);
```

### UI del Card de Alertas

```tsx
{upcomingReactivations.length > 0 && (
  <Card className="border-yellow-200 bg-yellow-50/50">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center gap-2">
        <Clock className="h-5 w-5 text-yellow-600" />
        Clientes a contactar
      </CardTitle>
    </CardHeader>
    <CardContent>
      {upcomingReactivations.map(client => (
        <div key={client.id} className={cn(
          "flex items-center justify-between p-2 rounded",
          client.isOverdue && "bg-red-50 text-red-700"
        )}>
          <div>
            <span className="font-medium">{client.client_name}</span>
            <span className="text-sm text-muted-foreground ml-2">
              {client.isOverdue 
                ? `Vencido hace ${Math.abs(client.daysUntil)} días`
                : client.daysUntil === 0 
                  ? "Hoy"
                  : `En ${client.daysUntil} días`
              }
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onEdit(client)}>
            Editar
          </Button>
        </div>
      ))}
    </CardContent>
  </Card>
)}
```

### Formulario (sección Estado)

```tsx
{status === "paused" && (
  <div className="ml-6 space-y-3">
    <div>
      <Label className="text-xs text-muted-foreground">Fecha de pausa</Label>
      <Input type="date" value={pausedAt} onChange={...} />
    </div>
    <div>
      <Label className="text-xs text-yellow-600">
        ¿Cuándo contactar para reactivar?
      </Label>
      <Input 
        type="date" 
        value={expectedReactivationDate} 
        onChange={...}
        min={getTodayDateString()} // No permitir fechas pasadas
      />
    </div>
  </div>
)}
```

