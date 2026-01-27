-- Agregar columna n8n_id para sincronización con n8n
ALTER TABLE retainers 
ADD COLUMN n8n_id text DEFAULT NULL;

-- Crear índice único que permite múltiples NULLs
CREATE UNIQUE INDEX idx_retainers_n8n_id 
ON retainers (n8n_id) 
WHERE n8n_id IS NOT NULL;

-- Documentar la columna
COMMENT ON COLUMN retainers.n8n_id IS 'ID unico del cliente en n8n para sincronizacion de sentimiento y estado';