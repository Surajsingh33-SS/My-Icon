create or replace function public.markora_submit_project(
  p_user_id uuid, p_project_id text, p_project_data jsonb
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare pending_count integer; daily_count integer; submission_row public.publisher_submissions%rowtype;
begin
  if p_user_id is null or p_project_id is null or length(p_project_id) < 1
     or length(p_project_id) > 160 or jsonb_typeof(p_project_data) <> 'object'
     or p_project_data ->> 'id' <> p_project_id
     or p_project_data ->> 'status' <> 'finished' then
    raise exception 'Invalid finished project submission.';
  end if;
  perform pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  select count(*) into pending_count from public.publisher_submissions
    where user_id = p_user_id and status = 'pending';
  if pending_count >= 10 then
    return jsonb_build_object('ok', false, 'status', 429,
      'error', 'You have reached the limit of 10 pending submissions. Wait for review before submitting more.');
  end if;
  select count(*) into daily_count from public.publisher_submissions
    where user_id = p_user_id and created_at >= now() - interval '24 hours';
  if daily_count >= 20 then
    return jsonb_build_object('ok', false, 'status', 429,
      'error', 'Daily submission limit reached. Try again later.');
  end if;
  insert into public.publisher_submissions(user_id, project_id, project_data)
    values (p_user_id, p_project_id, p_project_data) returning * into submission_row;
  return jsonb_build_object('ok', true, 'submission', jsonb_build_object(
    'id', submission_row.id, 'project_id', submission_row.project_id,
    'status', submission_row.status, 'created_at', submission_row.created_at));
end;
$$;
revoke all on function public.markora_submit_project(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.markora_submit_project(uuid, text, jsonb) to service_role;
