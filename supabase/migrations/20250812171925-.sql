-- 1) Create retainers table
CREATE TABLE IF NOT EXISTS public.retainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  specialty text,
  net_income numeric NOT NULL DEFAULT 0,
  social_media_cost numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Enable RLS
ALTER TABLE public.retainers ENABLE ROW LEVEL SECURITY;

-- 3) Open policies similar to existing public tables in project (no auth requirement)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retainers' AND policyname = 'Allow public read access to retainers'
  ) THEN
    CREATE POLICY "Allow public read access to retainers"
    ON public.retainers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retainers' AND policyname = 'Allow public insert access to retainers'
  ) THEN
    CREATE POLICY "Allow public insert access to retainers"
    ON public.retainers FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retainers' AND policyname = 'Allow public update access to retainers'
  ) THEN
    CREATE POLICY "Allow public update access to retainers"
    ON public.retainers FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retainers' AND policyname = 'Allow public delete access to retainers'
  ) THEN
    CREATE POLICY "Allow public delete access to retainers"
    ON public.retainers FOR DELETE USING (true);
  END IF;
END $$;

-- 4) Timestamp trigger function (reuse or create if missing)
CREATE OR REPLACE FUNCTION public.update_retainers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5) Attach trigger
DROP TRIGGER IF EXISTS trg_update_retainers_updated_at ON public.retainers;
CREATE TRIGGER trg_update_retainers_updated_at
BEFORE UPDATE ON public.retainers
FOR EACH ROW
EXECUTE FUNCTION public.update_retainers_updated_at();