create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.markora_owner_registry (
  singleton boolean primary key default true check (singleton = true),
  owner_id uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);
alter table public.markora_owner_registry enable row level security;
revoke all on public.markora_owner_registry from public, anon, authenticated;

create table if not exists public.markora_contributors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz
);
alter table public.markora_contributors enable row level security;
revoke all on public.markora_contributors from public, anon, authenticated;

create table if not exists public.markora_invites (
  code_hash text primary key,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz
);
alter table public.markora_invites enable row level security;
revoke all on public.markora_invites from public, anon, authenticated;

create table if not exists public.markora_owner_transfers (
  code_hash text primary key,
  from_owner_id uuid not null references auth.users(id) on delete restrict,
  to_user_id uuid not null references auth.users(id) on delete restrict,
  recipient_email text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  cancelled_at timestamptz
);
alter table public.markora_owner_transfers enable row level security;
revoke all on public.markora_owner_transfers from public, anon, authenticated;

create table if not exists public.markora_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  subject_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.markora_audit_log enable row level security;
revoke all on public.markora_audit_log from public, anon, authenticated;

create table if not exists public.publisher_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  project_data jsonb not null check (jsonb_typeof(project_data) = 'object'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists publisher_submissions_status_created_idx
  on public.publisher_submissions(status, created_at desc);
create index if not exists publisher_submissions_user_created_idx
  on public.publisher_submissions(user_id, created_at desc);
alter table public.publisher_submissions enable row level security;
revoke all on public.publisher_submissions from public, anon;
grant select, insert on public.publisher_submissions to authenticated;

create or replace function private.is_markora_owner()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.markora_owner_registry r
    where r.singleton = true and r.owner_id = (select auth.uid()));
$$;

create or replace function private.is_active_markora_contributor()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.markora_contributors c
    where c.user_id = (select auth.uid()) and c.status = 'active');
$$;

revoke all on function private.is_markora_owner() from public, anon;
revoke all on function private.is_active_markora_contributor() from public, anon;
grant execute on function private.is_markora_owner() to authenticated;
grant execute on function private.is_active_markora_contributor() to authenticated;

drop policy if exists "Contributors can submit their own projects" on public.publisher_submissions;
drop policy if exists "Contributors can view their own submissions" on public.publisher_submissions;
drop policy if exists "Owner can view all submissions" on public.publisher_submissions;
create policy "Contributors can submit their own projects"
  on public.publisher_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending'
    and private.is_active_markora_contributor());
create policy "Contributors can view their own submissions"
  on public.publisher_submissions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Owner can view all submissions"
  on public.publisher_submissions for select to authenticated
  using (private.is_markora_owner());

drop policy if exists "Trusted publishers can publish official projects" on public.official_projects;
drop policy if exists "Trusted publishers can update official projects" on public.official_projects;
drop policy if exists "Trusted publishers can delete official projects" on public.official_projects;
drop policy if exists "Only Markora owner can publish official projects" on public.official_projects;
drop policy if exists "Only Markora owner can update official projects" on public.official_projects;
drop policy if exists "Only Markora owner can delete official projects" on public.official_projects;
create policy "Only Markora owner can publish official projects"
  on public.official_projects for insert to authenticated with check (private.is_markora_owner());
create policy "Only Markora owner can update official projects"
  on public.official_projects for update to authenticated
  using (private.is_markora_owner()) with check (private.is_markora_owner());
create policy "Only Markora owner can delete official projects"
  on public.official_projects for delete to authenticated using (private.is_markora_owner());

do $$
declare publisher_count integer; publisher_id uuid;
begin
  select count(*), min(id::text)::uuid into publisher_count, publisher_id
  from auth.users where raw_app_meta_data ->> 'role' = 'official_publisher';
  if publisher_count = 1 then
    insert into public.markora_owner_registry(singleton, owner_id)
    values (true, publisher_id) on conflict (singleton) do nothing;
  elsif publisher_count = 0 then
    if not exists (select 1 from public.markora_owner_registry where singleton = true) then
      raise exception 'No existing Official Publisher account found; owner bootstrap requires a verified account.';
    end if;
  else
    raise exception 'Multiple Official Publisher accounts found; resolve ownership before migration.';
  end if;
  update auth.users u
  set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role','super_admin')
  where u.id = (select owner_id from public.markora_owner_registry where singleton = true);
end;
$$;

create or replace function public.markora_redeem_invite(p_code_hash text, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare invite_row public.markora_invites%rowtype;
begin
  select * into invite_row from public.markora_invites
  where code_hash = p_code_hash and redeemed_at is null and revoked_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Invitation code is invalid, expired, or already used.'; end if;
  if exists (select 1 from public.markora_owner_registry where owner_id = p_user_id) then
    raise exception 'The owner account cannot redeem a contributor invitation.';
  end if;
  insert into public.markora_contributors(user_id, status, granted_by, granted_at, revoked_at)
  values (p_user_id, 'active', invite_row.created_by, now(), null)
  on conflict (user_id) do update
    set status = 'active', granted_by = excluded.granted_by, granted_at = now(), revoked_at = null;
  update public.markora_invites set redeemed_by = p_user_id, redeemed_at = now()
  where code_hash = p_code_hash;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role','semi_publisher') where id = p_user_id;
  insert into public.markora_audit_log(actor_user_id, subject_user_id, action)
  values (invite_row.created_by, p_user_id, 'contributor_invite_redeemed');
  return jsonb_build_object('ok', true, 'role', 'semi_publisher');
end;
$$;
revoke all on function public.markora_redeem_invite(text, uuid) from public, anon, authenticated;
grant execute on function public.markora_redeem_invite(text, uuid) to service_role;

create or replace function public.markora_complete_owner_transfer(p_code_hash text, p_new_owner_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare current_owner uuid; transfer_row public.markora_owner_transfers%rowtype;
begin
  select owner_id into current_owner from public.markora_owner_registry
  where singleton = true for update;
  select * into transfer_row from public.markora_owner_transfers
  where code_hash = p_code_hash and to_user_id = p_new_owner_id
    and accepted_at is null and cancelled_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Transfer code is invalid, expired, cancelled, or not intended for this account.'; end if;
  if transfer_row.from_owner_id <> current_owner then
    raise exception 'The original owner has changed; this transfer is no longer valid.';
  end if;
  update public.markora_owner_registry set owner_id = p_new_owner_id, updated_at = now()
  where singleton = true;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
  where id = current_owner;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role','super_admin') where id = p_new_owner_id;
  update public.markora_owner_transfers set accepted_at = now() where code_hash = p_code_hash;
  insert into public.markora_audit_log(actor_user_id, subject_user_id, action, details)
  values (current_owner, p_new_owner_id, 'super_admin_transferred',
    jsonb_build_object('recipient_email', transfer_row.recipient_email));
  return jsonb_build_object('ok', true, 'previous_owner_id', current_owner, 'new_owner_id', p_new_owner_id);
end;
$$;
revoke all on function public.markora_complete_owner_transfer(text, uuid) from public, anon, authenticated;
grant execute on function public.markora_complete_owner_transfer(text, uuid) to service_role;
