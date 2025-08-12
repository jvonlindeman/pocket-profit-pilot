-- 1) Columna para cancelar retainers
ALTER TABLE public.retainers
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- 2) Función para manejar canceled_at según cambios en active
CREATE OR REPLACE FUNCTION public.set_retainer_canceled_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- En inserción: si entra inactivo sin canceled_at, sellar ahora
  IF TG_OP = 'INSERT' THEN
    IF NEW.active = FALSE AND NEW.canceled_at IS NULL THEN
      NEW.canceled_at = now();
    END IF;
    RETURN NEW;
  END IF;

  -- En actualización: transiciones de active
  IF (OLD.active = TRUE AND NEW.active = FALSE) THEN
    NEW.canceled_at = COALESCE(NEW.canceled_at, now());
  ELSIF (OLD.active = FALSE AND NEW.active = TRUE) THEN
    NEW.canceled_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Trigger para ejecutar la función anterior en insert/update
DROP TRIGGER IF EXISTS trg_set_retainer_canceled_at ON public.retainers;
CREATE TRIGGER trg_set_retainer_canceled_at
BEFORE INSERT OR UPDATE ON public.retainers
FOR EACH ROW
EXECUTE FUNCTION public.set_retainer_canceled_at();

-- 4) Asegurar trigger para updated_at (la función ya existe)
DROP TRIGGER IF EXISTS trg_update_retainers_updated_at ON public.retainers;
CREATE TRIGGER trg_update_retainers_updated_at
BEFORE UPDATE ON public.retainers
FOR EACH ROW
EXECUTE FUNCTION public.update_retainers_updated_at();

-- 5) Índices para acelerar consultas de churn
CREATE INDEX IF NOT EXISTS idx_retainers_canceled_at ON public.retainers (canceled_at);
CREATE INDEX IF NOT EXISTS idx_retainers_active ON public.retainers (active);
CREATE INDEX IF NOT EXISTS idx_retainers_created_at ON public.retainers (created_at);
