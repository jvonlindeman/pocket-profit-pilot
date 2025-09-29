-- Create monthly_savings table
CREATE TABLE public.monthly_savings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  deposit_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on month_year for faster lookups
CREATE INDEX idx_monthly_savings_month_year ON public.monthly_savings(month_year);

-- Enable Row Level Security
ALTER TABLE public.monthly_savings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view monthly_savings" 
ON public.monthly_savings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert monthly_savings" 
ON public.monthly_savings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update monthly_savings" 
ON public.monthly_savings 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete monthly_savings" 
ON public.monthly_savings 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_monthly_savings_updated_at
BEFORE UPDATE ON public.monthly_savings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();