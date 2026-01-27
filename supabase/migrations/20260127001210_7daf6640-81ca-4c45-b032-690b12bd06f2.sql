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