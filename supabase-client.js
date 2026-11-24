/* Icon Maker Pro — Supabase Auth + cloud data bridge.
 * Only the publishable browser key is used here. Database authorization is enforced by RLS.
 */
(() => {
    "use strict";
    const SUPABASE_URL = "https://hhqqurqjdwazvgxlwspu.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_S7OUoJ8bYBoaJun9u1vpkA_YmukcrwR";
    const client = window.supabase?.createClient
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        })
        : null;

    let currentSession = null;
    let appHooks = null;
    let initialized = false;
    let authModal = null;

    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    function ensureAuthUI() {
        if (document.getElementById("iconmaker-account-button")) return;
        const logo = document.querySelector(".home-logo");
        if (logo) {
            const button = document.createElement("button");
            button.type = "button";
            button.id = "iconmaker-account-button";
            button.className = "iconmaker-account-button";
            button.innerHTML = '<span class="iconmaker-account-avatar" aria-hidden="true">◎</span><span class="iconmaker-account-label">Sign in</span>';
            button.addEventListener("click", () => openAuthModal());
            logo.insertAdjacentElement("afterend", button);
        }

        const accountButton = document.getElementById("iconmaker-account-button");
        if (accountButton && !document.getElementById("iconmaker-official-migrate-button")) {
            const migrateButton = document.createElement("button");
            migrateButton.type = "button";
            migrateButton.id = "iconmaker-official-migrate-button";
            migrateButton.className = "iconmaker-official-migrate-button";
            migrateButton.hidden = true;
            migrateButton.textContent = "Publish legacy Official icons";
            migrateButton.addEventListener("click", async () => {
                const originalLabel = migrateButton.textContent;
                migrateButton.disabled = true;
                migrateButton.textContent = "Publishing…";
                try {
                    const result = await migrateLegacyOfficialProjects();
                    const projects = await fetchOfficialProjects();
                    appHooks?.onOfficialProjectsChanged?.(projects);
                    appHooks?.onOfficialMigrationComplete?.(result);
                } catch (error) {
                    console.error("Official Library migration failed:", error);
                    appHooks?.onOfficialMigrationComplete?.({ error: error?.message || "Migration failed." });
                } finally {
                    migrateButton.disabled = false;
                    migrateButton.textContent = originalLabel;
                }
            });
            accountButton.insertAdjacentElement("afterend", migrateButton);
        }

        authModal = document.createElement("div");
        authModal.id = "iconmaker-auth-modal";
        authModal.className = "iconmaker-auth-modal";
        authModal.hidden = true;
        authModal.innerHTML = `
            <div class="iconmaker-auth-backdrop" data-auth-close></div>
            <section class="iconmaker-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="iconmaker-auth-title">
                <button class="iconmaker-auth-close" type="button" aria-label="Close" data-auth-close>×</button>
                <aside class="iconmaker-auth-brand-panel" aria-hidden="true">
                    <div class="iconmaker-auth-brand-mark">✳</div>
                    <div class="iconmaker-auth-brand-copy">
                        <span class="iconmaker-auth-brand-kicker">DESIGN YOUR WAY</span>
                        <strong>Every great idea starts with a shape.</strong>
                        <p>Create, organize and sync your icon library from one focused workspace.</p>
                    </div>
                    <div class="iconmaker-auth-brand-meta"><span></span> ICON MAKER PRO <i>VECTOR WORKSPACE</i></div>
                </aside>
                <div class="iconmaker-auth-content">
                    <div class="iconmaker-auth-eyebrow">WELCOME TO ICON MAKER PRO</div>
                    <h2 id="iconmaker-auth-title">Your creative workspace awaits.</h2>
                    <p class="iconmaker-auth-description">Sign in to access your Private Library and keep your projects in sync.</p>
                    <div class="iconmaker-auth-tabs" role="tablist" aria-label="Account access">
                        <button type="button" class="active" role="tab" aria-selected="true" data-auth-mode="signin">Sign in</button>
                        <button type="button" role="tab" aria-selected="false" data-auth-mode="signup">Create account</button>
                    </div>
                    <form id="iconmaker-auth-form">
                        <label for="iconmaker-auth-email">Email address</label>
                        <div class="iconmaker-auth-field"><span aria-hidden="true">✉</span><input id="iconmaker-auth-email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="254"></div>
                        <label for="iconmaker-auth-password">Password</label>
                        <div class="iconmaker-auth-field"><span aria-hidden="true">⌑</span><input id="iconmaker-auth-password" type="password" autocomplete="current-password" placeholder="At least 8 characters" required minlength="8"><button class="iconmaker-auth-password-toggle" type="button" aria-label="Show password" aria-pressed="false">Show</button></div>
                        <p class="iconmaker-auth-error" id="iconmaker-auth-error" role="status" aria-live="polite"></p>
                        <button class="iconmaker-auth-submit" id="iconmaker-auth-submit" type="submit"><span>Sign in</span><b aria-hidden="true">→</b></button>
                    </form>
                    <p class="iconmaker-auth-footnote"><span aria-hidden="true">◈</span> Your Private Library is only visible to you. Official icons stay public and read-only.</p>
                </div>
            </section>`;
        document.body.appendChild(authModal);

        authModal.querySelectorAll("[data-auth-close]").forEach(el =>
            el.addEventListener("click", closeAuthModal));
        authModal.querySelectorAll("[data-auth-mode]").forEach(button =>
            button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
        authModal.querySelector("#iconmaker-auth-form").addEventListener("submit", submitAuthForm);
        authModal.querySelector(".iconmaker-auth-password-toggle").addEventListener("click", () => {
            const field = authModal.querySelector("#iconmaker-auth-password");
            const toggle = authModal.querySelector(".iconmaker-auth-password-toggle");
            const reveal = field.type === "password";
            field.type = reveal ? "text" : "password";
            toggle.textContent = reveal ? "Hide" : "Show";
            toggle.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
            toggle.setAttribute("aria-pressed", String(reveal));
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && authModal && !authModal.hidden) closeAuthModal();
        });
        updateAccountButton();
        ensurePublisherPortal();
    }

    let authMode = "signin";
    function setAuthMode(mode) {
        authMode = mode === "signup" ? "signup" : "signin";
        authModal?.querySelectorAll("[data-auth-mode]").forEach(button =>
            button.classList.toggle("active", button.dataset.authMode === authMode));
        const title = authModal?.querySelector("#iconmaker-auth-title");
        const description = authModal?.querySelector(".iconmaker-auth-description");
        const submit = authModal?.querySelector("#iconmaker-auth-submit span");
        const password = authModal?.querySelector("#iconmaker-auth-password");
        authModal?.querySelectorAll("[data-auth-mode]").forEach(button =>
            button.setAttribute("aria-selected", String(button.dataset.authMode === authMode)));
        if (title) title.textContent = authMode === "signup" ? "Make room for your next big idea." : "Your creative workspace awaits.";
        if (description) description.textContent = authMode === "signup"
            ? "Create an account to save your icons and access your Private Library anywhere."
            : "Sign in to access your Private Library and keep your projects in sync.";
        if (submit) submit.textContent = authMode === "signup" ? "Create account" : "Sign in";
        if (password) { password.autocomplete = authMode === "signup" ? "new-password" : "current-password"; password.value = ""; password.type = "password"; }
        const toggle = authModal?.querySelector(".iconmaker-auth-password-toggle");
        if (toggle) { toggle.textContent = "Show"; toggle.setAttribute("aria-label", "Show password"); toggle.setAttribute("aria-pressed", "false"); }
        setAuthError("");
    }
    function setAuthError(message) {
        const error = authModal?.querySelector("#iconmaker-auth-error");
        if (error) {
            error.textContent = message || "";
            error.classList.toggle("is-success", /check your inbox|account created/i.test(message || ""));
        }
    }
    function openAuthModal() {
        if (!client) {
            window.alert("The account service could not load. Please refresh and try again.");
            return;
        }
        ensureAuthUI();
        setAuthMode("signin");
        authModal.hidden = false;
        authModal.querySelector("#iconmaker-auth-email")?.focus();
    }
    function closeAuthModal() {
        if (authModal) authModal.hidden = true;
    }
    async function submitAuthForm(event) {
        event.preventDefault();
        if (!client) return;
        const email = authModal.querySelector("#iconmaker-auth-email").value.trim();
        const password = authModal.querySelector("#iconmaker-auth-password").value;
        const submit = authModal.querySelector("#iconmaker-auth-submit");
        submit.disabled = true;
        submit.querySelector("span").textContent = authMode === "signup" ? "Creating account…" : "Signing in…";
        setAuthError("");
        try {
            const result = authMode === "signup"
                ? await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
                : await client.auth.signInWithPassword({ email, password });
            if (result.error) throw result.error;
            if (authMode === "signup" && !result.data.session) {
                setAuthError("Account created. Check your inbox to confirm your email, then sign in.");
                return;
            }
            closeAuthModal();
        } catch (error) {
            setAuthError(error?.message || "Could not complete authentication.");
        } finally {
            submit.disabled = false;
            submit.querySelector("span").textContent = authMode === "signup" ? "Create account" : "Sign in";
        }
    }

    function isOfficialPublisher() {
        // Backward-compatible name: only the single Markora owner is a publisher.
        return currentSession?.user?.app_metadata?.role === "super_admin";
    }

    let publisherPortal = null;
    let publisherPortalProjects = [];

    async function callPublisherControl(action, payload = {}) {
        if (!client) throw new Error("The account service is unavailable.");
        const { data, error } = await client.functions.invoke("markora-publisher-control", {
            body: { action, ...payload }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data || {};
    }

    let publisherPortalEntry = null;
    let publisherPortalPage = "home";
    let publisherPortalStatus = null;
    let publisherAuditEvents = [];
    let publisherAuditOffset = 0;
    let publisherAuditTotal = 0;
    let publisherAuditHasMore = false;

    function ensurePublisherPortal() {
        if (publisherPortal?.isConnected) return publisherPortal;
        const settingsView = document.getElementById("home-view-settings");
        const settingsGrid = settingsView?.querySelector(".settings-grid");
        if (!settingsView || !settingsGrid) return null;

        publisherPortalEntry = document.getElementById("markora-publisher-entry");
        if (!publisherPortalEntry) {
            publisherPortalEntry = document.createElement("section");
            publisherPortalEntry.id = "markora-publisher-entry";
            publisherPortalEntry.className = "settings-card markora-publisher-entry";
            settingsGrid.appendChild(publisherPortalEntry);
            publisherPortalEntry.addEventListener("click", handlePublisherPortalEntryClick);
        }

        let page = document.getElementById("markora-publisher-page");
        if (!page) {
            page = document.createElement("section");
            page.id = "markora-publisher-page";
            page.className = "markora-admin-page";
            page.hidden = true;
            page.innerHTML = `
                <div class="markora-admin-page-header">
                    <button type="button" class="btn btn-secondary markora-admin-back" data-portal-back>← Preferences</button>
                    <div><span class="markora-portal-kicker">MARKORA CONTROL CENTER</span><h2 id="markora-admin-page-title">Authority</h2><p id="markora-admin-page-description" class="management-subtitle"></p></div>
                </div>
                <div id="markora-publisher-portal" class="markora-admin-page-content" aria-live="polite"></div>`;
            settingsView.appendChild(page);
            page.addEventListener("click", event => {
                if (event.target.closest("[data-portal-back]")) closePublisherPortalPage();
            });
        }
        publisherPortal = page.querySelector("#markora-publisher-portal");
        if (!publisherPortal.dataset.handlersAttached) {
            publisherPortal.addEventListener("click", handlePublisherPortalClick);
            publisherPortal.addEventListener("submit", handlePublisherPortalSubmit);
            publisherPortal.addEventListener("input", handlePublisherAuditFilter);
            publisherPortal.addEventListener("change", handlePublisherAuditFilter);
            publisherPortal.dataset.handlersAttached = "true";
        }
        return publisherPortal;
    }

    function renderPublisherPortalEntry(status) {
        const root = ensurePublisherPortal();
        if (!root || !publisherPortalEntry) return;
        const isOwner = !!status?.isOwner;
        const isSignedIn = !!currentSession?.user?.id;
        publisherPortalEntry.innerHTML = `
            <div class="markora-entry-heading"><span class="markora-portal-kicker">MARKORA ACCESS</span><span class="markora-entry-icon">⌘</span></div>
            <h3>Authority</h3>
            <p class="management-subtitle">${isOwner ? "Manage Semi-Publishers, invitations, submissions and ownership." : isSignedIn ? "Manage your contributor access and submissions." : "Sign in to redeem a Semi-Publisher invitation or manage access."}</p>
            <button type="button" class="btn btn-secondary" data-portal-page="authority">Open Authority <span aria-hidden="true">→</span></button>
            ${isOwner ? `<div class="markora-entry-divider"></div><h3>Security Activity</h3><p class="management-subtitle">Review the complete administrative and account activity history.</p><button type="button" class="btn btn-secondary" data-portal-page="security">View activity history <span aria-hidden="true">→</span></button>` : ""}
        `;
    }

    function handlePublisherPortalEntryClick(event) {
        const button = event.target.closest("[data-portal-page]");
        if (!button) return;
        openPublisherPortalPage(button.dataset.portalPage);
    }

    function closePublisherPortalPage() {
        const page = document.getElementById("markora-publisher-page");
        const settingsView = document.getElementById("home-view-settings");
        if (page) page.hidden = true;
        settingsView?.querySelector(".management-header")?.removeAttribute("hidden");
        const grid = settingsView?.querySelector(".settings-grid");
        if (grid) grid.hidden = false;
        publisherPortalPage = "home";
    }

    async function openPublisherPortalPage(pageName) {
        const root = ensurePublisherPortal();
        const page = document.getElementById("markora-publisher-page");
        const settingsView = document.getElementById("home-view-settings");
        const grid = settingsView?.querySelector(".settings-grid");
        if (!root || !page || !grid) return;
        publisherPortalPage = pageName === "security" ? "security" : "authority";
        grid.hidden = true;
        settingsView.querySelector(".management-header")?.setAttribute("hidden", "");
        page.hidden = false;
        await renderPublisherPortalPage();
    }

    async function renderPublisherPortalPage() {
        const root = ensurePublisherPortal();
        const title = document.getElementById("markora-admin-page-title");
        const description = document.getElementById("markora-admin-page-description");
        if (!root) return;
        if (publisherPortalPage === "security") {
            title.textContent = "Security Activity";
            description.textContent = "A chronological record of important account, access and publishing events.";
            root.innerHTML = `
                <div class="markora-audit-toolbar">
                    <input id="markora-audit-search" type="search" placeholder="Search activity…" aria-label="Search security activity">
                    <select id="markora-audit-type" aria-label="Filter activity type">
                        <option value="all">All activity</option>
                        <option value="invite">Invitations</option>
                        <option value="contributor">Contributor access</option>
                        <option value="submission">Submissions</option>
                        <option value="transfer">Ownership transfers</option>
                        <option value="owner">Ownership changes</option>
                    </select>
                    <span id="markora-audit-count" class="markora-audit-count">Loading history…</span>
                </div>
                <div id="markora-audit-results" class="markora-audit-results"><p class="management-subtitle">Loading activity history…</p></div>
                <button type="button" class="btn btn-secondary markora-audit-load-more" data-portal-action="load-audit-more" hidden>Load more activity</button>`;
            try {
                await loadPublisherAuditEvents(true);
            } catch (error) {
                root.innerHTML = `<p class="markora-portal-empty">${escapeHTML(error?.message || "Could not load security activity.")}</p>`;
            }
            return;
        }
        title.textContent = "Authority";
        description.textContent = publisherPortalStatus?.isOwner
            ? "Manage Markora ownership, Semi-Publishers, invitations and Official submissions."
            : "Manage your Markora contributor access and submissions.";
        if (!currentSession?.user?.id) {
            renderPublisherPortalMessage("Authority", "Sign in to redeem an invitation or manage publishing access.");
            return;
        }
        root.innerHTML = '<p class="management-subtitle">Loading authority settings…</p>';
        try {
            const status = await callPublisherControl("get_status");
            publisherPortalStatus = status;
            if (status.isOwner) {
                const [contributorsResult, pendingResult] = await Promise.all([
                    callPublisherControl("list_contributors"),
                    callPublisherControl("list_pending_submissions")
                ]);
                renderOwnerPublisherPortal(contributorsResult.contributors || [], pendingResult.submissions || []);
            } else if (status.role === "semi_publisher") {
                const [projects, submissionsResult] = await Promise.all([
                    fetchPrivateProjects(),
                    callPublisherControl("list_my_submissions")
                ]);
                publisherPortalProjects = (projects || []).filter(project => project?.status === "finished");
                renderContributorPublisherPortal(submissionsResult.submissions || []);
            } else {
                renderRegularPublisherPortal();
            }
        } catch (error) {
            renderPublisherPortalMessage("Authority", error?.message || "Could not load authority settings. Refresh and try again.");
        }
    }

    function renderPublisherAuditEvents() {
        const root = ensurePublisherPortal();
        if (!root) return;
        const query = (root.querySelector("#markora-audit-search")?.value || "").trim().toLowerCase();
        const type = root.querySelector("#markora-audit-type")?.value || "all";
        const filtered = publisherAuditEvents.filter(item => {
            const action = String(item.action || "").toLowerCase();
            const details = JSON.stringify(item.details || {}).toLowerCase();
            const matchesType = type === "all" || action.includes(type);
            return matchesType && (!query || action.includes(query) || details.includes(query) || String(item.actor_user_id || "").toLowerCase().includes(query));
        });
        const rows = filtered.map(item => {
            const details = item.details && Object.keys(item.details).length
                ? `<p class="markora-audit-details">${escapeHTML(Object.entries(item.details).map(([key, value]) => `${key.replaceAll("_", " ")}: ${typeof value === "object" ? JSON.stringify(value) : value}`).join(" · "))}</p>`
                : "";
            return `<article class="markora-audit-event"><div class="markora-audit-event-icon">◈</div><div class="markora-audit-event-main"><strong>${escapeHTML(String(item.action || "Activity").replaceAll("_", " "))}</strong>${details}<span>${escapeHTML(item.actor_user_id ? "Account " + item.actor_user_id : "System event")}</span></div><time>${escapeHTML(new Date(item.created_at).toLocaleString())}</time></article>`;
        }).join("");
        const list = root.querySelector("#markora-audit-results");
        if (list) list.innerHTML = rows || '<p class="markora-portal-empty">No activity matches these filters.</p>';
        const count = root.querySelector("#markora-audit-count");
        if (count) count.textContent = `Showing ${publisherAuditEvents.length} of ${publisherAuditTotal} events`;
        const more = root.querySelector('[data-portal-action="load-audit-more"]');
        if (more) {
            more.hidden = !publisherAuditHasMore;
            more.textContent = "Load more activity";
        }
    }

    async function loadPublisherAuditEvents(reset = false) {
        if (reset) {
            publisherAuditEvents = [];
            publisherAuditOffset = 0;
            publisherAuditTotal = 0;
            publisherAuditHasMore = false;
        }
        const result = await callPublisherControl("list_audit", { offset: publisherAuditOffset, limit: 50 });
        const batch = result.events || [];
        publisherAuditEvents.push(...batch);
        publisherAuditOffset += batch.length;
        publisherAuditTotal = Number(result.total || 0);
        publisherAuditHasMore = !!result.hasMore;
        renderPublisherAuditEvents();
    }

    function handlePublisherAuditFilter(event) {
        if (event.target.matches("#markora-audit-search, #markora-audit-type")) renderPublisherAuditEvents();
    }

    function renderPublisherPortalMessage(title, message) {
        const root = ensurePublisherPortal();
        if (!root) return;
        root.innerHTML = `<div class="markora-portal-heading"><div><span class="markora-portal-kicker">MARKORA ACCESS</span><h3>${escapeHTML(title)}</h3></div></div><p class="management-subtitle">${escapeHTML(message)}</p>`;
    }

    async function refreshPublisherPortal() {
        const root = ensurePublisherPortal();
        if (!root) return;
        if (!currentSession?.user?.id) {
            publisherPortalStatus = null;
            renderPublisherPortalEntry(null);
            if (publisherPortalPage !== "home") renderPublisherPortalPage();
            return;
        }
        try {
            publisherPortalStatus = await callPublisherControl("get_status");
            renderPublisherPortalEntry(publisherPortalStatus);
            if (publisherPortalPage !== "home") await renderPublisherPortalPage();
        } catch (error) {
            renderPublisherPortalEntry(null);
            if (publisherPortalPage !== "home") renderPublisherPortalMessage("Authority", error?.message || "Could not load publisher settings. Refresh and try again.");
        }
    }

    function renderOwnerPublisherPortal(contributors, submissions) {
        const root = ensurePublisherPortal();
        if (!root) return;
        const contributorRows = contributors.length ? contributors.map(item => `
            <div class="markora-portal-row">
                <div class="markora-portal-row-main"><strong>${escapeHTML(item.email)}</strong><span>${escapeHTML(item.status)} · Added ${new Date(item.granted_at).toLocaleDateString()}</span></div>
                ${item.status === "active" ? `<button type="button" class="btn btn-danger btn-small" data-portal-action="revoke-contributor" data-user-id="${escapeHTML(item.user_id)}">Revoke</button>` : ""}
            </div>`).join("") : '<p class="markora-portal-empty">No Semi-Publishers yet.</p>';
        const submissionRows = submissions.length ? submissions.map(item => `
            <div class="markora-portal-row markora-submission-row">
                <div class="markora-portal-row-main"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.email)} · ${escapeHTML(item.projectId)}</span><span>Submitted ${new Date(item.createdAt).toLocaleString()}</span></div>
                <div class="markora-portal-row-actions"><button type="button" class="btn btn-primary btn-small" data-portal-action="review-submission" data-decision="approved" data-submission-id="${escapeHTML(item.id)}">Approve</button><button type="button" class="btn btn-danger btn-small" data-portal-action="review-submission" data-decision="rejected" data-submission-id="${escapeHTML(item.id)}">Reject</button></div>
            </div>`).join("") : '<p class="markora-portal-empty">No submissions are waiting for review.</p>';
        root.innerHTML = `
            <div class="markora-portal-heading"><div><span class="markora-portal-kicker">SOLE AUTHORITY</span><h3>Markora Super Admin</h3><p class="management-subtitle">Your account is the only account that can publish, edit or remove Official icons and appoint contributors.</p></div><span class="markora-portal-role">OWNER</span></div>
            <div class="markora-portal-section"><div class="markora-portal-section-heading"><div><h4>Semi-Publishers</h4><p>Invitation codes work once and expire after 7 days.</p></div><button type="button" class="btn btn-primary" data-portal-action="create-invite">Generate invitation code</button></div><div id="markora-invite-output" class="markora-portal-code-output" hidden></div><div class="markora-portal-list">${contributorRows}</div></div>
            <div class="markora-portal-section"><div class="markora-portal-section-heading"><div><h4>Pending Official submissions</h4><p>Only your approval can add an icon to the Official Library.</p></div></div><div class="markora-portal-list">${submissionRows}</div></div>
            <div class="markora-portal-section"><h4>Transfer Super Admin ownership</h4><p>Enter the recipient's verified Markora account email. You authorize the transfer by generating the code; the recipient must also accept it while signed in. The code expires after 24 hours.</p><form class="markora-portal-form" data-portal-form="create-transfer"><input type="email" name="email" placeholder="Recipient account email" required><input type="password" name="password" autocomplete="current-password" placeholder="Confirm your current password" required><button type="submit" class="btn btn-secondary">Authorize transfer</button></form><div id="markora-transfer-output" class="markora-portal-code-output" hidden></div><button type="button" class="btn btn-danger btn-small" data-portal-action="cancel-transfer">Cancel pending transfer codes</button></div>
        `;
    }

    function renderContributorPublisherPortal(submissions) {
        const root = ensurePublisherPortal();
        if (!root) return;
        const projectOptions = publisherPortalProjects.map(project => `<option value="${escapeHTML(project.id)}">${escapeHTML(project.name || project.id)}</option>`).join("");
        const rows = submissions.length ? submissions.map(item => `
            <div class="markora-portal-row"><div class="markora-portal-row-main"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.projectId)} · ${new Date(item.createdAt).toLocaleDateString()}</span></div><span class="markora-submission-status is-${escapeHTML(item.status)}">${escapeHTML(item.status)}</span>${item.note ? `<p>${escapeHTML(item.note)}</p>` : ""}</div>
        `).join("") : '<p class="markora-portal-empty">You have not submitted any icons yet.</p>';
        root.innerHTML = `
            <div class="markora-portal-heading"><div><span class="markora-portal-kicker">CONTRIBUTOR ACCESS</span><h3>Semi-Publisher</h3><p class="management-subtitle">You can suggest finished icons. They remain private until the Super Admin approves them.</p></div><span class="markora-portal-role is-contributor">CONTRIBUTOR</span></div>
            <div class="markora-portal-section"><h4>Submit a finished Private icon</h4>${publisherPortalProjects.length ? `<form class="markora-portal-form" data-portal-form="submit-project"><select name="projectId" required><option value="">Choose a finished icon…</option>${projectOptions}</select><button type="submit" class="btn btn-primary">Submit for review</button></form>` : '<p class="markora-portal-empty">No finished cloud-synced Private icons were found. Save a finished Private icon while signed in, then return here.</p>'}</div>
            <div class="markora-portal-section"><h4>Your submissions</h4><div class="markora-portal-list">${rows}</div></div>
            <div class="markora-portal-section"><h4>Accept a Super Admin transfer</h4><p>Only enter a transfer code shared by the current Super Admin for your account.</p><form class="markora-portal-form" data-portal-form="accept-transfer"><input name="code" autocomplete="off" placeholder="Ownership transfer code" required><button type="submit" class="btn btn-secondary">Accept ownership</button></form></div>
        `;
    }

    function renderRegularPublisherPortal() {
        const root = ensurePublisherPortal();
        if (!root) return;
        root.innerHTML = `
            <div class="markora-portal-heading"><div><span class="markora-portal-kicker">MARKORA ACCESS</span><h3>Publisher & Ownership</h3><p class="management-subtitle">Redeem an invitation from the Markora Super Admin to become a Semi-Publisher.</p></div></div>
            <div class="markora-portal-section"><h4>Become a Semi-Publisher</h4><form class="markora-portal-form" data-portal-form="redeem-invite"><input name="code" autocomplete="off" placeholder="One-time invitation code" required><button type="submit" class="btn btn-primary">Redeem code</button></form></div>
            <div class="markora-portal-section"><h4>Accept a Super Admin transfer</h4><p>Only enter a transfer code shared by the current Super Admin for your account.</p><form class="markora-portal-form" data-portal-form="accept-transfer"><input name="code" autocomplete="off" placeholder="Ownership transfer code" required><button type="submit" class="btn btn-secondary">Accept ownership</button></form></div>
        `;
    }

    async function handlePublisherPortalClick(event) {
        const button = event.target.closest("[data-portal-action]");
        if (!button || !publisherPortal?.contains(button)) return;
        const action = button.dataset.portalAction;
        button.disabled = true;
        try {
            if (action === "load-audit-more") {
                button.textContent = "Loading…";
                await loadPublisherAuditEvents(false);
            } else if (action === "create-invite") {
                const result = await callPublisherControl("create_invite");
                const output = publisherPortal.querySelector("#markora-invite-output");
                output.hidden = false;
                output.innerHTML = `<strong>One-time invitation code</strong><code>${escapeHTML(result.code)}</code><span>Expires ${new Date(result.expiresAt).toLocaleString()}</span><button type="button" class="btn btn-secondary btn-small" data-portal-action="copy-code" data-code="${escapeHTML(result.code)}">Copy code</button>`;
            } else if (action === "copy-code") {
                await navigator.clipboard.writeText(button.dataset.code || "");
                button.textContent = "Copied";
            } else if (action === "revoke-contributor") {
                if (!window.confirm("Revoke this Semi-Publisher's access? Their future submissions will be blocked.")) return;
                await callPublisherControl("revoke_contributor", { userId: button.dataset.userId });
                await refreshPublisherPortal();
            } else if (action === "review-submission") {
                const decision = button.dataset.decision;
                if (!window.confirm(decision === "approved"
                    ? "Approve this icon and publish it to the shared Official Library? Existing Official icons will never be overwritten."
                    : "Reject this submission? It will not be added to the Official Library.")) return;
                await callPublisherControl("review_submission", { submissionId: button.dataset.submissionId, decision });
                if (decision === "approved") {
                    const projects = await fetchOfficialProjects();
                    appHooks?.onOfficialProjectsChanged?.(projects);
                }
                await refreshPublisherPortal();
            } else if (action === "cancel-transfer") {
                if (!window.confirm("Cancel all pending Super Admin transfer codes?")) return;
                await callPublisherControl("cancel_transfer");
                await refreshPublisherPortal();
            }
        } catch (error) {
            window.alert(error?.message || "The action could not be completed.");
        } finally {
            if (button.isConnected) button.disabled = false;
        }
    }

    async function handlePublisherPortalSubmit(event) {
        const form = event.target.closest("form[data-portal-form]");
        if (!form || !publisherPortal?.contains(form)) return;
        event.preventDefault();
        const formAction = form.dataset.portalForm;
        const values = Object.fromEntries(new FormData(form).entries());
        const submit = form.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
            if (formAction === "create-transfer") {
                if (!window.confirm("You are authorizing a transfer of Super Admin ownership to this account. The recipient must still accept the code. Continue?")) return;
                const { data: reauthData, error: reauthError } = await client.auth.signInWithPassword({
                    email: currentSession?.user?.email || "",
                    password: values.password
                });
                if (reauthError || !reauthData?.session) throw new Error("Password confirmation failed. Ownership was not transferred.");
                setSession(reauthData.session);
                const result = await callPublisherControl("create_transfer", { email: values.email });
                const output = publisherPortal.querySelector("#markora-transfer-output");
                output.hidden = false;
                output.innerHTML = `<strong>Ownership transfer code for ${escapeHTML(result.recipientEmail)}</strong><code>${escapeHTML(result.code)}</code><span>Expires ${new Date(result.expiresAt).toLocaleString()}</span><button type="button" class="btn btn-secondary btn-small" data-portal-action="copy-code" data-code="${escapeHTML(result.code)}">Copy code</button>`;
                form.reset();
            } else if (formAction === "redeem-invite") {
                await callPublisherControl("redeem_invite", { code: values.code });
                await client.auth.refreshSession();
                const { data: sessionData } = await client.auth.getSession();
                setSession(sessionData.session);
                await refreshPublisherPortal();
            } else if (formAction === "accept-transfer") {
                if (!window.confirm("Accept the transfer and become the sole Markora Super Admin? The current owner's authority will end immediately.")) return;
                await callPublisherControl("accept_transfer", { code: values.code });
                await client.auth.refreshSession();
                const { data: sessionData } = await client.auth.getSession();
                setSession(sessionData.session);
                await refreshPublisherPortal();
            } else if (formAction === "submit-project") {
                const project = publisherPortalProjects.find(item => String(item.id) === String(values.projectId));
                if (!project) throw new Error("Choose a valid finished Private icon.");
                await callPublisherControl("submit_project", { project });
                await refreshPublisherPortal();
            }
        } catch (error) {
            window.alert(error?.message || "The request could not be completed.");
        } finally {
            if (submit?.isConnected) submit.disabled = false;
        }
    }

    function updateAccountButton() {
        const button = document.getElementById("iconmaker-account-button");
        const migrateButton = document.getElementById("iconmaker-official-migrate-button");
        if (migrateButton) migrateButton.hidden = !isOfficialPublisher();
        if (!button) return;
        const label = button.querySelector(".iconmaker-account-label");
        if (label) label.textContent = currentSession?.user?.email || "Sign in";
        button.title = currentSession ? "Account options" : "Sign in to access your Private Library";
        button.classList.toggle("is-signed-in", !!currentSession);
        if (currentSession && !button.querySelector(".iconmaker-account-menu")) {
            const menu = document.createElement("span");
            menu.className = "iconmaker-account-menu";
            menu.textContent = "Sign out";
            button.appendChild(menu);
            button.addEventListener("click", async event => {
                if (!currentSession) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                if (!window.confirm("Sign out of Icon Maker Pro?")) return;
                const { error } = await client.auth.signOut();
                if (error) window.alert(error.message);
            }, true);
        } else if (!currentSession) {
            button.querySelector(".iconmaker-account-menu")?.remove();
        }
    }

    async function fetchOfficialProjects() {
        if (!client) return [];
        const { data, error } = await client.from("official_projects")
            .select("project_id, project_data").order("published_at", { ascending: false });
        if (error) throw error;
        const cloudProjects = (data || []).map(row => {
            const project = row.project_data && typeof row.project_data === "object" ? row.project_data : {};
            return { ...project, id: String(project.id || row.project_id), _gallerySpace: "official", _officialSource: "cloud" };
        });
        // The shared cloud table is authoritative. Legacy local data remains in
        // localStorage for the publisher migration/recovery flow, but must never
        // resurrect an Official icon that a publisher deleted from the cloud.
        return cloudProjects.filter(project => project.id);
    }

    // One-time, non-destructive migration of the old browser-local Official Library.
    // Only finished records with stable IDs are considered. Existing cloud records are never overwritten,
    // and the browser's legacy storage key is deliberately retained as a recovery copy.
    async function saveOfficialProject(project) {
        if (!currentSession?.user?.id) throw new Error("Sign in before publishing Official icons.");
        if (!isOfficialPublisher()) throw new Error("This account does not have Official Publisher access.");
        if (!project || typeof project !== "object" || !project.id) throw new Error("A valid icon project is required.");

        const projectData = { ...project, id: String(project.id), status: "finished" };
        delete projectData._gallerySpace;
        delete projectData._officialSource;
        delete projectData._cloudUpdatedAt;

        const { error } = await client.from("official_projects").upsert({
            project_id: String(projectData.id),
            project_data: projectData,
            published_at: new Date().toISOString()
        }, { onConflict: "project_id" });
        if (error) throw error;

        const projects = await fetchOfficialProjects();
        appHooks?.onOfficialProjectsChanged?.(projects);
        return projects.find(item => String(item.id) === String(projectData.id)) || {
            ...projectData, _gallerySpace: "official", _officialSource: "cloud"
        };
    }

    async function deleteOfficialProject(projectId) {
        if (!currentSession?.user?.id) throw new Error("Sign in before deleting Official icons.");
        if (!isOfficialPublisher()) throw new Error("This account does not have Official Publisher access.");
        const id = String(projectId || "").trim();
        if (!id) throw new Error("A valid Official icon ID is required.");

        const { data, error } = await client.from("official_projects")
            .delete()
            .eq("project_id", id)
            .select("project_id");
        if (error) throw error;
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("The Official icon was not found or could not be deleted.");
        }

        // Remove this ID from the local legacy recovery cache on this device too.
        try {
            const stored = JSON.parse(localStorage.getItem("iconMakerOfficialGalleryProjects") || "[]");
            if (Array.isArray(stored)) {
                localStorage.setItem("iconMakerOfficialGalleryProjects", JSON.stringify(
                    stored.filter(project => String(project?.id || "") !== id)
                ));
            }
        } catch (storageError) {
            console.warn("Could not update the legacy Official Library cache.", storageError);
        }

        const projects = await fetchOfficialProjects();
        appHooks?.onOfficialProjectsChanged?.(projects);
        return projects;
    }

    async function migrateLegacyOfficialProjects() {
        if (!currentSession?.user?.id) throw new Error("Sign in before migrating Official icons.");
        if (!isOfficialPublisher()) throw new Error("This account does not have Official Publisher access.");

        let stored;
        try {
            const raw = localStorage.getItem("iconMakerOfficialGalleryProjects");
            stored = raw ? JSON.parse(raw) : [];
        } catch (_) {
            throw new Error("The legacy Official Library backup could not be read. Its original data was left untouched.");
        }
        if (!Array.isArray(stored)) throw new Error("The legacy Official Library backup is not a valid project list.");

        const unique = new Map();
        let skipped = 0;
        stored.forEach(project => {
            if (!project || typeof project !== "object" || Array.isArray(project) ||
                project.status !== "finished" || !project.id) {
                skipped++;
                return;
            }
            const id = String(project.id).trim();
            if (!id || unique.has(id)) {
                skipped++;
                return;
            }
            const projectData = { ...project };
            delete projectData._gallerySpace;
            delete projectData._officialSource;
            delete projectData._cloudUpdatedAt;
            unique.set(id, { project_id: id, project_data: projectData });
        });

        let published = 0;
        let alreadyPresent = 0;
        const candidates = [...unique.values()];
        for (let start = 0; start < candidates.length; start += 75) {
            const batch = candidates.slice(start, start + 75);
            const ids = batch.map(row => row.project_id);
            const { data: existing, error: lookupError } = await client
                .from("official_projects").select("project_id").in("project_id", ids);
            if (lookupError) throw lookupError;
            const existingIds = new Set((existing || []).map(row => String(row.project_id)));
            alreadyPresent += existingIds.size;
            const missingRows = batch.filter(row => !existingIds.has(row.project_id));
            if (!missingRows.length) continue;
            const { error: insertError } = await client.from("official_projects").insert(missingRows);
            if (insertError) throw insertError;
            published += missingRows.length;
        }

        return { published, alreadyPresent, skipped, total: candidates.length };
    }

    async function fetchPrivateProjects() {
        if (!client || !currentSession?.user?.id) return [];
        const { data, error } = await client.from("private_projects")
            .select("project_id, project_data, updated_at").eq("user_id", currentSession.user.id);
        if (error) throw error;
        return (data || []).map(row => {
            const project = row.project_data && typeof row.project_data === "object" ? row.project_data : {};
            return { ...project, id: String(project.id || row.project_id), _cloudUpdatedAt: row.updated_at };
        });
    }

    async function savePrivateProjects(projects) {
        if (!client || !currentSession?.user?.id) return;
        const rows = (Array.isArray(projects) ? projects : []).map(project => ({
            user_id: currentSession.user.id,
            project_id: String(project.id),
            project_data: project
        }));
        if (!rows.length) return;
        const { error } = await client.from("private_projects")
            .upsert(rows, { onConflict: "user_id,project_id" });
        if (error) throw error;
    }

    async function deletePrivateProject(projectId) {
        if (!client || !currentSession?.user?.id) return;
        const { error } = await client.from("private_projects")
            .delete().eq("user_id", currentSession.user.id).eq("project_id", String(projectId));
        if (error) throw error;
    }

    function setSession(session, initial = false) {
        currentSession = session || null;
        updateAccountButton();
        const appChange = appHooks?.onAuthChanged?.(currentSession, { initial });
        Promise.resolve(appChange)
            .catch(error => console.warn("Markora auth sync callback failed:", error))
            .finally(refreshPublisherPortal);
    }

    async function initialize(hooks) {
        appHooks = hooks || {};
        ensureAuthUI();
        if (!client) {
            console.error("Supabase client failed to initialize. Check the CDN script.");
            return;
        }
        if (initialized) return;
        initialized = true;
        const { data: { session } } = await client.auth.getSession();
        setSession(session, true);
        client.auth.onAuthStateChange((event, sessionNow) => {
            currentSession = sessionNow || null;
            updateAccountButton();
            // Wait for Private Library account sync before rendering contributor project choices.
            Promise.resolve()
                .then(() => appHooks?.onAuthChanged?.(currentSession, { event }))
                .catch(error => console.warn("Markora auth sync callback failed:", error))
                .finally(refreshPublisherPortal);
        });
    }

    window.IconMakerSupabase = {
        available: !!client,
        initialize,
        openAuthModal,
        getSession: () => currentSession,
        isOfficialPublisher,
        fetchOfficialProjects,
        saveOfficialProject,
        deleteOfficialProject,
        migrateLegacyOfficialProjects,
        fetchPrivateProjects,
        savePrivateProjects,
        deletePrivateProject
    };
})();