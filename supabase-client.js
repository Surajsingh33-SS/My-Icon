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
        return currentSession?.user?.app_metadata?.role === "official_publisher";
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
        let localProjects = [];
        try {
            const stored = JSON.parse(localStorage.getItem("iconMakerOfficialGalleryProjects") || "[]");
            if (Array.isArray(stored)) localProjects = stored.filter(project =>
                project && typeof project === "object" && !Array.isArray(project)
            ).map(project => ({ ...project, _gallerySpace: "official", _officialSource: "legacy-local" }));
        } catch (storageError) {
            console.warn("Could not read legacy Official Library cache; leaving it untouched.", storageError);
        }
        const merged = new Map();
        localProjects.forEach(project => merged.set(String(project.id || ""), project));
        cloudProjects.forEach(project => merged.set(String(project.id || ""), project));
        return [...merged.values()].filter(project => project.id);
    }

    // One-time, non-destructive migration of the old browser-local Official Library.
    // Only finished records with stable IDs are considered. Existing cloud records are never overwritten,
    // and the browser's legacy storage key is deliberately retained as a recovery copy.
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
        if (appHooks?.onAuthChanged) appHooks.onAuthChanged(currentSession, { initial });
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
            // Defer app callbacks out of Supabase's auth event callback.
            Promise.resolve().then(() => appHooks?.onAuthChanged?.(currentSession, { event }));
        });
    }

    window.IconMakerSupabase = {
        available: !!client,
        initialize,
        openAuthModal,
        getSession: () => currentSession,
        fetchOfficialProjects,
        migrateLegacyOfficialProjects,
        fetchPrivateProjects,
        savePrivateProjects,
        deletePrivateProject
    };
})();