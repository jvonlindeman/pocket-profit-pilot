

# Plan: Remover Página /zoho-callback

## Resumen

Se eliminará únicamente la página de callback OAuth de Zoho que ya no se utiliza. La integración de Zoho Books seguirá funcionando normalmente, solo se remueve el flujo OAuth automático.

---

## Archivos a Eliminar

| Archivo | Descripción |
|---------|-------------|
| `src/pages/ZohoCallback.tsx` | Página de callback para OAuth de Zoho |

---

## Archivos a Modificar

### 1. `src/App.tsx`
**Cambios**:
- Remover import de `ZohoCallback`
- Eliminar la ruta `/zoho-callback`

---

## Resumen de Cambios

| Tipo | Cantidad |
|------|----------|
| Archivos a eliminar | 1 |
| Archivos a modificar | 1 |

---

## Orden de Implementación

1. **Modificar `App.tsx`** - Remover import y ruta del callback
2. **Eliminar `src/pages/ZohoCallback.tsx`** - Página completa

---

## Sección Técnica

### Impacto

- La integración de Zoho seguirá funcionando mediante la configuración manual en `ZohoConfig.tsx`
- El componente `ZohoConfig` tiene lógica para manejar tokens de URL pero seguirá funcionando sin el callback
- Las edge functions `zoho-tokens`, `zoho-config`, y `zoho-transactions` permanecen intactas
- Los servicios y hooks de Zoho continúan funcionando normalmente

### Código a Modificar en App.tsx

```text
Antes:
import ZohoCallback from "./pages/ZohoCallback";
...
<Route path="/zoho-callback" element={<ZohoCallback />} />

Después:
(líneas eliminadas)
```

