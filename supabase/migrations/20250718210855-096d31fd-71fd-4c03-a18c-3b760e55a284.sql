-- Add business_commission_rate column to monthly_balances table
ALTER TABLE public.monthly_balances 
ADD COLUMN business_commission_rate DECIMAL(5,2) DEFAULT 8.0;