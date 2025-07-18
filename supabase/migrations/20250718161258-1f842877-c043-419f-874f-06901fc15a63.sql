
-- Create table to store user selections for receivables
CREATE TABLE public.receivables_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  selection_type TEXT NOT NULL, -- 'zoho_invoices', 'stripe_pending_invoices', 'stripe_upcoming_payments', 'stripe_pending_activations'
  item_id TEXT NOT NULL, -- External ID of the invoice/subscription
  selected BOOLEAN NOT NULL DEFAULT true,
  amount NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receivables_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for receivables selections
CREATE POLICY "Users can view their own receivables selections" 
  ON public.receivables_selections 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receivables selections" 
  ON public.receivables_selections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receivables selections" 
  ON public.receivables_selections 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receivables selections" 
  ON public.receivables_selections 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_receivables_selections_unique 
ON public.receivables_selections (user_id, selection_type, item_id);

-- Create trigger for updated_at
CREATE TRIGGER update_receivables_selections_timestamp
  BEFORE UPDATE ON public.receivables_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
