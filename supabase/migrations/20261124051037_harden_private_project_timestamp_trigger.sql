-- Keep trigger function resolution independent of caller-controlled search_path.
create or replace function public.set_private_project_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
