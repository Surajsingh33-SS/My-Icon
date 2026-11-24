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
  update public.markora_contributors
  set status = 'revoked', revoked_at = now()
  where user_id in (current_owner, p_new_owner_id) and status = 'active';
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
