-- =============================================
-- FASE 1: Limpiar políticas anon inseguras de retainers
-- =============================================
DROP POLICY IF EXISTS "Anon can insert retainers" ON public.retainers;
DROP POLICY IF EXISTS "Anon can update retainers" ON public.retainers;
DROP POLICY IF EXISTS "Anon can delete retainers" ON public.retainers;
DROP POLICY IF EXISTS "Public can read retainers" ON public.retainers;

-- =============================================
-- FASE 2: Proteger zoho_integration (credenciales OAuth)
-- =============================================
ALTER TABLE public.zoho_integration ENABLE ROW LEVEL SECURITY;

-- Revocar acceso público
REVOKE ALL ON public.zoho_integration FROM anon;
REVOKE ALL ON public.zoho_integration FROM authenticated;

-- Solo service_role puede acceder (usado por edge functions)
CREATE POLICY "Only service role can access zoho_integration"
ON public.zoho_integration FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- FASE 3: Actualizar receivables_selections de anon a authenticated
-- =============================================
DROP POLICY IF EXISTS "Anonymous can select receivables_selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Anonymous can insert receivables_selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Anonymous can update receivables_selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Anonymous can delete receivables_selections" ON public.receivables_selections;

-- Crear políticas para authenticated
CREATE POLICY "Authenticated can select receivables_selections"
ON public.receivables_selections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert receivables_selections"
ON public.receivables_selections FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update receivables_selections"
ON public.receivables_selections FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete receivables_selections"
ON public.receivables_selections FOR DELETE
TO authenticated
USING (true);

-- =============================================
-- FASE 4: Actualizar monthly_balances
-- =============================================
DROP POLICY IF EXISTS "Allow service role full access to monthly_balances" ON public.monthly_balances;

CREATE POLICY "Authenticated can select monthly_balances"
ON public.monthly_balances FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert monthly_balances"
ON public.monthly_balances FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update monthly_balances"
ON public.monthly_balances FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete monthly_balances"
ON public.monthly_balances FOR DELETE
TO authenticated
USING (true);

-- Service role también necesita acceso
CREATE POLICY "Service role full access monthly_balances"
ON public.monthly_balances FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- FASE 5: Actualizar financial_summaries
-- =============================================
DROP POLICY IF EXISTS "Allow service role full access to financial_summaries" ON public.financial_summaries;

CREATE POLICY "Authenticated can select financial_summaries"
ON public.financial_summaries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert financial_summaries"
ON public.financial_summaries FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update financial_summaries"
ON public.financial_summaries FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete financial_summaries"
ON public.financial_summaries FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Service role full access financial_summaries"
ON public.financial_summaries FOR ALL
TO service_role
USING (true)
WITH CHECK (true);