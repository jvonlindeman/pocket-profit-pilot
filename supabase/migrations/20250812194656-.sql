-- Enable public read access for retainers
ALTER TABLE public.retainers ENABLE ROW LEVEL SECURITY;

-- Ensure anon role has SELECT privilege (usually granted by default, but explicit here)
GRANT SELECT ON TABLE public.retainers TO anon;

-- Create/replace policy allowing anon (public) to read retainers
DROP POLICY IF EXISTS "Public can read retainers" ON public.retainers;
CREATE POLICY "Public can read retainers"
ON public.retainers
FOR SELECT
TO anon
USING (true);
