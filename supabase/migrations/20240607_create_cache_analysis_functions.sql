

-- Function to get unique month-years that have transactions
CREATE OR REPLACE FUNCTION public.get_unique_months_with_transactions()
RETURNS TABLE (month_year text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT substring(date::text, 1, 7) as month_year
  FROM cached_transactions
  ORDER BY month_year DESC;
$$;

-- Function to get the min and max date for a given month-year
CREATE OR REPLACE FUNCTION public.get_month_transaction_range(month_year_param text)
RETURNS TABLE (min_date text, max_date text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    MIN(date::text) as min_date,
    MAX(date::text) as max_date
  FROM cached_transactions
  WHERE date::text LIKE (month_year_param || '-%');
$$;

