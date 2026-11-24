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

        authModal = document.createElement("div");
        authModal.id = "iconmaker-auth-modal";
        authModal.className = "iconmaker-auth-modal";
        authModal.hidden = true;
        authModal.innerHTML = `
            <div class="iconmaker-auth-backdrop" data-auth-close></div>
            <section class="iconmaker-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="iconmaker-auth-title">
                <button class="iconmaker-auth-close" type="button" aria-label="Close" data-auth-close>×</button>
                <div class="iconmaker-auth-eyebrow">ICON MAKER PRO</div>
                <h2 id="iconmaker-auth-title">Your Private Library</h2>
                <p class="iconmaker-auth-description">Sign in to sync your icons securely across your devices.</p>
                <div class="iconmaker-auth-tabs">
                    <button type="button" class="active" data-auth-mode="signin">Sign in</button>
                    <button type="button" data-auth-mode="signup">Create account</button>
                </div>
                <form id="iconmaker-auth-form">
                    <label for="iconmaker-auth-email">Email</label>
                    <input id="iconmaker-auth-email" type="email" autocomplete="email" required maxlength="254">
                    <label for="iconmaker-auth-password">Password</label>
                    <input id="iconmaker-auth-password" type="password" autocomplete="current-password" required minlength="8">
                    <p class="iconmaker-auth-error" id="iconmaker-auth-error" role="alert"></p>
                    <button class="iconmaker-auth-submit" id="iconmaker-auth-submit" type="submit">Sign in</button>
                </form>
                <p class="iconmaker-auth-footnote">Your Private Library is visible only to your account. Official icons remain public and read-only.</p>
            </section>`;
        document.body.appendChild(authModal);

        authModal.querySelectorAll("[data-auth-close]").forEach(el =>
            el.addEventListener("click", closeAuthModal));
        authModal.querySelectorAll("[data-auth-mode]").forEach(button =>
            button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
        authModal.querySelector("#iconmaker-auth-form").addEventListener("submit", submitAuthForm);
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
        const submit = authModal?.querySelector("#iconmaker-auth-submit");
        const password = authModal?.querySelector("#iconmaker-auth-password");
        if (title) title.textContent = authMode === "signup" ? "Create your account" : "Your Private Library";
        if (submit) submit.textContent = authMode === "signup" ? "Create account" : "Sign in";
        if (password) password.autocomplete = authMode === "signup" ? "new-password" : "current-password";
        setAuthError("");
    }
    function setAuthError(message) {
        const error = authModal?.querySelector("#iconmaker-auth-error");
        if (error) error.textContent = message || "";
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
        submit.textContent = authMode === "signup" ? "Creating…" : "Signing in…";
        setAuthError("");
        try {
            const result = authMode === "signup"
                ? await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
                : await client.auth.signInWithPassword({ email, password });
            if (result.error) throw result.error;
            if (authMode === "signup" && !result.data.session) {
                setAuthError("Account created. Check your email to confirm your address, then sign in.");
                return;
            }
            closeAuthModal();
        } catch (error) {
            setAuthError(error?.message || "Could not complete authentication.");
        } finally {
            submit.disabled = false;
            submit.textContent = authMode === "signup" ? "Create account" : "Sign in";
        }
    }

    function updateAccountButton() {
        const button = document.getElementById("iconmaker-account-button");
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
        return (data || []).map(row => {
            const project = row.project_data && typeof row.project_data === "object" ? row.project_data : {};
            return { ...project, id: String(project.id || row.project_id), _gallerySpace: "official" };
        });
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
        fetchPrivateProjects,
        savePrivateProjects,
        deletePrivateProject
    };
})();