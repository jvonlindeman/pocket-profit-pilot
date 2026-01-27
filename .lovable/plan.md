

# Plan: Corregir cálculo de Retention Rate para clientes Legacy

## Problema

Los clientes marcados como "legacy" tienen `created_at` igual a la fecha de importación (26 enero 2026). La lógica actual usa esta fecha para determinar si estaban "activos al inicio del mes", causando que:

- `startingActive = 0` (porque el 26 de enero es posterior al 1 de enero)
- `retentionRate = 100%` matemáticamente, pero se muestra incorrectamente

## Causa raíz

```text
// Lógica actual
wasActiveAtStart = isOnOrBefore(createdAt, periodStart)

// Para cliente legacy creado el 26/ene:
createdAt = 26-ene-2026
periodStart = 01-ene-2026
isOnOrBefore(26-ene, 01-ene) = FALSE  <-- ¡Incorrecto!
```

## Solución

Los clientes legacy deben considerarse como si hubieran existido "desde siempre". Modificar la lógica para usar una fecha muy antigua como `created_at` efectivo para clientes legacy.

---

## Cambios requeridos

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useChurnCalculator.ts` | Tratar `created_at` de clientes legacy como fecha antigua |

---

## Nueva lógica

```text
Para cada retainer:
  
  // Si es legacy, asumir que existía desde siempre
  createdAt = is_legacy 
    ? new Date('2000-01-01')  // Fecha muy antigua
    : created_at del registro
  
  // El resto de la lógica permanece igual
  wasActiveAtStart = createdAt <= periodStart 
                   && (no cancelado O cancelado después de periodStart)
```

---

## Resultado esperado

Para el mes actual (enero 2026):
- **Antes**: startingActive = 0, retentionRate = 0%
- **Después**: startingActive = ~30 (todos los legacy), retentionRate = 100% (si no hay bajas)

---

## Sección Técnica

### Cambio en useChurnCalculator.ts

```typescript
// Línea ~60, cambiar:
const createdAt = toDate((r as any).created_at) ?? periodStart;

// Por:
const isLegacy = Boolean((r as any).is_legacy);
const rawCreatedAt = toDate((r as any).created_at);
// Los clientes legacy se consideran activos "desde siempre"
const createdAt = isLegacy 
  ? new Date('2000-01-01') 
  : (rawCreatedAt ?? periodStart);
```

Esto asegura que:
1. Clientes legacy siempre cumplen `wasActiveAtStart` para cualquier mes
2. Clientes legacy SÍ se cuentan en MRR inicial
3. Nuevos clientes siguen usando su `created_at` real
4. Las cancelaciones siguen funcionando correctamente

