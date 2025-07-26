-- Add stripe_savings_percentage column to monthly_balances table
ALTER TABLE public.monthly_balances 
ADD COLUMN stripe_savings_percentage numeric DEFAULT 0;