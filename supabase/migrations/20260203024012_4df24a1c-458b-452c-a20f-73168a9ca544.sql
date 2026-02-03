-- Add contraction_amount column to track fee reductions
ALTER TABLE retainers 
ADD COLUMN contraction_amount numeric DEFAULT 0 NOT NULL;

COMMENT ON COLUMN retainers.contraction_amount IS 
  'Monto acumulado de reducciones de tarifa (Contraction MRR)';