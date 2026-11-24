
CREATE INDEX IF NOT EXISTS markora_audit_log_actor_user_id_idx ON public.markora_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS markora_audit_log_subject_user_id_idx ON public.markora_audit_log(subject_user_id);
CREATE INDEX IF NOT EXISTS markora_contributors_granted_by_idx ON public.markora_contributors(granted_by);
CREATE INDEX IF NOT EXISTS markora_invites_created_by_idx ON public.markora_invites(created_by);
CREATE INDEX IF NOT EXISTS markora_invites_redeemed_by_idx ON public.markora_invites(redeemed_by);
CREATE INDEX IF NOT EXISTS markora_owner_registry_owner_id_idx ON public.markora_owner_registry(owner_id);
CREATE INDEX IF NOT EXISTS markora_owner_transfers_from_owner_id_idx ON public.markora_owner_transfers(from_owner_id);
CREATE INDEX IF NOT EXISTS markora_owner_transfers_to_user_id_idx ON public.markora_owner_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS publisher_submissions_reviewed_by_idx ON public.publisher_submissions(reviewed_by);

DROP POLICY IF EXISTS "Contributors can view their own submissions" ON public.publisher_submissions;
DROP POLICY IF EXISTS "Owner can view all submissions" ON public.publisher_submissions;
CREATE POLICY "Contributors or owner can view submissions"
ON public.publisher_submissions
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT private.is_markora_owner())
);
