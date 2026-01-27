

# Plan: Optimizar tabla de Retainers para eliminar scroll horizontal

## Problema

La tabla actual tiene 13 columnas, lo que causa:
- Scroll horizontal obligatorio para ver los botones de acción
- Filas muy anchas que no caben en pantalla
- Mala experiencia de usuario al editar/eliminar

## Solución propuesta

Implementar **columna de acciones sticky** + **diseño compacto** para que todo quepa sin scroll horizontal.

---

## Cambios a implementar

### 1. Columna de acciones "sticky" (fija a la derecha)

La columna de acciones permanecerá visible mientras se hace scroll horizontal, usando `position: sticky` y `right: 0`.

### 2. Consolidar columnas para reducir ancho

| Antes | Después |
|-------|---------|
| Stripe (columna separada) | Iconos en la celda de Cliente |
| WA Bot (columna separada) | Iconos en la celda de Cliente |
| Activo (columna separada) | Badge de color en Cliente |
| Margen + Margen % (2 cols) | Una sola columna con ambos valores |

### 3. Diseño compacto de celdas

- Reducir padding de celdas
- Usar texto más pequeño donde sea apropiado
- Iconos en lugar de texto "Sí/No"

---

## Nueva estructura de columnas (8 en lugar de 13)

| Columna | Contenido |
|---------|-----------|
| Cliente | Nombre + badges (Legacy, Stripe, WA Bot) + indicador activo/inactivo |
| Especialidad | Texto corto |
| Ingreso | Monto formateado |
| Redes | Costo redes sociales |
| Gastos | Total gastos |
| Margen | Monto + porcentaje en una línea |
| Fecha baja | Fecha o "-" |
| Acciones | Botones sticky siempre visibles |

---

## Mockup visual

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Cliente              │ Espec. │ Ingreso │ Redes │ Gastos │ Margen      │ Baja │ Acciones │
├──────────────────────────────────────────────────────────────────────────┤
│ Acme Corp            │ Salud  │ $2,500  │ $200  │ $800   │ $1,700 (68%)│  -   │ [✏️][🗑️] │
│ 🟢 Legacy 💳 📱      │        │         │       │        │             │      │  ← sticky│
├──────────────────────────────────────────────────────────────────────────┤
│ Beta Inc             │ Legal  │ $1,800  │ $150  │ $600   │ $1,200 (67%)│  -   │ [✏️][🗑️] │
│ 🟢 💳               │        │         │       │        │             │      │          │
└──────────────────────────────────────────────────────────────────────────┘

Leyenda iconos:
🟢/🔴 = Activo/Inactivo
💳 = Usa Stripe  
📱 = WhatsApp Bot
```

---

## Sección Técnica

### Archivo a modificar

`src/components/Retainers/RetainersTable.tsx`

### Cambios específicos

**1. Columna sticky para acciones:**

```typescript
// En TableHead de Acciones
<TableHead className="sticky right-0 bg-background shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
  Acciones
</TableHead>

// En TableCell de Acciones  
<TableCell className="sticky right-0 bg-background shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
  ...botones
</TableCell>
```

**2. Consolidar Cliente con iconos:**

```typescript
<TableCell className="font-medium">
  <div className="flex items-center gap-1">
    <span className={`w-2 h-2 rounded-full ${r.active ? 'bg-green-500' : 'bg-red-500'}`} />
    <span>{r.client_name}</span>
    {row.is_legacy && <Badge variant="outline" className="text-xs">L</Badge>}
    {row.uses_stripe && <CreditCard className="h-3 w-3 text-muted-foreground" />}
    {row.has_whatsapp_bot && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
  </div>
</TableCell>
```

**3. Combinar Margen + Margen%:**

```typescript
<TableCell className="text-right">
  <div>
    <div className="font-medium">{formatCurrency(margin)}</div>
    <div className="text-xs text-muted-foreground">{marginPct.toFixed(1)}%</div>
  </div>
</TableCell>
```

**4. Botones de acción compactos con iconos:**

```typescript
<TableCell className="sticky right-0 bg-background">
  <div className="flex gap-1">
    <Button size="icon" variant="ghost" onClick={() => onEdit(r)}>
      <Pencil className="h-4 w-4" />
    </Button>
    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(r)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

---

## Resultado esperado

- Tabla de 8 columnas en lugar de 13
- Botones de acción siempre visibles (sticky)
- Todo el contenido cabe en una fila sin scroll horizontal en la mayoría de pantallas
- Información consolidada con iconos intuitivos

