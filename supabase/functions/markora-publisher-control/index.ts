import { createClient } from "npm:@supabase/supabase-js@2.119.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

class RequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function randomHex(bytes = 12) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function hashCode(value: string) {
  const bytes = new TextEncoder().encode(value.trim().replace(/\s+/g, "").toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

function cleanProject(project: Record<string, unknown>) {
  const copy = { ...project };
  delete copy._gallerySpace;
  delete copy._officialSource;
  delete copy._cloudUpdatedAt;
  delete copy._localOnly;
  copy.id = String(copy.id || "");
  copy.status = "finished";
  return copy;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const secretEnv = Deno.env.get("SUPABASE_SECRET_KEYS");
    const secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || (secretEnv ? JSON.parse(secretEnv).default : undefined);
    const publishableEnv = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
    const publishableKey = publishableEnv ? JSON.parse(publishableEnv).default : Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !secretKey || !publishableKey) throw new Error("Supabase server configuration is incomplete.");

    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!token || token === authorization) return reply({ error: "Sign in is required." }, 401);

    const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return reply({ error: "Your session is invalid or expired. Sign in again." }, 401);
    const user = authData.user;

    const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return reply({ error: "A JSON request body is required." }, 415);
    }
    const maxRequestBytes = 1024 * 1024;
    const declaredLength = Number(req.headers.get("content-length") || 0);
    if (declaredLength > maxRequestBytes) return reply({ error: "Request is too large." }, 413);
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxRequestBytes) {
      return reply({ error: "Request is too large." }, 413);
    }
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawBody || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return reply({ error: "Invalid request body." }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return reply({ error: "Invalid JSON request body." }, 400);
    }
    const action = typeof body.action === "string" ? body.action : "";

    const { data: ownerRow, error: ownerError } = await admin
      .from("markora_owner_registry").select("owner_id").eq("singleton", true).maybeSingle();
    if (ownerError) throw ownerError;
    if (!ownerRow?.owner_id) throw new Error("Markora owner registry is not configured.");
    const isOwner = ownerRow.owner_id === user.id;

    const requireOwner = () => {
      if (!isOwner) throw new RequestError("Only the Markora Super Admin can perform this action.");
    };
    const addAudit = async (actionName: string, subjectUserId: string | null, details: Record<string, unknown> = {}) => {
      const { error } = await admin.from("markora_audit_log").insert({
        actor_user_id: user.id, subject_user_id: subjectUserId, action: actionName, details
      });
      if (error) throw error;
    };
    const normalizedCode = String(body.code || "").trim().replace(/\s+/g, "").toUpperCase();
    const makeCode = () => {
      const raw = randomHex(12);
      return "MKR-" + raw.slice(0, 8) + "-" + raw.slice(8, 16) + "-" + raw.slice(16, 24);
    };
    const findUserByEmail = async (email: string) => {
      const target = email.trim().toLowerCase();
      if (!target || !target.includes("@")) throw new RequestError("Enter a valid recipient email address.");
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
        if (error) throw error;
        const match = data.users.find(item => (item.email || "").toLowerCase() === target);
        if (match) return match;
        if (data.users.length < 500) break;
      }
      throw new RequestError("No Markora account was found with that email. The recipient must create and verify an account first.");
    };

    if (action === "get_status") {
      const { data: contributor } = await admin.from("markora_contributors")
        .select("status, granted_at, revoked_at").eq("user_id", user.id).maybeSingle();
      return reply({
        role: isOwner ? "super_admin" : contributor?.status === "active" ? "semi_publisher" : "user",
        isOwner, contributorStatus: contributor?.status || null
      });
    }

    if (action === "create_invite") {
      requireOwner();
      const code = makeCode();
      const codeHash = await hashCode(code);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await admin.from("markora_invites").insert({
        code_hash: codeHash, created_by: user.id, expires_at: expiresAt
      });
      if (error) throw error;
      await addAudit("contributor_invite_created", null, { expires_at: expiresAt });
      return reply({ code, expiresAt });
    }

    if (action === "redeem_invite") {
      if (!normalizedCode) throw new RequestError("Enter your invitation code.");
      const { data, error } = await admin.rpc("markora_redeem_invite", {
        p_code_hash: await hashCode(normalizedCode), p_user_id: user.id
      });
      if (error) throw error;
      return reply({ ok: true, role: data?.role || "semi_publisher" });
    }

    if (action === "list_contributors") {
      requireOwner();
      const { data: contributors, error } = await admin.from("markora_contributors")
        .select("user_id,status,granted_at,revoked_at").order("granted_at", { ascending: false });
      if (error) throw error;
      const users = new Map<string, { email: string | null }>();
      for (let page = 1; page <= 20; page++) {
        const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 500 });
        if (listError) throw listError;
        data.users.forEach(item => users.set(item.id, { email: item.email || null }));
        if (data.users.length < 500) break;
      }
      return reply({ contributors: (contributors || []).map(item => ({
        ...item, email: users.get(item.user_id)?.email || "Account unavailable"
      })) });
    }

    if (action === "revoke_contributor") {
      requireOwner();
      const targetId = String(body.userId || "");
      if (!targetId || targetId === user.id) throw new RequestError("The owner account cannot be revoked.");
      const { data: target, error: targetError } = await admin.from("markora_contributors")
        .select("user_id,status").eq("user_id", targetId).maybeSingle();
      if (targetError) throw targetError;
      if (!target || target.status !== "active") throw new RequestError("This account is not an active Semi-Publisher.");
      const { error } = await admin.from("markora_contributors")
        .update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("user_id", targetId);
      if (error) throw error;
      const { data: targetAuth, error: getAuthError } = await admin.auth.admin.getUserById(targetId);
      if (getAuthError) throw getAuthError;
      const metadata = { ...(targetAuth.user.app_metadata || {}) };
      delete metadata.role;
      const { error: metadataError } = await admin.auth.admin.updateUserById(targetId, { app_metadata: metadata });
      if (metadataError) throw metadataError;
      await addAudit("contributor_revoked", targetId);
      return reply({ ok: true });
    }

    if (action === "submit_project") {
      const { data: contributor, error: contributorError } = await admin.from("markora_contributors")
        .select("status").eq("user_id", user.id).maybeSingle();
      if (contributorError) throw contributorError;
      if (isOwner || contributor?.status !== "active") throw new RequestError("An active Semi-Publisher account is required to submit icons.");
      if (!body.project || typeof body.project !== "object" || Array.isArray(body.project)) throw new RequestError("Select a valid finished icon.");
      const incomingProject = body.project as Record<string, unknown>;
      const serializedProject = JSON.stringify(incomingProject);
      if (new TextEncoder().encode(serializedProject).byteLength > 512 * 1024) {
        return reply({ error: "This icon project is too large to submit (512 KB maximum)." }, 413);
      }
      if (typeof incomingProject.id !== "string" || incomingProject.id.length < 1 || incomingProject.id.length > 160) {
        throw new RequestError("The icon project has an invalid identifier.");
      }
      if (typeof incomingProject.name === "string" && incomingProject.name.length > 160) {
        throw new RequestError("The icon name is too long.");
      }
      if (incomingProject.status !== "finished") throw new RequestError("Only finished Private icons can be submitted.");
      const project = cleanProject(incomingProject);
      // Enforce per-account limits atomically in Postgres to prevent concurrent bypasses.
      const { data: submissionResult, error: submissionError } = await admin.rpc("markora_submit_project", {
        p_user_id: user.id,
        p_project_id: project.id,
        p_project_data: project
      });
      if (submissionError) throw submissionError;
      if (!submissionResult?.ok) {
        return reply(
          { error: submissionResult?.error || "Submission limit reached. Try again later." },
          Number(submissionResult?.status) === 429 ? 429 : 400
        );
      }
      const data = submissionResult.submission;
      await addAudit("icon_submitted_for_review", user.id, { submission_id: data.id, project_id: project.id });
      return reply({ submission: data });
    }

    if (action === "list_my_submissions") {
      const { data, error } = await admin.from("publisher_submissions")
        .select("id,project_id,project_data,status,review_note,created_at,reviewed_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return reply({ submissions: (data || []).map(item => ({
        id: item.id, projectId: item.project_id, name: item.project_data?.name || item.project_id,
        status: item.status, note: item.review_note, createdAt: item.created_at, reviewedAt: item.reviewed_at
      })) });
    }

    if (action === "list_pending_submissions") {
      requireOwner();
      const { data, error } = await admin.from("publisher_submissions")
        .select("id,user_id,project_id,project_data,created_at").eq("status", "pending")
        .order("created_at", { ascending: true }).limit(100);
      if (error) throw error;
      const ids = [...new Set((data || []).map(item => item.user_id))];
      const emails = new Map<string, string>();
      for (let page = 1; page <= 20; page++) {
        const { data: users, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 500 });
        if (listError) throw listError;
        users.users.filter(item => ids.includes(item.id)).forEach(item => emails.set(item.id, item.email || ""));
        if (users.users.length < 500 || emails.size === ids.length) break;
      }
      return reply({ submissions: (data || []).map(item => ({
        id: item.id, userId: item.user_id, email: emails.get(item.user_id) || "Contributor",
        projectId: item.project_id, name: item.project_data?.name || item.project_id, createdAt: item.created_at
      })) });
    }

    if (action === "review_submission") {
      requireOwner();
      const decision = String(body.decision || "");
      if (!["approved", "rejected"].includes(decision)) throw new RequestError("Choose approve or reject.");
      const { data, error } = await admin.rpc("markora_review_submission", {
        p_submission_id: String(body.submissionId || ""), p_reviewer_id: user.id,
        p_decision: decision, p_note: String(body.note || "").slice(0, 500)
      });
      if (error) throw error;
      return reply({ result: data });
    }

    if (action === "create_transfer") {
      requireOwner();
      const lastSignIn = Date.parse(user.last_sign_in_at || "");
      if (!Number.isFinite(lastSignIn) || Date.now() - lastSignIn > 5 * 60 * 1000) {
        throw new RequestError("Re-enter your account password before authorizing an ownership transfer.");
      }
      const recipient = await findUserByEmail(String(body.email || ""));
      if (recipient.id === user.id) throw new RequestError("You are already the Super Admin.");
      const code = makeCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error } = await admin.from("markora_owner_transfers").insert({
        code_hash: await hashCode(code), from_owner_id: user.id, to_user_id: recipient.id,
        recipient_email: recipient.email || String(body.email).trim(), expires_at: expiresAt
      });
      if (error) throw error;
      await addAudit("super_admin_transfer_initiated", recipient.id, { expires_at: expiresAt });
      return reply({ code, recipientEmail: recipient.email, expiresAt });
    }

    if (action === "accept_transfer") {
      if (!normalizedCode) throw new RequestError("Enter the ownership transfer code.");
      const { data, error } = await admin.rpc("markora_complete_owner_transfer", {
        p_code_hash: await hashCode(normalizedCode), p_new_owner_id: user.id
      });
      if (error) throw error;
      return reply({ ok: true, transfer: data });
    }

    if (action === "cancel_transfer") {
      requireOwner();
      const { data, error } = await admin.from("markora_owner_transfers")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("from_owner_id", user.id).is("accepted_at", null).is("cancelled_at", null)
        .select("code_hash");
      if (error) throw error;
      await addAudit("super_admin_transfer_cancelled", null, { cancelled_count: data?.length || 0 });
      return reply({ ok: true, cancelled: data?.length || 0 });
    }

    if (action === "list_audit") {
      requireOwner();
      const requestedLimit = Number(body.limit);
      const requestedOffset = Number(body.offset);
      const pageSize = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, Math.floor(requestedLimit))) : 50;
      const offset = Number.isFinite(requestedOffset) ? Math.max(0, Math.floor(requestedOffset)) : 0;
      const { data, error, count } = await admin.from("markora_audit_log")
        .select("id,actor_user_id,subject_user_id,action,details,created_at", { count: "exact" })
        .order("created_at", { ascending: false }).order("id", { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      const events = data || [];
      const total = count || 0;
      return reply({ events, total, offset, hasMore: offset + events.length < total });
    }

    return reply({ error: "Unknown Markora action." }, 400);
  } catch (error) {
    console.error("Markora publisher control error:", error);
    if (error instanceof RequestError) {
      return reply({ error: error.message }, error.status);
    }
    return reply({ error: "The request could not be completed. Please try again." }, 500);
  }
});