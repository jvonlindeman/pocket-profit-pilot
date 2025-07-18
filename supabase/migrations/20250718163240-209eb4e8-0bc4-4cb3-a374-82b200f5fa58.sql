
-- Make user_id nullable and update RLS policies for public access
ALTER TABLE public.receivables_selections 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies that require authentication
DROP POLICY IF EXISTS "Users can view their own receivables selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Users can create their own receivables selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Users can update their own receivables selections" ON public.receivables_selections;
DROP POLICY IF EXISTS "Users can delete their own receivables selections" ON public.receivables_selections;

-- Create new public access policies
CREATE POLICY "Allow public read access to receivables selections" 
  ON public.receivables_selections 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to receivables selections" 
  ON public.receivables_selections 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access to receivables selections" 
  ON public.receivables_selections 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete access to receivables selections" 
  ON public.receivables_selections 
  FOR DELETE 
  USING (true);

-- Update unique constraint to not require user_id
DROP INDEX IF EXISTS idx_receivables_selections_unique;
CREATE UNIQUE INDEX idx_receivables_selections_unique_no_user 
ON public.receivables_selections (selection_type, item_id);
