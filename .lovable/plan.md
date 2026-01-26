

# Plan: Limpiar Elementos UI de Caché Restantes

## Resumen del Problema

Aunque el sistema de caché persistente fue eliminado, todavía existen múltiples elementos de UI y props que hacen referencia al concepto de "caché", lo cual confunde porque ya no hay caché persistente - solo React Query en memoria.

## Archivos a Modificar

### 1. `src/components/Dashboard/PeriodHeader.tsx`
**Problema**: Muestra badges de "Cache", opciones de "Usar Cache" vs "Datos Frescos", y status de cacheStatus

**Cambios**:
- Eliminar props `hasCachedData`, `usingCachedData`, `cacheStatus`
- Simplificar el dropdown a un solo botón "Actualizar Datos"
- Remover los badges de cache (Z, S) y el indicador "Cache"
- Mantener solo la funcionalidad de refresh con debounce

### 2. `src/components/Dashboard/InitialLoadPrompt.tsx`
**Problema**: Muestra mensajes sobre "Verificando Datos en Caché" y "Datos en Caché Disponibles"

**Cambios**:
- Eliminar props `cacheChecked`, `hasCachedData`
- Simplificar a un solo mensaje: "Cargar Datos Financieros"
- Remover el estado de "verificando caché"
- Un solo botón para cargar datos desde API

### 3. `src/components/Dashboard/NoDataLoadedState.tsx`
**Problema**: Tiene botones separados para "Cargar desde Cache" y "Cargar Datos Frescos"

**Cambios**:
- Eliminar props `onLoadCache`, `hasCachedData`
- Simplificar a un solo botón "Cargar Datos"
- Remover explicaciones de cache vs frescos

### 4. `src/components/Dashboard/InitialSetup.tsx`
**Problema**: Pasa props de cache a InitialLoadPrompt

**Cambios**:
- Eliminar props `cacheChecked`, `hasCachedData`
- Simplificar la interfaz

### 5. `src/components/Dashboard/DashboardDataHandlers.tsx`
**Problema**: Tiene lógica y mensajes sobre caché

**Cambios**:
- Eliminar prop `hasCachedData`
- Actualizar mensajes de toast para no mencionar caché

### 6. `src/components/Dashboard/DashboardContent.tsx`
**Problema**: Recibe y pasa props de cache

**Cambios**:
- Eliminar props `hasCachedData`, `usingCachedData`, `cacheStatus`
- Actualizar llamadas a componentes hijos

### 7. `src/components/Dashboard/DashboardStateManager.tsx`
**Problema**: Exporta valores de cache

**Cambios**:
- Mantener internamente pero no exponer `usingCachedData`, `cacheStatus`, `cacheChecked`, `hasCachedData`

### 8. `src/components/Dashboard/DashboardPageWrapper.tsx`
**Problema**: Pasa props de cache a componentes

**Cambios**:
- Eliminar props de cache en llamadas a componentes
- Actualizar logging para no mencionar cache

### 9. `src/components/Dashboard/DebugTools/CacheStorageDiagnostic.tsx`
**Problema**: Componente completo de diagnóstico de caché que ya no funciona (las tablas fueron eliminadas)

**Cambios**:
- **ELIMINAR** este archivo completamente

### 10. `src/hooks/queries/useOptimizedFinancialData.ts`
**Problema**: Mantiene estado de cache que ya no tiene sentido

**Cambios**:
- Simplificar estado: eliminar `usingCachedData`, `cacheStatus`, `hasCachedData`, `cacheChecked`
- Retornar solo el estado relevante: `transactions`, `loading`, `error`, `isRefreshing`, `isDataRequested`

### 11. `src/hooks/useFinanceData.tsx`
**Problema**: Expone valores de cache desde useOptimizedFinancialData

**Cambios**:
- Eliminar exports de `usingCachedData`, `cacheStatus`, `cacheChecked`, `hasCachedData`
- Simplificar el return del hook

---

## Sección Técnica

### Flujo de Datos Simplificado

```text
Usuario → "Cargar Datos" → useFinanceData.refreshData() → useOptimizedFinancialData.fetchData()
                                                              ↓
                                                    stripeRepository.getTransactions()
                                                    zohoRepository.getTransactions()
                                                              ↓
                                                    React Query (caché en memoria)
```

### Props a Eliminar por Componente

| Componente | Props a Eliminar |
|------------|------------------|
| PeriodHeader | hasCachedData, usingCachedData, cacheStatus |
| InitialLoadPrompt | cacheChecked, hasCachedData |
| NoDataLoadedState | onLoadCache, hasCachedData |
| InitialSetup | cacheChecked, hasCachedData |
| DashboardDataHandlers | hasCachedData |
| DashboardContent | hasCachedData, usingCachedData, cacheStatus |

### Estado a Simplificar en Hooks

**useOptimizedFinancialData**:
```typescript
// ANTES
interface FinancialData {
  transactions: Transaction[];
  stripeData?: any;
  loading: boolean;
  error: string | null;
  usingCachedData: boolean;      // ELIMINAR
  cacheStatus: {...};            // ELIMINAR
  isDataRequested: boolean;
  cacheChecked: boolean;         // ELIMINAR
  hasCachedData: boolean;        // ELIMINAR
  isRefreshing: boolean;
}

// DESPUÉS
interface FinancialData {
  transactions: Transaction[];
  stripeData?: any;
  loading: boolean;
  error: string | null;
  isDataRequested: boolean;
  isRefreshing: boolean;
}
```

---

## Orden de Implementación

1. Modificar `useOptimizedFinancialData.ts` - simplificar el estado
2. Modificar `useFinanceData.tsx` - eliminar exports de cache
3. Modificar `DashboardStateManager.tsx` - no exponer valores de cache
4. Modificar `PeriodHeader.tsx` - simplificar UI
5. Modificar `InitialLoadPrompt.tsx` - simplificar UI
6. Modificar `NoDataLoadedState.tsx` - simplificar UI
7. Modificar `InitialSetup.tsx` - eliminar props
8. Modificar `DashboardDataHandlers.tsx` - eliminar props y mensajes
9. Modificar `DashboardContent.tsx` - eliminar props
10. Modificar `DashboardPageWrapper.tsx` - eliminar props
11. **ELIMINAR** `CacheStorageDiagnostic.tsx`

---

## Resultado Final

- UI sin menciones de "caché"
- Un solo botón "Cargar Datos" o "Actualizar"
- Código más simple y fácil de mantener
- ~11 archivos modificados, 1 archivo eliminado

