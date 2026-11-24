create policy "Trusted publishers can delete official projects"
on public.official_projects
for delete
to authenticated
using (
  coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'official_publisher'
);