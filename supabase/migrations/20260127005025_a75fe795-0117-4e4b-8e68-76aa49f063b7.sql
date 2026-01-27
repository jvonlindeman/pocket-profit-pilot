-- Agregar columna is_legacy para distinguir clientes importados de nuevos
ALTER TABLE public.retainers 
ADD COLUMN is_legacy boolean NOT NULL DEFAULT false;

-- Marcar todos los clientes existentes como legacy (fueron importados)
UPDATE public.retainers SET is_legacy = true;