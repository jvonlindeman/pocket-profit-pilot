-- Add expansion_amount column to track upsell increments (analogous to contraction_amount)
ALTER TABLE retainers 
ADD COLUMN expansion_amount numeric DEFAULT 0 NOT NULL;

-- Comment explaining the field
COMMENT ON COLUMN retainers.expansion_amount IS 'Accumulated expansion MRR from upsell increases. Updated when upsell_income increases.';