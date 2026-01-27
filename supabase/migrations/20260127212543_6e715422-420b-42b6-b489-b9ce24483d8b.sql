ALTER TABLE retainers
ADD COLUMN expected_reactivation_date date NULL;

COMMENT ON COLUMN retainers.expected_reactivation_date IS 
  'Fecha esperada de reactivación para clientes pausados';