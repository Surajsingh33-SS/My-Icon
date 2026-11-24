grant all on table public.markora_owner_registry to service_role;
grant all on table public.markora_contributors to service_role;
grant all on table public.markora_invites to service_role;
grant all on table public.markora_owner_transfers to service_role;
grant all on table public.markora_audit_log to service_role;
grant all on table public.publisher_submissions to service_role;
grant usage, select on sequence public.markora_audit_log_id_seq to service_role;
