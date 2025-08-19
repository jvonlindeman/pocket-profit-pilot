-- Update RLS policies for receivables_selections to allow anonymous access
-- This fixes the issue where users can't select/deselect receivables items

-- Drop existing policies that require authentication
DROP POLICY IF EXISTS "Users can select their receivables" ON public.receivables_selections;
DROP POLICY IF EXISTS "Users can insert their receivables" ON public.receivables_selections;
DROP POLICY IF EXISTS "Users can update their receivables" ON public.receivables_selections;
DROP POLICY IF EXISTS "Users can delete their receivables" ON public.receivables_selections;

-- Create new policies that allow anonymous access
CREATE POLICY "Anonymous can select receivables_selections"
ON public.receivables_selections
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anonymous can insert receivables_selections"
ON public.receivables_selections
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anonymous can update receivables_selections"
ON public.receivables_selections
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Anonymous can delete receivables_selections"
ON public.receivables_selections
FOR DELETE
TO anon
USING (true);

-- Ensure anon role has necessary privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.receivables_selections TO anon;