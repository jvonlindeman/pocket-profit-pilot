

# Plan: Corregir Error RLS para Importación de Retainers

## Resumen

El error ocurre porque las políticas RLS actuales solo permiten INSERT/UPDATE/DELETE al rol `authenticated`, pero la aplicación está usando el rol `anon` (no hay login). Se agregarán políticas permisivas para el rol `anon`.

---

## Diagnóstico

| Operación | Rol permitido actual | Estado |
|-----------|---------------------|--------|
| SELECT | `authenticated` + `anon` | ✅ Funciona |
| INSERT | `authenticated` solamente | ❌ Falla |
| UPDATE | `authenticated` solamente | ❌ Falla |
| DELETE | `authenticated` solamente | ❌ Falla |

---

## Solución Propuesta

Crear una migración SQL que agregue políticas para el rol `anon`:

```sql
-- Permitir INSERT para anon
CREATE POLICY "Anon can insert retainers" 
ON public.retainers 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Permitir UPDATE para anon
CREATE POLICY "Anon can update retainers" 
ON public.retainers 
FOR UPDATE 
TO anon 
USING (true);

-- Permitir DELETE para anon
CREATE POLICY "Anon can delete retainers" 
ON public.retainers 
FOR DELETE 
TO anon 
USING (true);
```

---

## Impacto

| Aspecto | Antes | Después |
|---------|-------|---------|
| Lectura | ✅ Funciona | ✅ Funciona |
| Importar CSV | ❌ Error RLS | ✅ Funcionará |
| Crear retainer | ❌ Error RLS | ✅ Funcionará |
| Editar retainer | ❌ Error RLS | ✅ Funcionará |
| Eliminar retainer | ❌ Error RLS | ✅ Funcionará |

---

## Archivos a Modificar

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| Nueva migración SQL | Crear | Agregar políticas RLS para rol anon |

---

## Sección Técnica

### Consideración de Seguridad

Esta solución es apropiada porque:
- El dashboard es para uso personal/interno
- No hay autenticación implementada en la aplicación
- Los datos de retainers no son sensibles (no contienen PII crítica)

Si en el futuro se implementa autenticación, estas políticas pueden restringirse.

### Alternativa (No recomendada para este caso)

Implementar autenticación completa con Supabase Auth. Esto sería excesivo para un dashboard personal pero es la opción correcta si múltiples usuarios accederán al sistema.

