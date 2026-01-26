

# Plan: Remover Historial Financiero y Asistente Financiero

## Resumen

Según la imagen proporcionada, se identifican dos componentes principales que ya no se utilizan:

1. **Historial Financiero** - Muestra "No hay datos históricos disponibles" con mensaje sobre guardar resúmenes
2. **Asistente Financiero** - La tarjeta promocional para el chatbot de IA con GPT

Estos componentes dependen de sistemas de almacenamiento que ya no funcionan correctamente tras la remoción del sistema de caché.

---

## Alcance de Remoción

### Componentes de UI a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `src/components/Dashboard/FinancialHistory/FinancialHistorySummary.tsx` | Componente de historial financiero |
| `src/components/Dashboard/FinancialAssistant/FinancialAssistantPromo.tsx` | Tarjeta promocional del asistente |
| `src/components/FinancialAssistant/ChatInput.tsx` | Input del chat |
| `src/components/FinancialAssistant/ChatMessages.tsx` | Lista de mensajes |
| `src/components/FinancialAssistant/FinancialAssistantButton.tsx` | Botón flotante global |
| `src/components/FinancialAssistant/FinancialAssistantDialog.tsx` | Diálogo principal |
| `src/components/FinancialAssistant/LoadingIndicator.tsx` | Indicador de carga |
| `src/components/FinancialAssistant/MessageBubble.tsx` | Burbuja de mensaje |
| `src/components/FinancialAssistant/SuggestedQuestion.tsx` | Pregunta sugerida |
| `src/components/FinancialAssistant/SuggestedQuestionsList.tsx` | Lista de preguntas |
| `src/components/Dashboard/StoredDataManager.tsx` | Manager de datos almacenados |

### Hooks a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useFinancialAssistant.tsx` | Hook principal del asistente |
| `src/hooks/useFinancialAssistant/constants.ts` | Constantes del asistente |
| `src/hooks/useFinancialAssistant/conversationMemoryService.ts` | Servicio de memoria |
| `src/hooks/useFinancialAssistant/messageProcessor.ts` | Procesador de mensajes |
| `src/hooks/useFinancialAssistant/types.ts` | Tipos del asistente |
| `src/hooks/useFinancialAssistant/uiDataEnhancer.ts` | Enhancer de datos UI |
| `src/hooks/useStoredFinancialData.tsx` | Hook de datos almacenados |
| `src/hooks/useStoredFinancialSummaries.tsx` | Hook de resúmenes almacenados |

### Servicios a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `src/services/financialAssistantService.ts` | Servicio para llamar a GPT |
| `src/services/semanticSearchService.ts` | Búsqueda semántica (ya es stub) |
| `src/services/financialDataStorage/` (directorio completo) | Almacenamiento de snapshots |
| `src/services/financialSummaryService.ts` | Servicio de resúmenes |

### Utils a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `src/utils/insightExtraction.ts` | Extracción de insights para GPT |
| `src/utils/suggestionGenerator.ts` | Generador de preguntas sugeridas |
| `src/utils/uiCapture/historicalDataCapture.ts` | Captura de datos históricos |

### Edge Function a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `supabase/functions/financial-assistant/index.ts` | Edge function del asistente GPT |

### Tipos a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `src/types/chat.ts` | Tipos para el chat del asistente |

---

## Archivos a Modificar

### 1. `src/App.tsx`
**Cambios**:
- Remover import de `FinancialAssistantButton`
- Remover el componente `<FinancialAssistantButton />` del árbol

### 2. `src/components/Dashboard/FinancialCards/RefinedFinancialSummary.tsx`
**Cambios**:
- Remover import de `FinancialHistorySummary`
- Remover import de `FinancialAssistantPromo`
- Eliminar el grid de 3 columnas con historial y promo del asistente
- Mantener IncomeTabs, RefinedExpensesSection, ProfitSection, UnpaidInvoicesSection

### 3. `src/components/Dashboard/DebugTools/FinancialDebugHelper.tsx`
**Cambios**:
- Remover import de `StoredDataManager`
- Eliminar el componente `<StoredDataManager />` del render

### 4. `src/utils/uiCapture/index.ts`
**Cambios**:
- Remover import de `captureHistoricalFinancialData`
- Remover la lógica de `historicalContext` y `temporalAnalysisAvailable`
- Simplificar `captureUIData` para no incluir datos históricos

