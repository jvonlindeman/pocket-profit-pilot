

# Plan: Agregar filtros de Stripe, WhatsApp Bot y mejorar vista de inactivos

## Situación actual

Los filtros existentes son:
- Búsqueda por texto (cliente o especialidad)
- Dropdown de especialidad
- Toggle "Solo activos" (oculta inactivos cuando está ON)

## Nuevos filtros a agregar

| Filtro | Tipo | Comportamiento |
|--------|------|----------------|
| Stripe | Toggle/Checkbox | Mostrar solo clientes que usan Stripe |
| WhatsApp Bot | Toggle/Checkbox | Mostrar solo clientes con bot de WA |
| Estado | Select con 3 opciones | Todos / Solo activos / Solo perdidos |

---

## Cambio en el filtro de estado

Actualmente el toggle binario "Solo activos" no permite ver **solo** los perdidos. Lo cambiaremos a un Select con 3 opciones:

| Opción | Muestra |
|--------|---------|
| Todos | Activos + Inactivos |
| Solo activos | Solo `active = true` |
| Solo perdidos | Solo `active = false` |

Esto permite analizar específicamente los clientes que se fueron.

---

## Diseño de UI

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Filtros                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Buscar___________________]  [Especialidad ▼]  [Estado ▼]                 │
│                                                                             │
│  Servicios:                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                                │
│  │ ☐ Usa Stripe     │  │ ☐ WhatsApp Bot   │                                │
│  └──────────────────┘  └──────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Lógica de filtrado actualizada

```typescript
const filtered = React.useMemo(() => {
  return rows.filter((r) => {
    // Filtro de estado (nuevo)
    if (statusFilter === "active" && !r.active) return false;
    if (statusFilter === "lost" && r.active) return false;
    // statusFilter === "all" muestra todos
    
    // Filtro de Stripe (nuevo)
    if (stripeOnly && !r.uses_stripe) return false;
    
    // Filtro de WhatsApp Bot (nuevo)
    if (whatsappOnly && !r.has_whatsapp_bot) return false;
    
    // Filtro de especialidad (existente)
    if (specialty !== "ALL" && (r.specialty ?? "") !== specialty) return false;
    
    // Búsqueda de texto (existente)
    if (search) {
      const s = search.toLowerCase();
      if (!r.client_name.toLowerCase().includes(s) && 
          !(r.specialty ?? "").toLowerCase().includes(s)) return false;
    }
    
    return true;
  });
}, [rows, statusFilter, stripeOnly, whatsappOnly, specialty, search]);
```

---

## Sección Técnica

### Archivo a modificar

`src/pages/Retainers.tsx`

### Nuevos estados

```typescript
// Reemplazar onlyActive por statusFilter
const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "lost">("active");

// Nuevos filtros booleanos
const [stripeOnly, setStripeOnly] = React.useState(false);
const [whatsappOnly, setWhatsappOnly] = React.useState(false);
```

### Nueva UI de filtros

```typescript
<CardContent>
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
    {/* Búsqueda - existente */}
    <div className="md:col-span-2">
      <label className="text-sm">Buscar</label>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cliente o especialidad" />
    </div>
    
    {/* Especialidad - existente */}
    <div>
      <label className="text-sm">Especialidad</label>
      <Select value={specialty} onValueChange={setSpecialty}>
        <SelectTrigger>
          <SelectValue placeholder="Todas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas</SelectItem>
          {specialties.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    
    {/* Estado - NUEVO (reemplaza toggle) */}
    <div>
      <label className="text-sm">Estado</label>
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "lost")}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Solo activos</SelectItem>
          <SelectItem value="lost">Solo perdidos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
  
  {/* Fila de checkboxes para servicios */}
  <div className="flex flex-wrap gap-4 mt-4">
    <div className="flex items-center gap-2">
      <Checkbox 
        id="stripeOnly" 
        checked={stripeOnly} 
        onCheckedChange={(checked) => setStripeOnly(!!checked)} 
      />
      <label htmlFor="stripeOnly" className="text-sm flex items-center gap-1">
        <CreditCard className="h-4 w-4" /> Usa Stripe
      </label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox 
        id="whatsappOnly" 
        checked={whatsappOnly} 
        onCheckedChange={(checked) => setWhatsappOnly(!!checked)} 
      />
      <label htmlFor="whatsappOnly" className="text-sm flex items-center gap-1">
        <MessageSquare className="h-4 w-4" /> WhatsApp Bot
      </label>
    </div>
  </div>
</CardContent>
```

---

## Resultado esperado

- Dropdown de Estado con 3 opciones: Todos / Solo activos / Solo perdidos
- Checkbox para filtrar solo clientes con Stripe
- Checkbox para filtrar solo clientes con WhatsApp Bot
- Los filtros son combinables (ej: "Solo perdidos" + "Usa Stripe" = clientes perdidos que usaban Stripe)
- Contadores en los headers de grupo se actualizan según los filtros aplicados

