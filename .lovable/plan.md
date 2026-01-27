

# Plan: Agrupar clientes en Doctor Premier y Webart

## Objetivo

Separar visualmente los retainers en dos secciones:
- **Doctor Premier**: Clientes médicos (clínicas, doctores, hospitales, laboratorios)
- **Webart**: Clientes no médicos (empresas, comercios, servicios generales)

---

## Lógica de clasificación

| Grupo | Criterio |
|-------|----------|
| Doctor Premier | Tiene `specialty` médica (cualquier valor excepto Funeraria) |
| Webart | `specialty` es NULL, vacío, o "Funeraria" |

### Especialidades médicas detectadas:
Alergologo, Cardiologo, Cardiovascular, Cirujano, Cirujano Plástico, Clinica Radiologia, Clínica Ultrasonidos, Dentista, Dermatologo, Fondoaudiologa, Gastro, Ginecologo, Hospital, Internista, Laboratorio, Oftalmologo, Oncologo, Ortopeda, Otorrino, Resonancia, Urólogo, Varices

### Especialidades no médicas:
Funeraria, NULL (sin especialidad)

---

## Diseño de la UI

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Botones: Agregar | Importar CSV | Exportar CSV]                           │
│  [Filtros: Buscar | Especialidad | Solo activos]                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  DOCTOR PREMIER                                    43 clientes | $28,000 ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  | Cliente     | Espec.   | Ingreso | Redes | Gastos | Margen   | Baja | ││
│  │  | Dr. Batista | Alergo   | $850    | $0    | $200   | $650 77% |  -   | ││
│  │  | Dr. Effio   | Cardio   | $800    | $100  | $300   | $500 63% |  -   | ││
│  │  | ...         | ...      | ...     | ...   | ...    | ...      | ...  | ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  WEBART                                            23 clientes | $14,000 ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  | Cliente      | Espec.     | Ingreso | Redes | Gastos | Margen | Baja | ││
│  │  | Alfa Panama  | -          | $500    | $0    | $150   | $350   |  -   | ││
│  │  | Arcom        | -          | $1180   | $200  | $400   | $780   |  -   | ││
│  │  | Fudimi       | Funeraria  | $1100   | $150  | $350   | $750   |  -   | ││
│  │  | ...          | ...        | ...     | ...   | ...    | ...    | ...  | ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Resumen | Churn | Dashboard de Rentabilidad]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a crear/modificar

| Archivo | Cambio |
|---------|--------|
| `src/utils/retainerClassification.ts` | Nuevo: lógica para clasificar médico/no-médico |
| `src/components/Retainers/GroupedRetainersSection.tsx` | Nuevo: sección con header del grupo + tabla |
| `src/pages/Retainers.tsx` | Modificar: usar secciones agrupadas en lugar de una sola tabla |

---

## Detalle de cada sección

Cada grupo mostrará:
- **Header con nombre del grupo** (Doctor Premier / Webart)
- **KPIs rápidos**: cantidad de clientes, MRR total del grupo
- **Tabla de retainers** (la misma estructura optimizada actual)
- **Colapsable** (opcional): poder expandir/contraer cada sección

---

## Sección Técnica

### Archivo: `src/utils/retainerClassification.ts`

```typescript
// Lista de especialidades médicas conocidas
const MEDICAL_SPECIALTIES = [
  "Alergologo", "Cardiologo", "Cardiovascular", 
  "Cirjuano Cardiovascular", "Cirujano", "Cirujano Plástico",
  "Clinica Radiologia", "Clínica Ultrasonidos", "Dentista",
  "Dermatologo", "Fondoaudiologa", "Gastro", "Ginecologo",
  "Hospital", "Internista", "Laboratorio", "Oftalmologo",
  "Oncologo", "Ortopeda", "Otorrino", "Resonancia", 
  "Urólogo", "Varices"
];

export function isMedicalClient(specialty: string | null): boolean {
  if (!specialty) return false;
  return MEDICAL_SPECIALTIES.some(
    s => s.toLowerCase() === specialty.toLowerCase()
  );
}

export type ClientGroup = "doctor-premier" | "webart";

export function getClientGroup(specialty: string | null): ClientGroup {
  return isMedicalClient(specialty) ? "doctor-premier" : "webart";
}
```

### Archivo: `src/components/Retainers/GroupedRetainersSection.tsx`

```typescript
interface Props {
  title: string;
  icon?: React.ReactNode;
  retainers: RetainerRow[];
  onEdit: (row: RetainerRow) => void;
  onDelete: (row: RetainerRow) => void;
}

// Componente que muestra:
// 1. Collapsible header con título + métricas
// 2. Tabla de retainers cuando está expandido
```

### Cambios en `src/pages/Retainers.tsx`

```typescript
// Separar los retainers filtrados en dos grupos
const { doctorPremier, webart } = React.useMemo(() => {
  const dp: RetainerRow[] = [];
  const wa: RetainerRow[] = [];
  for (const r of filtered) {
    if (isMedicalClient(r.specialty)) {
      dp.push(r);
    } else {
      wa.push(r);
    }
  }
  return { doctorPremier: dp, webart: wa };
}, [filtered]);

// Renderizar dos secciones separadas
<GroupedRetainersSection
  title="Doctor Premier"
  retainers={doctorPremier}
  ...
/>
<GroupedRetainersSection
  title="Webart"
  retainers={webart}
  ...
/>
```

---

## Comportamiento de filtros

Los filtros existentes seguirán funcionando normalmente:
- "Buscar" filtra en ambos grupos
- "Especialidad" filtra en ambos grupos
- "Solo activos" filtra en ambos grupos

Si después del filtro un grupo queda vacío, se oculta esa sección o se muestra un mensaje "Sin resultados".

---

## Resultado esperado

- Dos secciones claramente diferenciadas
- Doctor Premier arriba, Webart abajo
- Cada sección muestra su MRR total y cantidad de clientes
- Secciones colapsables para enfocarse en un grupo a la vez
- Mantiene todas las funciones actuales (editar, eliminar, filtrar)

