-- Avoid per-row auth.uid() evaluation in Private Library RLS policies.
drop policy if exists "Users can view their own projects" on public.private_projects;
drop policy if exists "Users can create their own projects" on public.private_projects;
drop policy if exists "Users can update their own projects" on public.private_projects;
drop policy if exists "Users can delete their own projects" on public.private_projects;

create policy "Users can view their own projects"
on public.private_projects for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own projects"
on public.private_projects for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own projects"
on public.private_projects for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own projects"
on public.private_projects for delete to authenticated
using ((select auth.uid()) = user_id);
