-- Add new fields to retainers table for Excel parity
ALTER TABLE retainers
  ADD COLUMN uses_stripe boolean NOT NULL DEFAULT false,
  ADD COLUMN articles_per_month integer NOT NULL DEFAULT 0,
  ADD COLUMN has_whatsapp_bot boolean NOT NULL DEFAULT false;