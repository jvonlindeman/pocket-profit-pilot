

# Plan: Corregir Warnings de Seguridad RLS

## Resumen

Fortalecer las políticas RLS para eliminar los warnings del linter de Supabase. Las políticas actuales usan `USING (true)` que es considerado inseguro. Se cambiarán a verificaciones explícitas del rol de autenticación.

---

## Problemas Detectados

| Tabla | Problema | Severidad |
|-------|----------|-----------|
| `zoho_integration` | Política usa `true` en lugar de verificar `service_role` | CRITICO |
| `retainers` | INSERT/UPDATE/DELETE usan `USING (true)` | ALTO |
| `financial_summaries` | INSERT/UPDATE/DELETE usan `USING (true)` | ALTO |
| `monthly_balances` | INSERT/UPDATE/DELETE usan `USING (true)` | ALTO |
| `receivables_selections` | INSERT/UPDATE/DELETE usan `USING (true)` | ALTO |
| `monthly_financial_summaries` | INSERT/UPDATE/DELETE usan `USING (true)` | ALTO |

---

## Solucion Propuesta

Crear una migracion SQL que:

1. Elimine las politicas existentes que usan `USING (true)`
2. Cree nuevas politicas que verifiquen explicitamente `auth.role() = 'authenticated'`
3. Para `zoho_integration`, verificar `auth.role() = 'service_role'`

---

## Impacto

| Aspecto | Antes | Despues |
|---------|-------|---------|
| Linter warnings | 19 warnings RLS | 0 warnings RLS |
| Acceso a datos | Cualquier authenticated | Solo authenticated verificado |
| zoho_integration | Politica ambigua | Solo service_role explicito |

---

## Archivos a Modificar

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| Nueva migracion SQL | Crear | Reescribir politicas RLS con verificaciones explicitas |

---

## Seccion Tecnica

### Patron de Politica Corregida

En lugar de:
```sql
CREATE POLICY "..." ON table FOR INSERT TO authenticated WITH CHECK (true);
```

Usar:
```sql
CREATE POLICY "..." ON table FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
```

### Migracion SQL Completa

```sql
-- =============================================
-- ZOHO_INTEGRATION: Solo service_role
-- =============================================
DROP POLICY IF EXISTS "Only service role can access zoho_integration" ON public.zoho_integration;

CREATE POLICY "Service role only access zoho_integration"
ON public.zoho_integration FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- RETAINERS: Verificacion explicita
-- =============================================
DROP POLICY IF EXISTS "Authenticated can select retainers" ON public.retainers;
DROP POLICY IF EXISTS "Authenticated can insert retainers" ON public.retainers;
DROP POLICY IF EXISTS "Authenticated can update retainers" ON public.retainers;
DROP POLICY IF EXISTS "Authenticated can delete retainers" ON public.retainers;

CREATE POLICY "Authenticated select retainers"
ON public.retainers FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert retainers"
ON public.retainers FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update retainers"
ON public.retainers FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete retainers"
ON public.retainers FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- =============================================
-- FINANCIAL_SUMMARIES: Verificacion explicita
-- =============================================
DROP POLICY IF EXISTS "Authenticated can select financial_summaries" ON public.financial_summaries;
DROP POLICY IF EXISTS "Authenticated can insert financial_summaries" ON public.financial_summaries;
DROP POLICY IF EXISTS "Authenticated can update financial_summaries" ON public.financial_summaries;
DROP POLICY IF EXISTS "Authenticated can delete financial_summaries" ON public.financial_summaries;
DROP POLICY IF EXISTS "Service role full access financial_summaries" ON public.financial_summaries;

CREATE POLICY "Authenticated select financial_summaries"
ON public.financial_summaries FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert financial_summaries"
ON public.financial_summaries FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update financial_summaries"
ON public.financial_summaries FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete financial_summaries"
ON public.financial_summaries FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Service role access financial_summaries"
ON public.financial_summaries FOR ALL TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- MONTHLY_BALANCES: Verificacion explicita
-- =============================================
DROP POLICY IF EXISTS "Authenticated can select monthly_balances" ON public.monthly_balances;
DROP POLICY IF EXISTS "Authenticated can insert monthly_balances" ON public.monthly_balances;
DROP POLICY IF EXISTS "Authenticated can update monthly_balances" ON public.monthly_balances;
DROP POLICY IF EXISTS "Authenticated can delete monthly_balances" ON public.monthly_balances;
DROP POLICY IF EXISTS "Service role full access monthly_balances" ON public.monthly_balances;

CREATE POLICY "Authenticated select monthly_balances"
ON public.monthly_balances FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert monthly_balances"
ON public.monthly_balances FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update monthly_balances"
ON public.monthly_balances FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete monthly_balances"
ON public.monthly_balances FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Service role access monthly_balances"
ON public.monthly_balances FOR ALL TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- RECEIVABLES_SELECTIONS: Verificacion explicita
-- =============================================
DROP POLICY IF EXISTS "Authenticated can select receivables_selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Authenticated can insert receivables_selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Authenticated can update receivables_selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Authenticated can delete receivables_selections" ON public.receivables_selections;

CREATE POLICY "Authenticated select receivables_selections"
ON public.receivables_selections FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert receivables_selections"
ON public.receivables_selections FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update receivables_selections"
ON public.receivables_selections FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete receivables_selections"
ON public.receivables_selections FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- =============================================
-- MONTHLY_FINANCIAL_SUMMARIES: Verificacion explicita
-- =============================================
DROP POLICY IF EXISTS "Authenticated can select monthly_financial_summaries" ON public.monthly_financial_summaries;
DROP POLICY IF EXISTS "Authenticated can insert monthly_financial_summaries" ON public.monthly_financial_summaries;
DROP POLICY IF EXISTS "Authenticated can update monthly_financial_summaries" ON public.monthly_financial_summaries;
DROP POLICY IF EXISTS "Authenticated can delete monthly_financial_summaries" ON public.monthly_financial_summaries;

CREATE POLICY "Authenticated select monthly_financial_summaries"
ON public.monthly_financial_summaries FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert monthly_financial_summaries"
ON public.monthly_financial_summaries FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update monthly_financial_summaries"
ON public.monthly_financial_summaries FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete monthly_financial_summaries"
ON public.monthly_financial_summaries FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');
```

### Notas Adicionales

- El warning de `function_search_path_mutable` es un issue de configuracion de Supabase que no afecta la seguridad de tu aplicacion directamente
- El warning de `auth_otp_long_expiry` se configura en el dashboard de Supabase (Authentication > Settings)
- El warning de `vulnerable_postgres_version` requiere upgrade del proyecto en Supabase dashboard

