-- Add client status columns to retainers table
ALTER TABLE public.retainers 
ADD COLUMN IF NOT EXISTS client_status text NULL,
ADD COLUMN IF NOT EXISTS client_status_date timestamptz NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.retainers.client_status IS 'Client sentiment status from n8n webhook (OK, Agradecido, En seguimiento, etc.)';
COMMENT ON COLUMN public.retainers.client_status_date IS 'Timestamp of the last status update from n8n';