

# Agregar Opción "Año 2025" al DateRangePicker

## Problema

Actualmente estamos en enero 2026, y la opción "Este año" selecciona el rango **1 Ene 2026 - 30 Ene 2026**, cuando lo que necesitas es ver los datos del **año fiscal 2025 completo** (1 Ene 2025 - 31 Dic 2025).

## Solución

Agregar una nueva opción "Año 2025" al menú de rangos rápidos que seleccione todo el año anterior.

## Cambios a Realizar

### Archivo: `src/components/Dashboard/DateRangePicker.tsx`

1. **Agregar nueva función** `setLastYear()`:
```typescript
// Año anterior completo (2025)
const setLastYear = () => {
  const today = toPanamaTime(new Date());
  const lastYear = today.getFullYear() - 1; // 2025
  
  const firstDayOfLastYear = createStableDate(new Date(lastYear, 0, 1));  // 1 Ene 2025
  const lastDayOfLastYear = createStableDate(new Date(lastYear, 11, 31)); // 31 Dic 2025
  
  const newRange = {
    from: firstDayOfLastYear,
    to: lastDayOfLastYear
  };
  
  onRangeChange(newRange);
  setTempRange(newRange);
  setIsOpen(false);
};
```

2. **Agregar opción al DropdownMenu**:
```typescript
<DropdownMenuItem onClick={setLastYear}>Año 2025</DropdownMenuItem>
```

3. **Renombrar opciones para claridad**:
   - "Este año" se queda como está (2026)
   - Nueva opción: "Año 2025" o "Año anterior"

## Resultado Esperado

El menú de rangos rápidos mostrará:
- Mes actual
- Mes pasado  
- Mes anterior + actual
- Últimos 30 días
- Fin mes anterior a fin actual
- Este año (2026)
- **Año 2025** ← Nueva opción

Al seleccionar "Año 2025", se cargará el rango **1 Ene 2025 - 31 Dic 2025** y la vista YTD mostrará el resumen completo del año 2025.

