
-- First create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on the extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Now try to move the vector extension to the extensions schema
-- We need to do this carefully to preserve existing data
ALTER EXTENSION vector SET SCHEMA extensions;
