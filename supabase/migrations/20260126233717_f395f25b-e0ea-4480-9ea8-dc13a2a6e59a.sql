-- Permitir INSERT para anon
CREATE POLICY "Anon can insert retainers" 
ON public.retainers 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Permitir UPDATE para anon
CREATE POLICY "Anon can update retainers" 
ON public.retainers 
FOR UPDATE 
TO anon 
USING (true);

-- Permitir DELETE para anon
CREATE POLICY "Anon can delete retainers" 
ON public.retainers 
FOR DELETE 
TO anon 
USING (true);