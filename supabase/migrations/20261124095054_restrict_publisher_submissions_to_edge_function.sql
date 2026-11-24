
REVOKE REFERENCES, TRIGGER ON TABLE public.private_projects FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLE public.publisher_submissions FROM authenticated;
DROP POLICY IF EXISTS "Contributors can submit their own projects" ON public.publisher_submissions;
