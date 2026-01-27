-- Add paused_at column to retainers table
ALTER TABLE retainers 
ADD COLUMN paused_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN retainers.paused_at IS 'Fecha en que el cliente entró en pausa. NULL = no está pausado.';