### 5. `src/utils/uiCapture/dataOptimization.ts`
**Cambios**:
- Remover import de `HistoricalFinancialContext`
- Actualizar la interfaz para no incluir datos históricos

---

## Resumen de Cambios

| Tipo | Cantidad |
|------|----------|
| Archivos a eliminar | ~25 archivos |
| Directorios a eliminar | 3 directorios |
| Archivos a modificar | 5 archivos |
| Edge functions a eliminar | 1 |

---

## Orden de Implementación

1. **Modificar `App.tsx`** - Remover botón flotante del asistente
2. **Modificar `RefinedFinancialSummary.tsx`** - Remover secciones de historial y promo
3. **Modificar `FinancialDebugHelper.tsx`** - Remover StoredDataManager
4. **Modificar `utils/uiCapture/`** - Simplificar captura de datos
5. **Eliminar componentes del Financial Assistant** - Directorio completo
6. **Eliminar hooks relacionados** - useFinancialAssistant, useStoredFinancialData, etc.
7. **Eliminar servicios** - financialAssistantService, semanticSearchService, etc.
8. **Eliminar utils** - insightExtraction, suggestionGenerator, historicalDataCapture
9. **Eliminar edge function** - financial-assistant
10. **Eliminar tipos** - chat.ts

---

## Sección Técnica

### Estructura de Archivos a Eliminar

```text
src/
├── components/
│   ├── Dashboard/
│   │   ├── FinancialAssistant/
│   │   │   └── FinancialAssistantPromo.tsx
│   │   ├── FinancialHistory/
│   │   │   └── FinancialHistorySummary.tsx
│   │   └── StoredDataManager.tsx
│   └── FinancialAssistant/
│       ├── ChatInput.tsx
│       ├── ChatMessages.tsx
│       ├── FinancialAssistantButton.tsx
│       ├── FinancialAssistantDialog.tsx
│       ├── LoadingIndicator.tsx
│       ├── MessageBubble.tsx
│       ├── SuggestedQuestion.tsx
│       └── SuggestedQuestionsList.tsx
├── hooks/
│   ├── useFinancialAssistant.tsx
│   ├── useFinancialAssistant/
│   │   ├── constants.ts
│   │   ├── conversationMemoryService.ts
│   │   ├── messageProcessor.ts
│   │   ├── types.ts
│   │   └── uiDataEnhancer.ts
│   ├── useStoredFinancialData.tsx
│   └── useStoredFinancialSummaries.tsx
├── services/
│   ├── financialAssistantService.ts
│   ├── financialDataStorage/
│   │   ├── constants.ts
│   │   ├── gptFormatter.ts
│   │   ├── index.ts
│   │   ├── snapshotManager.ts
│   │   ├── storageOperations.ts
│   │   └── types.ts
│   ├── financialSummaryService.ts
│   └── semanticSearchService.ts
├── types/
│   └── chat.ts
└── utils/
    ├── insightExtraction.ts
    ├── suggestionGenerator.ts
    └── uiCapture/
        └── historicalDataCapture.ts

supabase/
└── functions/
    └── financial-assistant/
        └── index.ts
```

### Dependencias que se Romperán (y Cómo se Resolverán)

| Archivo Dependiente | Dependencia | Solución |
|---------------------|-------------|----------|
| `App.tsx` | `FinancialAssistantButton` | Eliminar import y uso |
| `RefinedFinancialSummary.tsx` | `FinancialHistorySummary`, `FinancialAssistantPromo` | Eliminar imports y secciones del render |
| `FinancialDebugHelper.tsx` | `StoredDataManager` | Eliminar import y uso |
| `uiCapture/index.ts` | `historicalDataCapture` | Eliminar import y simplificar función |

---

## Beneficios

1. **Menos código**: ~25 archivos menos
2. **Sin dependencia de GPT API Key**: Ya no se necesita la variable de entorno `GPT_API_KEY`
3. **UI más simple**: Dashboard sin componentes que muestran "sin datos"
4. **Menos edge functions**: Una función menos que mantener y pagar
5. **Sin almacenamiento local innecesario**: Se elimina el sistema de snapshots en localStorage

