-- Keep publisher policy JWT evaluation cached per statement.
begin;

drop policy if exists "Trusted publishers can publish official projects"
on public.official_projects;
create policy "Trusted publishers can publish official projects"
on public.official_projects
for insert
to authenticated
with check (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'official_publisher'
);

drop policy if exists "Trusted publishers can update official projects"
on public.official_projects;
create policy "Trusted publishers can update official projects"
on public.official_projects
for update
to authenticated
using (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'official_publisher'
)
with check (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'official_publisher'
);

commit;
