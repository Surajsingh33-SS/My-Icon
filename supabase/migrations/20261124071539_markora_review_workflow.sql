drop policy if exists "Service role manages Markora owner registry" on public.markora_owner_registry;
create policy "Service role manages Markora owner registry"
  on public.markora_owner_registry for all to service_role using (true) with check (true);
drop policy if exists "Service role manages Markora contributors" on public.markora_contributors;
create policy "Service role manages Markora contributors"
  on public.markora_contributors for all to service_role using (true) with check (true);
drop policy if exists "Service role manages Markora invites" on public.markora_invites;
create policy "Service role manages Markora invites"
  on public.markora_invites for all to service_role using (true) with check (true);
drop policy if exists "Service role manages Markora transfers" on public.markora_owner_transfers;
create policy "Service role manages Markora transfers"
  on public.markora_owner_transfers for all to service_role using (true) with check (true);
drop policy if exists "Service role manages Markora audit log" on public.markora_audit_log;
create policy "Service role manages Markora audit log"
  on public.markora_audit_log for all to service_role using (true) with check (true);
drop policy if exists "Service role manages publisher submissions" on public.publisher_submissions;
create policy "Service role manages publisher submissions"
  on public.publisher_submissions for all to service_role using (true) with check (true);

create or replace function public.markora_review_submission(
  p_submission_id uuid, p_reviewer_id uuid, p_decision text, p_note text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare owner_id uuid; submission_row public.publisher_submissions%rowtype;
begin
  select r.owner_id into owner_id from public.markora_owner_registry r
  where r.singleton = true for update;
  if owner_id is null or owner_id <> p_reviewer_id then
    raise exception 'Only the current Markora owner can review submissions.';
  end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid review decision.'; end if;
  select * into submission_row from public.publisher_submissions
  where id = p_submission_id and status = 'pending' for update;
  if not found then raise exception 'This submission is no longer pending.'; end if;
  if p_decision = 'approved' then
    if coalesce(submission_row.project_data ->> 'id','') <> submission_row.project_id then
      raise exception 'Submission project ID does not match its project data.';
    end if;
    if exists (select 1 from public.official_projects where project_id = submission_row.project_id) then
      raise exception 'An Official icon already uses this ID. It was not overwritten.';
    end if;
    insert into public.official_projects(project_id, project_data, published_at)
    values (submission_row.project_id, submission_row.project_data || jsonb_build_object('status','finished'), now());
  end if;
  update public.publisher_submissions
  set status = p_decision, review_note = nullif(trim(coalesce(p_note,'')),''),
      reviewed_at = now(), reviewed_by = p_reviewer_id
  where id = p_submission_id;
  insert into public.markora_audit_log(actor_user_id, subject_user_id, action, details)
  values (p_reviewer_id, submission_row.user_id, 'submission_' || p_decision,
    jsonb_build_object('submission_id', p_submission_id, 'project_id', submission_row.project_id));
  return jsonb_build_object('ok', true, 'status', p_decision, 'project_id', submission_row.project_id);
end;
$$;
revoke all on function public.markora_review_submission(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.markora_review_submission(uuid, uuid, text, text) to service_role;
