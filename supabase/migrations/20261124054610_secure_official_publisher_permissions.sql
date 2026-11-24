-- Allow only explicitly designated publisher accounts to publish to the shared Official Library.
-- The authorization claim must live in app_metadata, which users cannot edit themselves.
begin;

grant insert, update on public.official_projects to authenticated;

drop policy if exists "Trusted publishers can publish official projects"
on public.official_projects;
create policy "Trusted publishers can publish official projects"
on public.official_projects
for insert
to authenticated
with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'official_publisher'
);

drop policy if exists "Trusted publishers can update official projects"
on public.official_projects;
create policy "Trusted publishers can update official projects"
on public.official_projects
for update
to authenticated
using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'official_publisher'
)
with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'official_publisher'
);

-- Deliberately do not grant DELETE or TRUNCATE to browser roles.
commit;