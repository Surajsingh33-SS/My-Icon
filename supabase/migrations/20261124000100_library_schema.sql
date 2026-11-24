-- Icon Maker Pro: shared Official Library + account-owned Private Library.
-- Apply this migration in Supabase SQL Editor as the postgres project owner.
-- Existing private_projects rows and local browser backups are not modified.

begin;

-- Shared Official Library. Everyone can read; browser clients cannot write.
create table if not exists public.official_projects (
    project_id text primary key,
    project_data jsonb not null
        check (jsonb_typeof(project_data) = 'object'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    published_at timestamptz not null default now()
);

alter table public.official_projects enable row level security;

drop policy if exists "Official projects are readable by everyone"
    on public.official_projects;

create policy "Official projects are readable by everyone"
on public.official_projects
for select
to anon, authenticated
using (true);

-- Explicitly prevent browser roles from changing the shared Official Library.
revoke insert, update, delete, truncate, references, trigger
on public.official_projects from anon, authenticated;
grant select on public.official_projects to anon, authenticated;

-- Reassert the account boundary on the already-created private table.
alter table public.private_projects enable row level security;

revoke all on public.private_projects from anon, public;
grant select, insert, update, delete
on public.private_projects to authenticated;

-- Keep updated_at accurate when a private project is changed.
create or replace function public.set_private_project_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_private_project_updated_at
on public.private_projects;

create trigger set_private_project_updated_at
before update on public.private_projects
for each row
execute function public.set_private_project_updated_at();

commit;
