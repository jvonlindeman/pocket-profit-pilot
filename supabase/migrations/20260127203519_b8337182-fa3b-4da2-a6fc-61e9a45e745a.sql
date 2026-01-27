-- Add upsell tracking columns to retainers
ALTER TABLE retainers
ADD COLUMN base_income numeric NOT NULL DEFAULT 0,
ADD COLUMN upsell_income numeric NOT NULL DEFAULT 0;

-- Migrate existing data: current net_income becomes base_income
UPDATE retainers SET base_income = net_income WHERE base_income = 0;