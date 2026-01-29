-- Add new columns for enriched client status from n8n
ALTER TABLE retainers 
ADD COLUMN IF NOT EXISTS days_since_contact integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_message_from text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS project_manager text DEFAULT NULL;