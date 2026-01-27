
# Corrección de Clasificación de Especialidad Cardiovascular

## Problema Identificado

Los clientes con especialidad "Cirujano Cardiovascular" están apareciendo en la sección Webart en lugar de Doctor Premier debido a un error tipográfico en la lista de especialidades médicas.

### Estado Actual en Base de Datos
| Especialidad | Cantidad |
|--------------|----------|
| Cirjuano Cardiovascular (typo) | 1 cliente |
| Cirujano Cardiovascular (correcto) | 3 clientes |

### Estado Actual en Código
Solo existe `"Cirjuano Cardiovascular"` (mal escrito) en la lista de especialidades médicas, por lo que los 3 clientes con la especialidad escrita correctamente no son reconocidos como médicos.

---

## Solución

Agregar "Cirujano Cardiovascular" (escrito correctamente) a la lista de especialidades médicas.

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/utils/retainerClassification.ts` | Agregar "Cirujano Cardiovascular" a la lista |

---

## Cambio Específico

Agregar la línea `"Cirujano Cardiovascular",` a la lista `MEDICAL_SPECIALTIES` (junto con el typo existente para cubrir ambos casos):

```typescript
const MEDICAL_SPECIALTIES = [
  "Alergologo",
  "Cardiologo",
  "Cardiovascular",
  "Cirjuano Cardiovascular",  // existente (typo en DB)
  "Cirujano Cardiovascular",  // NUEVO - versión correcta
  "Cirujano",
  "Cirujano Plástico",
  // ... resto igual
];
```

## Resultado Esperado

- Los 3 clientes con "Cirujano Cardiovascular" pasarán a la sección Doctor Premier
- El 1 cliente con el typo seguirá funcionando correctamente
- Total: 4 clientes cardiovasculares en Doctor Premier
