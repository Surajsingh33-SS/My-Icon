/**
 * ============================================================================
 * ICON MAKER PRO — CORE JAVASCRIPT APPLICATION
 * Advanced 24×24 Vector Drawing Engine, Multi-Project Manager & Studio UI
 * ============================================================================
 */

(function () {
    "use strict";

    // ========================================================================
    // 1. CONSTANTS & DOM REFERENCES
    // ========================================================================
    const SVG_NS = "http://www.w3.org/2000/svg";
    const PROJECT_STORAGE_KEY = "iconMakerProject"; // Legacy key
    const PROJECTS_STORAGE_KEY = "iconMakerProjects";
    const THEME_STORAGE_KEY = "iconMakerTheme";
    const ACCENT_STORAGE_KEY = "iconMakerAccent";
    const VIEW_MODE_STORAGE_KEY = "iconMakerViewMode";
    const CUSTOMIZATION_STORAGE_KEY = "iconMakerGlobalCustomization";
    const PROJECT_FORMAT_VERSION = 1;

    const DEFAULT_ACCENT = "#ff0077";
    const ALLOWED_ACCENTS = [
        "#ff0077", "#a200ff", "#0084ff", "#00ffee",
        "#00ff73", "#a6ff00", "#f56565", "#ff0000"
    ];

    // Core Canvas & Tools
    const tools = document.querySelectorAll(".tool");
    const workspace = document.getElementById("workspace");
    const workspaceContainer = document.querySelector(".workspace-container");
    const layerList = document.getElementById("layer-list");
    const layerCount = document.getElementById("layer-count");
    const pathStyleToggle = document.getElementById("path-style-toggle");
    const deleteButton = document.getElementById("delete-shape");

    // Guidelines, Safe Area & Highlights
    const showGuidelinesCheckbox = document.getElementById("show-guidelines");
    const workspaceGuidelines = document.getElementById("workspace-guidelines");
    const showCoordinatesCheckbox = document.getElementById("show-coordinates");
    const coordinateLabels = document.getElementById("coordinate-labels");
    const gridHighlightToggle = document.getElementById("show-grid-highlight");
    const gridHoverMarker = document.getElementById("grid-hover-marker");
    const showSafeAreaCheckbox = document.getElementById("show-safe-area");
    const safeAreaRect = document.getElementById("safe-area-rect");
    const dotGridBg = document.getElementById("dot-grid-bg");
    const customMirrorAxesGroup = document.getElementById("custom-mirror-axes");
    const symmetryPreviewLayer = document.getElementById("symmetry-preview-layer");
    const endpointSnapIndicator = document.getElementById("endpoint-snap-indicator");
    const marqueeSelectionBox = document.getElementById("marquee-selection-box");

    // Artboard Size Selector
    const artboardSizeSelector = document.getElementById("artboard-size-selector");
    const artboardSizeButtons = artboardSizeSelector?.querySelectorAll(".size-btn") || [];
    const workspaceDimenLabel = document.querySelector(".workspace-dimen");

    // History & Actions
    const undoButton = document.getElementById("undo-btn");
    const redoButton = document.getElementById("redo-btn");

    // Floating View Controls
    const floatZoomIn = document.getElementById("float-zoom-in");
    const floatZoomOut = document.getElementById("float-zoom-out");
    const floatZoomLevel = document.getElementById("float-zoom-level");
    const gridModeSelect = document.getElementById("grid-mode-select");

    // Zoom & Pan (Sidebar Controls)
    const zoomInButton = document.getElementById("zoom-in");
    const zoomOutButton = document.getElementById("zoom-out");
    const zoomResetButton = document.getElementById("zoom-reset");
    const zoomLevelText = document.getElementById("zoom-level");
    const floatZoomResetButton = document.getElementById("float-zoom-reset");

    // Live Symmetry Controls
    const liveSymmetryHCheckbox = document.getElementById("live-symmetry-h");
    const liveSymmetryVCheckbox = document.getElementById("live-symmetry-v");
    const customMirrorToolBtn = document.getElementById("custom-mirror-tool-btn");

    // Properties & Measurements
    const propertiesPanel = document.getElementById("properties-panel");
    const propertiesSelection = document.getElementById("properties-selection");
    const propertiesFields = document.getElementById("properties-fields");
    const measurementPanel = document.getElementById("measurement-panel");
    const measurementSelection = document.getElementById("measurement-selection");
    const measurementFields = document.getElementById("measurement-fields");

    // SVG Source
    const svgCode = document.getElementById("svg-code");
    const copyCodeButton = document.getElementById("copy-code");
    const applyCodeButton = document.getElementById("apply-code");

    // Topbar & Project Navigation
    const fileMenuButton = document.getElementById("file-menu-button");
    const fileDropdown = document.getElementById("file-dropdown");
    const newProjectButton = document.getElementById("new-project-button");
    const saveProjectButton = document.getElementById("save-project-button");
    const finishProjectButton = document.getElementById("finish-project-button");
    const topbarExportBtn = document.getElementById("topbar-export-btn");
    const homeButton = document.getElementById("home-button");
    const logoHomeButton = document.getElementById("logo-home-button");
    const activeProjectNameLabel = document.getElementById("active-project-name");
    const saveStatusIndicator = document.getElementById("save-status-indicator");
    const exportProjectJsonBtn = document.getElementById("export-project-json-btn");
    const importProjectJsonBtn = document.getElementById("import-project-json-btn");
    const importProjectFileInput = document.getElementById("import-project-file-input");
    const shortcutsTriggerBtn = document.getElementById("shortcuts-trigger-btn");
    const unfinishedProjectList = document.getElementById("unfinished-project-list");

    // Home Screen & Gallery
    const homeScreen = document.getElementById("home-screen");
    const homeEditButton = document.getElementById("home-edit-button");
    const homeSearchInput = document.getElementById("home-search-input");
    const clearSearchBtn = document.getElementById("clear-search-btn");
    const homeCategorySelect = document.getElementById("home-category-select");
    const homeSortSelect = document.getElementById("home-sort-select");
    const homeProjectGrid = document.getElementById("home-project-grid");
    const homeViewToggleBtns = document.querySelectorAll(".home-view-toggle button");
    const homeTabs = document.querySelectorAll(".home-nav-option");
    const tabCountAll = document.getElementById("tab-count-all");
    const tabCountFav = document.getElementById("tab-count-fav");
    const sidebarProjectsCount = document.getElementById("sidebar-projects-count");

    // Sidebar Category & View Mode Controls
    const viewModeAllBtn = document.getElementById("view-mode-all");
    const viewModeCategoriesBtn = document.getElementById("view-mode-categories");
    const categoriesAlphabeticalList = document.getElementById("categories-alphabetical-list");
    const clearCategoryFilterBtn = document.getElementById("clear-category-filter");

    // Project Manager Views
    const sidebarOptions = document.querySelectorAll(".sidebar-option");
    const homeViewSections = {
        gallery: document.getElementById("home-view-gallery"),
        projects: document.getElementById("home-view-projects"),
        settings: document.getElementById("home-view-settings")
    };
    const managementTableContainer = document.getElementById("management-table-container");
    const managerNewIconBtn = document.getElementById("manager-new-icon-btn");
    const finishedProjectGrid = document.getElementById("finished-project-grid");
    const unfinishedProjectGrid = document.getElementById("unfinished-project-grid");
    const managerFinishedCount = document.getElementById("manager-finished-count");
    const managerUnfinishedCount = document.getElementById("manager-unfinished-count");

    // Global Customization Controls
    const globalIconColor = document.getElementById("global-icon-color");
    const globalColorValue = document.getElementById("global-color-value");
    const globalColorChip = document.getElementById("global-color-chip");
    const globalStrokeWidth = document.getElementById("global-stroke-width");
    const globalStrokeValue = document.getElementById("global-stroke-value");
    const globalIconSize = document.getElementById("global-icon-size");
    const globalSizeValue = document.getElementById("global-size-value");
    const resetGlobalCustomization = document.getElementById("reset-global-customization");

    // Appearance / Theme
    const themeToggle = document.getElementById("theme-toggle");
    const themeToggleKnob = themeToggle?.querySelector(".theme-toggle-knob");
    const accentSwatches = document.querySelectorAll(".accent-swatch[data-accent]");

    // Preview Details Drawer
    const projectDetails = document.getElementById("project-details");
    const projectDetailsClose = document.getElementById("project-details-close");
    const projectPreview = document.getElementById("project-preview");
    const projectPreviewImage = document.getElementById("project-preview-image");
    const projectName = document.getElementById("project-name");
    const projectSearchTerms = document.getElementById("project-search-terms");
    const projectCategoryBadge = document.getElementById("project-category-badge");
    const projectDateBadge = document.getElementById("project-date-badge");
    const projectFavoriteBtn = document.getElementById("project-favorite-btn");
    const previewStrokeWidth = document.getElementById("preview-stroke-width");
    const previewStrokeValue = document.getElementById("preview-stroke-value");
    const projectEditButton = document.getElementById("project-edit-button");
    const projectRemixButton = document.getElementById("project-remix-button");
    const projectDeleteButton = document.getElementById("project-delete-button");
    const projectMoreSearchButton = document.getElementById("project-more-search-button");
    const projectRelated = document.getElementById("project-related");
    const relatedProjectGrid = document.getElementById("related-project-grid");
    const relatedHeadingText = document.getElementById("related-heading-text");
    const relatedCount = document.getElementById("related-count");

    // Modals
    const finishModal = document.getElementById("finish-modal");
    const finishIconName = document.getElementById("finish-icon-name");
    const finishIconCategory = document.getElementById("finish-icon-category");
    const finishCancel = document.getElementById("finish-cancel");
    const finishConfirm = document.getElementById("finish-confirm");

    const deleteConfirmModal = document.getElementById("delete-confirm-modal");
    const deleteTargetProjectName = document.getElementById("delete-target-project-name");
    const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
    const deleteCancelBtn = document.getElementById("delete-cancel-btn");

    const exportModal = document.getElementById("export-modal");
    const exportCancel = document.getElementById("export-cancel");
    const exportTabs = document.querySelectorAll(".export-tab");
    const exportOptions = document.querySelectorAll(".export-option");
    const pngResolutionSection = document.getElementById("png-resolution-section");
    const resButtons = document.querySelectorAll(".res-btn");
    const exportDownloadBtn = document.getElementById("export-download-btn");

    const shortcutsModal = document.getElementById("shortcuts-modal");
    const shortcutsCloseBtn = document.getElementById("shortcuts-close-btn");

    // Context Menu & Toasts
    const canvasContextMenu = document.getElementById("canvas-context-menu");
    const toastContainer = document.getElementById("toast-container");
    const transformToolbar = document.getElementById("transform-toolbar");

    // Settings View Controls

    const settingEndpointSnapping = document.getElementById("setting-endpoint-snapping");
    const settingSmartGuides = document.getElementById("setting-smart-guides");
    const settingCurveSnapping = document.getElementById("setting-curve-snapping");
    const settingDefaultCoordinates = document.getElementById("setting-default-coordinates");
    const settingDefaultGridHover = document.getElementById("setting-default-grid-hover");
    const settingDefaultGuidelines = document.getElementById("setting-default-guidelines");
    const settingsBackupBtn = document.getElementById("settings-backup-btn");
    const settingsClearAllBtn = document.getElementById("settings-clear-all-btn");

    // ========================================================================
    // 2. STATE MANAGEMENT
    // ========================================================================
    let shapes = [];
    let pathDrawing = null;
    let selectedShape = null;
    let selectedShapes = [];

    let dragging = null;
    let draggingTool = null;
    let dropPreview = null;
    let copiedShapes = [];

    let isRestoringProject = false;
    let activeHomeTab = "all"; // 'all' | 'recent' | 'favorites'
    let homeViewMode = "grid"; // 'grid' | 'list'
    let galleryViewCategory = "all"; // 'all' | 'categories'
    let selectedCategoryFilter = null;
    let selectedHomeProject = null;
    let projectToDelete = null;

    let artboardSize = 24; // 24 | 32
    let liveSymmetryH = false;
    let liveSymmetryV = false;
    let customMirrorAxes = []; // [{ id, x1, y1, x2, y2, active }]
    let isPlacingMirrorAxis = false;
    let mirrorAxisPlacementPoints = [];

    let isMarqueeActive = false;
    let marqueeStart = null;

    let currentGridDisplayMode = "full"; // 'full' | 'keyframe' | 'clean'

    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 4.8;
    const ZOOM_STEP = 0.25;

    const COPY_OFFSET = 0.8;
    const HISTORY_LIMIT = 50;
    let history = [];
    let historyIndex = -1;
    let historyBeforeAction = null;

    // Multi-project manager
    let projectManager = {
        activeProjectId: null,
        projects: []
    };

    // Color palettes for default shape creation
    const colorPalettes = {
        line: ["#60A5FA", "#22D3EE", "#818CF8", "#A78BFA"],
        curve: ["#E879F9", "#F472B6", "#C084FC", "#FB7185"],
        circle: ["#4ADE80", "#2DD4BF", "#A3E635", "#34D399"],
        rectangle: ["#FBBF24", "#FB923C", "#F97316", "#F87171"],
        path: ["#A78BFA", "#60A5FA", "#34D399", "#F472B6"]
    };

    const colorCounters = {
        line: 0,
        curve: 0,
        circle: 0,
        rectangle: 0,
        path: 0
    };

    function getNextColor(type) {
        const palette = colorPalettes[type] || colorPalettes.line;
        const index = colorCounters[type] % palette.length;
        colorCounters[type]++;
        return palette[index];
    }

    // Set of keys on shapes that are live DOM nodes (excluded from serialization)
    const shapeDOMKeys = new Set([
        "element",
        "strokeElement",
        "hoverBg",
        "guideBg",
        "guide",
        "hitLine",
        "hitPath",
        "hitArea",
        "horizontalGuide",
        "angleGuide",
        "alignedGuide",
        "perpendicularGuide",
        "handles",
        "circumferenceGuide",
        "verticalGuide",
        "startRadialGuide",
        "endRadialGuide",
        "radiusLabel",
        "symmetryReflections"
    ]);
    const transformToolbarToggle = document.getElementById("transform-toolbar-toggle");

    transformToolbarToggle?.addEventListener("click", () => {
        const isOpen = transformToolbar.classList.toggle("open");

        transformToolbarToggle.setAttribute("aria-expanded", isOpen);
        transformToolbarToggle.setAttribute(
            "aria-label",
            isOpen ? "Close Transform & Alignment toolbar" : "Open Transform & Alignment toolbar"
        );
    });
    const viewControls = document.getElementById("floating-view-controls");
    const viewControlsToggle = document.getElementById("view-controls-toggle");
    viewControls?.classList.add("collapsed");
    viewControlsToggle?.classList.add("collapsed");

    viewControlsToggle?.addEventListener("click", () => {
        const isCollapsed = viewControls.classList.toggle("collapsed");

        viewControlsToggle.classList.toggle("collapsed", isCollapsed);
        viewControlsToggle.setAttribute("aria-expanded", !isCollapsed);
    });
    document.addEventListener("click", event => {
        if (
            !transformToolbar?.contains(event.target) &&
            !transformToolbarToggle?.contains(event.target)
        ) {
            transformToolbar.classList.remove("open");
            transformToolbarToggle?.setAttribute("aria-expanded", "false");
            transformToolbarToggle?.setAttribute(
                "aria-label",
                "Open Transform & Alignment toolbar"
            );
        }
    });

    // Setup Smart Alignment Guides in SVG
    const alignmentGuides = document.createElementNS(SVG_NS, "g");
    alignmentGuides.setAttribute("id", "alignment-guides");
    alignmentGuides.setAttribute("pointer-events", "none");

    const alignmentVertical = document.createElementNS(SVG_NS, "line");
    const alignmentHorizontal = document.createElementNS(SVG_NS, "line");

    [alignmentVertical, alignmentHorizontal].forEach(line => {
        line.setAttribute("stroke", "#38BDF8");
        line.setAttribute("stroke-width", "0.07");
        line.setAttribute("stroke-dasharray", "0.4 0.25");
        line.style.display = "none";
        alignmentGuides.appendChild(line);
    });

    workspace.appendChild(alignmentGuides);

    // ========================================================================
    // 3. TOAST NOTIFICATIONS & FEEDBACK
    // ========================================================================
    function showToast(message, type = "info") {
        if (!toastContainer) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;

        const icon = type === "success" ? "✓" : type === "error" ? "✕" : "✦";
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "toastOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards";
            setTimeout(() => toast.remove(), 200);
        }, 2600);
    }

    function setSaveStatus(saved = true) {
        if (!saveStatusIndicator) return;
        saveStatusIndicator.textContent = saved ? "Saved" : "Unsaved";
        saveStatusIndicator.classList.toggle("saved", saved);
        saveStatusIndicator.classList.toggle("unsaved", !saved);
    }

    // ========================================================================
    // 4. APPEARANCE: THEME & ACCENT SYSTEM
    // ========================================================================
    function applyTheme(theme) {
        const isLight = theme === "light";
        document.body.classList.toggle("light-theme", isLight);

        if (themeToggleKnob) {
            themeToggleKnob.textContent = isLight ? "☀" : "☾";
        }

        if (themeToggle) {
            themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
            themeToggle.setAttribute("aria-pressed", String(isLight));
        }

        try {
            localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark");
        } catch (error) {
            console.warn("Could not save theme preference:", error);
        }
    }

    function applyAccentColor(color) {
        const normalizedColor = String(color || "").toLowerCase();
        const safeColor = ALLOWED_ACCENTS.includes(normalizedColor) ? normalizedColor : DEFAULT_ACCENT;

        document.body.setAttribute("data-accent", safeColor);

        accentSwatches.forEach(swatch => {
            const isActive = swatch.dataset.accent.toLowerCase() === safeColor;
            swatch.classList.toggle("active", isActive);
            swatch.setAttribute("aria-pressed", String(isActive));
        });

        try {
            localStorage.setItem(ACCENT_STORAGE_KEY, safeColor);
        } catch (error) {
            console.warn("Could not save accent preference:", error);
        }
    }

    themeToggle?.addEventListener("click", () => {
        const isLight = document.body.classList.contains("light-theme");
        applyTheme(isLight ? "dark" : "light");
    });

    accentSwatches.forEach(swatch => {
        swatch.addEventListener("click", () => {
            applyAccentColor(swatch.dataset.accent);
        });
    });

    // Initialize Theme & Accent from Storage
    let savedTheme = "dark";
    let savedAccent = DEFAULT_ACCENT;
    try {
        savedTheme = localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
        savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT;
    } catch (e) {
        console.warn("Storage access failed for theme:", e);
    }
    applyTheme(savedTheme);
    applyAccentColor(savedAccent);

    // ========================================================================
    // 5. GLOBAL ICON CUSTOMIZATION (LIVE PREVIEW IN GALLERY)
    // ========================================================================
    function updateGlobalCustomizationState(save = true) {
        const color = globalIconColor.value || "#ffffff";
        const stroke = Number(globalStrokeWidth.value) || 2;
        const size = Number(globalIconSize.value) || 24;

        if (globalColorValue) globalColorValue.textContent = color.toUpperCase();
        if (globalStrokeValue) globalStrokeValue.textContent = `${stroke.toFixed(1)}px`;
        if (globalSizeValue) globalSizeValue.textContent = `${size}px`;
        if (globalColorChip) globalColorChip.style.backgroundColor = color;

        // Apply dynamically to document and gallery
        document.documentElement.style.setProperty("--global-icon-color", color);
        document.documentElement.style.setProperty("--global-stroke-width", `${stroke}px`);
        document.documentElement.style.setProperty("--global-icon-size", `${size}px`);

        const isChanged = color.toLowerCase() !== "#ffffff" || stroke !== 2 || size !== 24;
        if (resetGlobalCustomization) {
            resetGlobalCustomization.disabled = !isChanged;
        }

        // Apply to thumbnail preview tiles in gallery
        document.querySelectorAll(".home-project-preview img").forEach(img => {
            img.style.width = `${size}px`;
            img.style.height = `${size}px`;
        });

        if (save) {
            try {
                localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify({ color, stroke, size }));
            } catch (e) {
                console.warn("Could not save global customization:", e);
            }
        }
    }

    [globalIconColor, globalStrokeWidth, globalIconSize].forEach(input => {
        input?.addEventListener("input", () => updateGlobalCustomizationState(true));
    });

    resetGlobalCustomization?.addEventListener("click", () => {
        if (globalIconColor) globalIconColor.value = "#ffffff";
        if (globalStrokeWidth) globalStrokeWidth.value = 2;
        if (globalIconSize) globalIconSize.value = 24;

        updateGlobalCustomizationState(true);

        resetGlobalCustomization.classList.remove("is-rotating");
        void resetGlobalCustomization.offsetWidth;
        resetGlobalCustomization.classList.add("is-rotating");

        showToast("Global preview reset to defaults", "info");
    });

    // Restore Global Customization
    try {
        const savedCustomization = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
        if (savedCustomization) {
            const parsed = JSON.parse(savedCustomization);
            if (globalIconColor && parsed.color) globalIconColor.value = parsed.color;
            if (globalStrokeWidth && parsed.stroke) globalStrokeWidth.value = parsed.stroke;
            if (globalIconSize && parsed.size) globalIconSize.value = parsed.size;
        }
    } catch (e) {
        console.warn("Error restoring global customization:", e);
    }
    updateGlobalCustomizationState(false);

    // ========================================================================
    // 6. PROJECT SERIALIZATION & MULTI-PROJECT STORAGE
    // ========================================================================
    function getProjectData() {
        return {
            version: PROJECT_FORMAT_VERSION,
            savedAt: new Date().toISOString(),
            selectedShapeIndex: shapes.indexOf(selectedShape),
            settings: {
                showCoordinates: showCoordinatesCheckbox?.checked ?? false,
                showGridHighlight: gridHighlightToggle?.checked ?? false,
                pathStyle: pathStyleToggle?.checked ? "curve" : "straight"
            },
            shapes: shapes.map(shape => {
                const data = {};
                Object.keys(shape).forEach(key => {
                    if (!shapeDOMKeys.has(key)) {
                        data[key] = structuredClone(shape[key]);
                    }
                });
                return data;
            })
        };
    }

    function createProject(data = null) {
        return {
            id: crypto.randomUUID(),
            name: "Untitled project",
            status: "unfinished",
            category: "General",
            favorite: false,
            createdAt: new Date().toISOString(),
            savedAt: new Date().toISOString(),
            data: data || null
        };
    }

    function loadProjectManager() {
        try {
            const savedManager = localStorage.getItem(PROJECTS_STORAGE_KEY);
            if (savedManager) {
                projectManager = JSON.parse(savedManager);
                return;
            }

            // Migrate legacy single-project save if exists
            const oldSave = localStorage.getItem(PROJECT_STORAGE_KEY);
            const firstProject = createProject(oldSave ? JSON.parse(oldSave) : null);
            projectManager = {
                activeProjectId: firstProject.id,
                projects: [firstProject]
            };
            saveProjectManager();
        } catch (error) {
            console.error("Could not load projects:", error);
            projectManager = { activeProjectId: null, projects: [] };
        }
    }

    function saveProjectManager() {
        try {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectManager));
            setSaveStatus(true);
            updateProjectCounters();
        } catch (error) {
            console.error("Could not save projects:", error);
            showToast("Failed to save to local storage", "error");
        }
    }


    function getActiveProject() {
        return projectManager.projects.find(
            project => project.id === projectManager.activeProjectId
        ) || null;
    }



    function saveProjectToBrowser() {
        if (isRestoringProject) return;

        try {
            let activeProject = projectManager.projects.find(p => p.id === projectManager.activeProjectId);
            if (!activeProject) {
                activeProject = createProject();
                projectManager.projects.push(activeProject);
                projectManager.activeProjectId = activeProject.id;
            }

            activeProject.data = getProjectData();
            activeProject.savedAt = new Date().toISOString();

            if (activeProject.status === "finished") {
                activeProject.thumbnail = generateSVG(
                    activeProject.finishStrokeColor === "white" ? "white" : "original"
                );
            }

            saveProjectManager();
            setSaveStatus(true);
        } catch (error) {
            console.error("Could not autosave project:", error);
        }
    }

    function updateActiveProjectNameDisplay() {
        const activeProject = projectManager.projects.find(p => p.id === projectManager.activeProjectId);
        if (activeProjectNameLabel) {
            activeProjectNameLabel.textContent = activeProject?.name || "Untitled project";
        }
    }

    function updateProjectCounters() {
        const finishedCount = projectManager.projects.filter(p => p.status === "finished").length;
        const favCount = projectManager.projects.filter(p => p.status === "finished" && p.favorite).length;

        if (tabCountAll) tabCountAll.textContent = finishedCount;
        if (tabCountFav) tabCountFav.textContent = favCount;
        if (sidebarProjectsCount) sidebarProjectsCount.textContent = projectManager.projects.length;
    }

    function createNewProject() {
        saveProjectToBrowser();

        const newProject = createProject({
            version: PROJECT_FORMAT_VERSION,
            savedAt: new Date().toISOString(),
            selectedShapeIndex: -1,
            settings: {
                showCoordinates: false,
                showGridHighlight: false,
                pathStyle: "straight"
            },
            shapes: []
        });

        projectManager.projects.push(newProject);
        projectManager.activeProjectId = newProject.id;
        saveProjectManager();

        restoreProjectFromBrowser();
        resetProjectHistory();
        renderUnfinishedProjects();
        updateActiveProjectNameDisplay();

        showToast("New icon project started", "info");
    }

    function switchProject(projectId, saveCurrent = true) {
        const target = projectManager.projects.find(p => p.id === projectId);
        if (!target) return false;

        if (saveCurrent) {
            saveProjectToBrowser();
        }
        projectManager.activeProjectId = projectId;
        saveProjectManager();

        const restored = restoreProjectFromBrowser();
        if (!restored) {
            console.error("Failed restoring project:", target);
            return false;
        }

        resetProjectHistory();
        renderUnfinishedProjects();
        updateActiveProjectNameDisplay();

        showToast(`Loaded "${target.name}"`, "info");
        return true;
    }

    function downloadProjectFile() {
        try {
            const exportData = {
                exportedAt: new Date().toISOString(),
                version: PROJECT_FORMAT_VERSION,
                projectManager: projectManager
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: "application/json;charset=utf-8"
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `icon-maker-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            showToast("Backup file downloaded", "success");
        } catch (e) {
            console.error("Export backup failed:", e);
            showToast("Could not export backup", "error");
        }
    }

    function restoreProjectFromBrowser() {
        const activeProject = projectManager.projects.find(p => p.id === projectManager.activeProjectId);
        if (!activeProject || !activeProject.data) return false;

        try {
            const projectData = activeProject.data;

            // Restore editor settings
            if (projectData.settings) {
                if (showCoordinatesCheckbox) {
                    showCoordinatesCheckbox.checked = projectData.settings.showCoordinates ?? false;
                    coordinateLabels.style.display = showCoordinatesCheckbox.checked ? "inline" : "none";
                }
                if (gridHighlightToggle) {
                    gridHighlightToggle.checked = projectData.settings.showGridHighlight ?? false;
                }
                if (pathStyleToggle) {
                    pathStyleToggle.checked = (projectData.settings.pathStyle ?? "straight") === "curve";
                }
                if (gridHoverMarker) gridHoverMarker.style.display = "none";
            }

            if (projectData.version !== PROJECT_FORMAT_VERSION || !Array.isArray(projectData.shapes)) {
                throw new Error("Invalid project data schema.");
            }

            isRestoringProject = true;

            // Clean up existing workspace
            shapes.forEach(shape => {
                getShapeElements(shape).forEach(el => el.remove());
                shape.handles?.forEach(h => h.remove());
            });

            shapes = [];
            selectedShape = null;
            selectedShapes = [];

            // Reconstruct shape objects and SVG elements
            projectData.shapes.forEach(data => {
                const shape = createShapeFromCopy(data);
                if (shape) {
                    getShapeElements(shape).forEach(el => {
                        el.style.visibility = shape.hidden ? "hidden" : "visible";
                    });
                }
            });

            // Restore selection
            const savedIndex = projectData.selectedShapeIndex;
            if (Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < shapes.length && !shapes[savedIndex].hidden) {
                selectShape(shapes[savedIndex]);
            } else {
                selectShape(null);
            }

            updateMeasurementPanel();
            updatePropertiesPanel();
            renderLayers();
            updateSVGSource();
            updateActiveProjectNameDisplay();

            isRestoringProject = false;
            return true;
        } catch (error) {
            isRestoringProject = false;
            console.error("Could not restore project:", error);
            return false;
        }
    }

    // ========================================================================
    // 7. UNDO / REDO HISTORY SYSTEM
    // ========================================================================
    function cloneHistoryValue(value) {
        return structuredClone(value);
    }

    function getHistorySnapshot() {
        return {
            shapes: shapes.map(shape => {
                const data = {};
                Object.keys(shape).forEach(key => {
                    if (shapeDOMKeys.has(key)) return;
                    data[key] = cloneHistoryValue(shape[key]);
                });
                return { shape, data };
            }),
            selectedShape,
            selectedShapes: [...selectedShapes]
        };
    }

    function getHistoryKey(snapshot) {
        return JSON.stringify({
            shapes: snapshot.shapes.map(item => item.data),
            selectedShape: snapshot.shapes.findIndex(item => item.shape === snapshot.selectedShape),
            selectedShapes: snapshot.selectedShapes.map(shape => snapshot.shapes.findIndex(item => item.shape === shape))
        });
    }

    function updateHistoryButtons() {
        if (undoButton) undoButton.disabled = historyIndex <= 0;
        if (redoButton) redoButton.disabled = historyIndex >= history.length - 1;
    }

    function resetProjectHistory() {
        history = [getHistorySnapshot()];
        historyIndex = 0;
        updateHistoryButtons();
    }

    function beginHistoryAction() {
        if (historyBeforeAction) return;
        historyBeforeAction = getHistorySnapshot();
    }

    function commitHistoryAction() {
        if (!historyBeforeAction) return;

        const before = historyBeforeAction;
        const after = getHistorySnapshot();
        historyBeforeAction = null;

        if (getHistoryKey(before) === getHistoryKey(after)) {
            saveProjectToBrowser();
            updateHistoryButtons();
            return;
        }

        history = history.slice(0, historyIndex + 1);
        history.push(after);

        if (history.length > HISTORY_LIMIT) {
            history.shift();
        }

        historyIndex = history.length - 1;

        saveProjectToBrowser();
        updateHistoryButtons();
        setSaveStatus(false);
    }

    function restoreHistorySnapshot(snapshot) {
        // 1. Remove current SVG elements & handles
        shapes.forEach(shape => {
            getShapeElements(shape).forEach(el => el.remove());
            shape.handles?.forEach(h => h.remove());
        });

        // 2. Restore saved shape data
        snapshot.shapes.forEach(item => {
            Object.keys(item.shape).forEach(key => {
                if (!shapeDOMKeys.has(key)) delete item.shape[key];
            });
            Object.assign(item.shape, cloneHistoryValue(item.data));
        });

        // 3. Restore order
        shapes.length = 0;
        snapshot.shapes.forEach(item => shapes.push(item.shape));

        // 4. Re-append SVG elements
        shapes.forEach(shape => {
            getShapeElements(shape).forEach(el => {
                workspace.appendChild(el);
                el.style.visibility = shape.hidden ? "hidden" : "visible";
            });

            if (shape.element && shape.color) {
                shape.element.setAttribute("stroke", shape.color);
            }
        });

        // 5. Restore selection
        selectedShape = snapshot.selectedShape;
        selectedShapes.length = 0;
        selectedShapes.push(...snapshot.selectedShapes);

        shapes.forEach(shape => {
            if (shape.element) {
                shape.element.classList.toggle("is-selected", shape === selectedShape || selectedShapes.includes(shape));
            }
        });

        // 6. Restore geometry updates
        shapes.forEach(shape => {
            if (shape.type === "line") updateLine(shape);
            else if (shape.type === "curve") updateCurve(shape);
            else if (shape.type === "path") updatePathShape(shape);
            else updateBasicShape(shape);
        });

        // 7. Restore handles for selected shapes
        if (selectedShape && !selectedShape.hidden && !selectedShape.locked) {
            createHandlesForShape(selectedShape);
        }

        hideAlignmentGuides();
        updateMeasurementPanel();
        updatePropertiesPanel();
        renderLayers();
        updateSVGSource();
        bringHandlesToFront();
    }

    function undoAction() {
        if (historyIndex <= 0) return;
        historyIndex--;
        restoreHistorySnapshot(history[historyIndex]);
        updateHistoryButtons();
        showToast("Undo", "info");
    }

    function redoAction() {
        if (historyIndex >= history.length - 1) return;
        historyIndex++;
        restoreHistorySnapshot(history[historyIndex]);
        updateHistoryButtons();
        showToast("Redo", "info");
    }

    undoButton?.addEventListener("click", undoAction);
    redoButton?.addEventListener("click", redoAction);


    // ========================================================================
    // W3C SVG 1.1 APPENDIX F.6 EXACT ARC CONVERSION & REFLECTION MATHEMATICS
    // ========================================================================
    function arcEndpointToCenter(x1, y1, rx, ry, phiDeg, largeArc, sweep, x2, y2) {
        const phi = (phiDeg || 0) * Math.PI / 180;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const dx2 = (x1 - x2) / 2;
        const dy2 = (y1 - y2) / 2;

        const x1p = cosPhi * dx2 + sinPhi * dy2;
        const y1p = -sinPhi * dx2 + cosPhi * dy2;

        let rxSq = rx * rx;
        let rySq = ry * ry;
        const x1pSq = x1p * x1p;
        const y1pSq = y1p * y1p;

        const radiiCheck = x1pSq / rxSq + y1pSq / rySq;
        if (radiiCheck > 1) {
            const scale = Math.sqrt(radiiCheck);
            rx *= scale;
            ry *= scale;
            rxSq = rx * rx;
            rySq = ry * ry;
        }

        const sign = (largeArc === sweep) ? -1 : 1;
        const numerator = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
        const denominator = rxSq * y1pSq + rySq * x1pSq;
        const sq = Math.max(0, numerator / (denominator || 1));
        const coef = sign * Math.sqrt(sq);

        const cxp = coef * (rx * y1p / ry);
        const cyp = coef * -(ry * x1p / rx);

        const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
        const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

        function vectorAngle(ux, uy, vx, vy) {
            const dot = ux * vx + uy * vy;
            const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
            let ang = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
            if (ux * vy - uy * vx < 0) ang = -ang;
            return ang;
        }

        const vx1 = (x1p - cxp) / rx;
        const vy1 = (y1p - cyp) / ry;
        const vx2 = (-x1p - cxp) / rx;
        const vy2 = (-y1p - cyp) / ry;

        let startAngle = vectorAngle(1, 0, vx1, vy1);
        let deltaAngle = vectorAngle(vx1, vy1, vx2, vy2);

        if (!sweep && deltaAngle > 0) {
            deltaAngle -= 2 * Math.PI;
        } else if (sweep && deltaAngle < 0) {
            deltaAngle += 2 * Math.PI;
        }

        let endAngle = startAngle + deltaAngle;

        return { cx, cy, rx, ry, startAngle, endAngle, sweep, largeArc };
    }

    function arcCenterToEndpoints(cx, cy, r, startAngle, endAngle, sweep = 1) {
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);

        let delta = endAngle - startAngle;
        if (sweep) {
            while (delta < 0) delta += 2 * Math.PI;
            while (delta >= 2 * Math.PI) delta -= 2 * Math.PI;
        } else {
            while (delta > 0) delta -= 2 * Math.PI;
            while (delta <= -2 * Math.PI) delta += 2 * Math.PI;
        }

        const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
        return { x1, y1, x2, y2, largeArc, sweep };
    }

    function reflectPointAcrossLine(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { x: px, y: py };

        const vx = px - x1;
        const vy = py - y1;
        const t = (vx * dx + vy * dy) / lenSq;
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return {
            x: Math.round((2 * projX - px) * 1000) / 1000,
            y: Math.round((2 * projY - py) * 1000) / 1000
        };
    }

    // ========================================================================
    // 8. COORDINATE MAPPING, ZOOM & PAN
    // ========================================================================
    function getSVGPosition(event) {
        const point = workspace.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;

        const currentSize = artboardSize || 24;
        const svgPoint = point.matrixTransform(workspace.getScreenCTM().inverse());
        return {
            x: Math.max(0, Math.min(currentSize, svgPoint.x)),
            y: Math.max(0, Math.min(currentSize, svgPoint.y))
        };
    }

    function updateWorkspaceZoom() {
        const currentSize = artboardSize || 24;
        const viewSize = currentSize / zoomLevel;
        const maxPan = currentSize - viewSize;

        panX = Math.max(0, Math.min(maxPan, panX));
        panY = Math.max(0, Math.min(maxPan, panY));

        workspace.setAttribute("viewBox", `${panX} ${panY} ${viewSize} ${viewSize}`);
        const zoomText = `${Math.round(zoomLevel * 100)}%`;
        if (zoomLevelText) zoomLevelText.textContent = zoomText;
        if (floatZoomLevel) floatZoomLevel.textContent = zoomText;

        // Toggle subtle dot matrix: show when zoom >= 200%, hide when < 200%
        if (dotGridBg) {
            dotGridBg.style.display = (zoomLevel >= 2 && currentGridDisplayMode === "full") ? "block" : "none";
        }
    }

    function setArtboardSize(size, saveHistory = true) {
        if (size !== 24 && size !== 32) size = 24;
        artboardSize = size;

        // Update selector UI buttons
        artboardSizeButtons.forEach(btn => {
            btn.classList.toggle("active", Number(btn.dataset.size) === size);
        });

        // Update workspace label
        if (workspaceDimenLabel) {
            workspaceDimenLabel.textContent = `${size} × ${size} px`;
        }

        // Update guidelines dimensions & center axes
        const minorRect = document.getElementById("minor-grid-rect");
        const majorRect = document.getElementById("major-grid-rect");
        if (minorRect) { minorRect.setAttribute("width", size); minorRect.setAttribute("height", size); }
        if (majorRect) { majorRect.setAttribute("width", size); majorRect.setAttribute("height", size); }

        const half = size / 2;
        const vLine = document.getElementById("guide-vertical-center");
        const hLine = document.getElementById("guide-horizontal-center");
        if (vLine) {
            vLine.setAttribute("x1", half); vLine.setAttribute("x2", half);
            vLine.setAttribute("y1", 0); vLine.setAttribute("y2", size);
        }
        if (hLine) {
            hLine.setAttribute("x1", 0); hLine.setAttribute("x2", size);
            hLine.setAttribute("y1", half); hLine.setAttribute("y2", half);
        }

        // Safe Area Rect: 20x20 inside 24x24 / 28x28 inside 32x32 (inset by 2 units)
        if (safeAreaRect) {
            const inset = 2;
            const safeDim = size - inset * 2;
            safeAreaRect.setAttribute("x", inset);
            safeAreaRect.setAttribute("y", inset);
            safeAreaRect.setAttribute("width", safeDim);
            safeAreaRect.setAttribute("height", safeDim);
        }

        // Update coordinate labels (0, 4, 8, 12, 16, 20, 24, 28, 32)
        if (coordinateLabels) {
            let labelsHtml = "";
            for (let i = 0; i <= size; i += 4) {
                const xPos = i === 0 ? 0.5 : (i === size ? size - 0.5 : i);
                labelsHtml += `<text x="${xPos}" y="0.65">${i}</text>`;
                if (i > 0) {
                    const yPos = i === size ? size - 0.5 : i + 0.2;
                    labelsHtml += `<text x="0.55" y="${yPos}">${i}</text>`;
                }
            }
            coordinateLabels.innerHTML = labelsHtml;
        }

        // Save artboardSize to active project
        const activeProj = getActiveProject();
        if (activeProj) {
            if (!activeProj.data) activeProj.data = {};
            if (!activeProj.data.settings) activeProj.data.settings = {};
            activeProj.data.settings.artboardSize = size;
            saveProjectToBrowser();
        }

        updateWorkspaceZoom();
        updateSVGSource();

        if (saveHistory) {
            commitHistoryAction();
            showToast(`Workspace set to ${size}×${size}px`, "info");
        }
    }

    function setGridDisplayMode(mode) {
        currentGridDisplayMode = mode;
        if (gridModeSelect) gridModeSelect.value = mode;

        const minorRect = document.getElementById("minor-grid-rect");
        const majorRect = document.getElementById("major-grid-rect");
        const vLine = document.getElementById("guide-vertical-center");
        const hLine = document.getElementById("guide-horizontal-center");

        if (mode === "clean") {
            if (workspaceGuidelines) workspaceGuidelines.style.display = "none";
            if (coordinateLabels) coordinateLabels.style.display = "none";
            if (safeAreaRect) safeAreaRect.style.display = "none";
            if (dotGridBg) dotGridBg.style.display = "none";
        } else if (mode === "keyframe") {
            if (workspaceGuidelines) workspaceGuidelines.style.display = "block";
            if (minorRect) minorRect.style.display = "none";
            if (majorRect) majorRect.style.display = "none";
            if (vLine) vLine.style.display = "block";
            if (hLine) hLine.style.display = "block";
            if (safeAreaRect) safeAreaRect.style.display = showSafeAreaCheckbox?.checked ? "block" : "none";
            if (coordinateLabels) coordinateLabels.style.display = showCoordinatesCheckbox?.checked ? "block" : "none";
            if (dotGridBg) dotGridBg.style.display = "none";
        } else { // "full"
            if (workspaceGuidelines) workspaceGuidelines.style.display = "block";
            if (minorRect) minorRect.style.display = "block";
            if (majorRect) majorRect.style.display = "block";
            if (vLine) vLine.style.display = "block";
            if (hLine) hLine.style.display = "block";
            if (safeAreaRect) safeAreaRect.style.display = showSafeAreaCheckbox?.checked ? "block" : "none";
            if (coordinateLabels) coordinateLabels.style.display = showCoordinatesCheckbox?.checked ? "block" : "none";
            if (dotGridBg) dotGridBg.style.display = zoomLevel >= 2 ? "block" : "none";
        }
    }

    artboardSizeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const size = Number(btn.dataset.size);
            if (size && size !== artboardSize) {
                setArtboardSize(size, true);
            }
        });
    });

    showSafeAreaCheckbox?.addEventListener("change", () => {
        if (safeAreaRect) {
            safeAreaRect.style.display = showSafeAreaCheckbox.checked ? "block" : "none";
        }
    });

    gridModeSelect?.addEventListener("change", () => {
        setGridDisplayMode(gridModeSelect.value);
    });

    [zoomInButton, floatZoomIn].forEach(btn => {
        btn?.addEventListener("click", () => {
            zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
            updateWorkspaceZoom();
        });
    });

    [zoomOutButton, floatZoomOut].forEach(btn => {
        btn?.addEventListener("click", () => {
            zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
            updateWorkspaceZoom();
        });
    });

    [zoomResetButton, floatZoomLevel, floatZoomResetButton].forEach(btn => {
        btn?.addEventListener("click", () => {
            zoomLevel = 1;
            panX = 0;
            panY = 0;
            updateWorkspaceZoom();
        });
    });

    // Panning & Wheel Zoom (Ctrl + Wheel or Alt + Wheel)
    workspaceContainer?.addEventListener("wheel", event => {
        if (event.ctrlKey || event.altKey) {
            event.preventDefault();
            const zoomFactor = Math.exp(-event.deltaY * 0.005);
            zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * zoomFactor));
            updateWorkspaceZoom();
            return;
        }

        if (zoomLevel <= 1 || event.deltaMode !== 0) return;
        event.preventDefault();

        const currentSize = artboardSize || 24;
        const viewSize = currentSize / zoomLevel;
        const rect = workspace.getBoundingClientRect();
        panX += event.deltaX * (viewSize / rect.width);
        panY += event.deltaY * (viewSize / rect.height);
        updateWorkspaceZoom();
    }, { passive: false });

    // ========================================================================
    // 9. TOOL DRAG & DROP AND WORKSPACE CREATION
    // ========================================================================
    tools.forEach(tool => {
        tool.addEventListener("dragstart", event => {
            draggingTool = tool.dataset.tool;
            event.dataTransfer.setData("text/plain", draggingTool);
        });

        tool.addEventListener("dragend", () => {
            draggingTool = null;
            if (dropPreview) {
                dropPreview.remove();
                dropPreview = null;
            }
        });
    });

    workspace.addEventListener("dragover", event => {
        event.preventDefault();
        if (!draggingTool) return;
        const pos = getSVGPosition(event);
        updateDropPreview(pos.x, pos.y);
    });

    workspace.addEventListener("dragleave", event => {
        if (!workspace.contains(event.relatedTarget)) {
            if (dropPreview) {
                dropPreview.remove();
                dropPreview = null;
            }
        }
    });

    function updateDropPreview(x, y) {
        if (dropPreview) {
            dropPreview.remove();
            dropPreview = null;
        }

        const previewColor = "#83B5FF";

        if (draggingTool === "line") {
            dropPreview = document.createElementNS(SVG_NS, "line");
            dropPreview.setAttribute("x1", Math.max(0, x - 3));
            dropPreview.setAttribute("y1", y);
            dropPreview.setAttribute("x2", Math.min(24, x + 3));
            dropPreview.setAttribute("y2", y);
        } else if (draggingTool === "curve") {
            dropPreview = document.createElementNS(SVG_NS, "path");
            dropPreview.setAttribute("d", `M ${Math.max(0, x - 3)} ${y} A 3 3 0 0 1 ${Math.min(24, x + 3)} ${y}`);
            dropPreview.setAttribute("fill", "none");
        } else if (draggingTool === "circle") {
            dropPreview = document.createElementNS(SVG_NS, "circle");
            dropPreview.setAttribute("cx", x);
            dropPreview.setAttribute("cy", y);
            dropPreview.setAttribute("r", "2.5");
            dropPreview.setAttribute("fill", "none");
        } else if (draggingTool === "ellipse") {
            dropPreview = document.createElementNS(SVG_NS, "ellipse");
            dropPreview.setAttribute("cx", x);
            dropPreview.setAttribute("cy", y);
            dropPreview.setAttribute("rx", "3");
            dropPreview.setAttribute("ry", "2");
            dropPreview.setAttribute("fill", "none");
        } else if (draggingTool === "ellipse-arc") {
            dropPreview = document.createElementNS(SVG_NS, "path");

            dropPreview.setAttribute(
                "d",
                `M ${x - 3} ${y} A 3 2 0 0 1 ${x + 3} ${y}`
            );

            dropPreview.setAttribute("fill", "none");
        } else if (draggingTool === "rectangle") {
            dropPreview = document.createElementNS(SVG_NS, "rect");
            dropPreview.setAttribute("x", Math.max(0, x - 2.5));
            dropPreview.setAttribute("y", Math.max(0, y - 2));
            dropPreview.setAttribute("width", "5");
            dropPreview.setAttribute("height", "4");
            dropPreview.setAttribute("fill", "none");
        }

        if (!dropPreview) return;

        dropPreview.setAttribute("stroke", previewColor);
        dropPreview.setAttribute("stroke-width", "1.2");
        dropPreview.setAttribute("stroke-linecap", "round");
        dropPreview.setAttribute("stroke-linejoin", "round");
        dropPreview.setAttribute("stroke-dasharray", "0.65 0.35");
        dropPreview.setAttribute("opacity", "0.95");
        dropPreview.setAttribute("pointer-events", "none");
        dropPreview.classList.add("drop-preview");

        workspace.appendChild(dropPreview);
        bringHandlesToFront();
    }

    workspace.addEventListener("drop", event => {
        event.preventDefault();
        beginHistoryAction();

        const type = event.dataTransfer.getData("text/plain") || draggingTool;
        const position = getSVGPosition(event);

        if (dropPreview) {
            dropPreview.remove();
            dropPreview = null;
        }

        if (type === "cutout") {
            if (!selectedShape || selectedShape.type !== "path" || selectedShape.locked || selectedShape.hidden) {
                showToast("Select a path shape first to cut out a hole", "error");
                return;
            }

            const preview = document.createElementNS(SVG_NS, "path");
            preview.setAttribute("fill", "none");
            preview.setAttribute("stroke", "#F472B6");
            preview.setAttribute("stroke-width", "0.08");
            preview.setAttribute("stroke-dasharray", "0.4 0.2");
            preview.setAttribute("stroke-linecap", "round");
            preview.setAttribute("stroke-linejoin", "round");
            preview.style.pointerEvents = "none";
            workspace.appendChild(preview);

            pathDrawing = {
                mode: "cutout",
                shape: selectedShape,
                points: [position],
                curved: false,
                preview: preview
            };

            showToast("Click points to cut out hole. Press Enter to finish.", "info");
        } else if (type === "path") {
            const preview = document.createElementNS(SVG_NS, "path");
            preview.setAttribute("fill", "none");
            preview.setAttribute("stroke", "#A78BFA");
            preview.setAttribute("stroke-width", "0.15");
            preview.setAttribute("stroke-linecap", "round");
            preview.setAttribute("stroke-linejoin", "round");
            preview.style.pointerEvents = "none";
            workspace.appendChild(preview);

            pathDrawing = {
                mode: "path",
                points: [position],
                curved: pathStyleToggle?.checked ?? false,
                preview: preview
            };

            selectShape(null);
            showToast("Click to place vertices. Press Enter to complete.", "info");
        } else if (type === "line") {
            createLine(position.x, position.y);
        } else if (type === "curve") {
            createCurve(position.x, position.y);
        } else {
            createOtherShape(type, position.x, position.y);
        }

        draggingTool = null;

        if (!pathDrawing) {
            commitHistoryAction();
        }
    });

    // ========================================================================
    // 10. SHAPE FACTORIES (LINE, CURVE, CIRCLE, RECTANGLE, PATH)
    // ========================================================================
    let isApplyingLiveSymmetry = false;
    function applyLiveSymmetry(sourceShape) {
        if (isApplyingLiveSymmetry) return;
        if (!liveSymmetryH && !liveSymmetryV) return;

        isApplyingLiveSymmetry = true;
        try {
            const modes = [];
            if (liveSymmetryV) modes.push("v");
            if (liveSymmetryH) modes.push("h");
            if (liveSymmetryH && liveSymmetryV) modes.push("vh");

            modes.forEach(mode => {
                const data = {};
                Object.keys(sourceShape).forEach(k => {
                    if (!shapeDOMKeys.has(k)) data[k] = structuredClone(sourceShape[k]);
                });

                if (mode.includes("v")) {
                    if (data.type === "line") {
                        data.x1 = artboardSize - data.x1;
                        data.x2 = artboardSize - data.x2;
                    } else if (data.type === "curve" || data.type === "circle") {
                        data.cx = artboardSize - data.cx;
                        if (data.type === "curve") {
                            data.startAngle = Math.PI - data.startAngle;
                            data.endAngle = Math.PI - data.endAngle;
                        }
                    } else if (data.type === "rectangle") {
                        data.x = artboardSize - (data.x + data.width);
                    } else if (data.type === "path") {
                        data.points = (data.points || []).map(p => ({ x: artboardSize - p.x, y: p.y }));
                        data.holes = (data.holes || []).map(h => {
                            const pts = Array.isArray(h) ? h : h.points;
                            const mapped = pts.map(p => ({ x: artboardSize - p.x, y: p.y }));
                            return Array.isArray(h) ? mapped : { ...h, points: mapped };
                        });
                    }
                }

                if (mode.includes("h")) {
                    if (data.type === "line") {
                        data.y1 = artboardSize - data.y1;
                        data.y2 = artboardSize - data.y2;
                    } else if (data.type === "curve" || data.type === "circle") {
                        data.cy = artboardSize - data.cy;
                        if (data.type === "curve") {
                            data.startAngle = -data.startAngle;
                            data.endAngle = -data.endAngle;
                        }
                    } else if (data.type === "rectangle") {
                        data.y = artboardSize - (data.y + data.height);
                    } else if (data.type === "path") {
                        data.points = (data.points || []).map(p => ({ x: p.x, y: artboardSize - p.y }));
                        data.holes = (data.holes || []).map(h => {
                            const pts = Array.isArray(h) ? h : h.points;
                            const mapped = pts.map(p => ({ x: p.x, y: artboardSize - p.y }));
                            return Array.isArray(h) ? mapped : { ...h, points: mapped };
                        });
                    }
                }

                data.name = `${sourceShape.name || sourceShape.type} (Symmetry)`;
                createShapeFromCopy(data);
            });
        } finally {
            isApplyingLiveSymmetry = false;
        }
    }

    function getShapeElements(shape) {
        if (shape.type === "line") {
            return [shape.hoverBg, shape.element, shape.guideBg, shape.guide, shape.hitLine].filter(Boolean);
        }
        if (shape.type === "curve") {
            return [shape.element, shape.guideBg, shape.guide, shape.hitPath, shape.horizontalGuide, shape.angleGuide].filter(Boolean);
        }
        if (shape.type === "path") {
            return [shape.element, shape.strokeElement].filter(Boolean);
        }
        return [shape.element].filter(Boolean);
    }

    function createLine(x, y) {
        const color = getNextColor("line");

        const hoverBg = document.createElementNS(SVG_NS, "line");
        const line = document.createElementNS(SVG_NS, "line");
        line.classList.add("svg-artwork");
        const hitLine = document.createElementNS(SVG_NS, "line");
        const guideBg = document.createElementNS(SVG_NS, "line");
        const guide = document.createElementNS(SVG_NS, "line");
        const horizontalGuide = document.createElementNS(SVG_NS, "line");
        const verticalGuide = document.createElementNS(SVG_NS, "line");
        const alignedGuide = document.createElementNS(SVG_NS, "line");
        const perpendicularGuide = document.createElementNS(SVG_NS, "line");

        const shape = {
            type: "line",
            name: "Line",
            x1: Math.max(0, x - 3),
            y1: y,
            x2: Math.min(artboardSize, x + 3),
            y2: y,
            width: 2,
            cap: "round",
            color: color,
            hidden: false,
            locked: false,
            element: line,
            hoverBg: hoverBg,
            guideBg: guideBg,
            guide: guide,
            hitLine: hitLine,
            handles: [],
            horizontalGuide: horizontalGuide,
            alignedGuide: alignedGuide,
            perpendicularGuide: perpendicularGuide,
            verticalGuide: verticalGuide
        };
        [
            horizontalGuide,
            verticalGuide,
            alignedGuide,
            perpendicularGuide
        ].forEach(el => {
            el.setAttribute("stroke", "#FBBF24");
            el.setAttribute("stroke-width", "0.12");
            el.setAttribute("stroke-dasharray", "0.4 0.3");
            el.setAttribute("fill", "none");
            el.setAttribute("pointer-events", "none");
            el.style.display = "none";
        });

        hoverBg.setAttribute("stroke", "#60A5FA");
        hoverBg.setAttribute("stroke-width", "1.5");
        hoverBg.setAttribute("stroke-linecap", "round");
        hoverBg.setAttribute("opacity", "0.7");
        hoverBg.setAttribute("pointer-events", "none");
        hoverBg.style.display = "none";

        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", shape.width);
        line.setAttribute("stroke-linecap", shape.cap);
        line.setAttribute("pointer-events", "none");

        hitLine.classList.add("line-hit-area");
        hitLine.setAttribute("stroke", "transparent");
        hitLine.setAttribute("stroke-width", "1.2");
        hitLine.setAttribute("stroke-linecap", "round");
        hitLine.setAttribute("pointer-events", "stroke");
        hitLine.style.cursor = "move";

        guideBg.setAttribute("stroke", "#475569");
        guideBg.setAttribute("stroke-width", "0.8");
        guideBg.setAttribute("stroke-linecap", "round");
        guideBg.setAttribute("pointer-events", "none");
        guideBg.style.display = "none";

        guide.setAttribute("stroke", "#FFFFFF");
        guide.setAttribute("stroke-width", "0.12");
        guide.setAttribute("stroke-dasharray", "0.35 0.25");
        guide.setAttribute("pointer-events", "none");

        hitLine.addEventListener("pointerenter", () => {
            hoverBg.style.display = "block";
            guideBg.style.display = "block";

            // Fixed guides
            horizontalGuide.style.display = "block";
            verticalGuide.style.display = "block";

            // Rotating guides
            alignedGuide.style.display = "block";
            perpendicularGuide.style.display = "block";
        });

        hitLine.addEventListener("pointerleave", () => {
            hoverBg.style.display = "none";
            guideBg.style.display = "none";

            // Fixed guides
            horizontalGuide.style.display = "none";
            verticalGuide.style.display = "none";

            // Rotating guides
            alignedGuide.style.display = "none";
            perpendicularGuide.style.display = "none";
        });
        workspace.appendChild(horizontalGuide);
        workspace.appendChild(verticalGuide);
        workspace.appendChild(hoverBg);
        workspace.appendChild(line);
        workspace.appendChild(guideBg);
        workspace.appendChild(guide);
        workspace.appendChild(hitLine);
        workspace.appendChild(alignedGuide);
        workspace.appendChild(perpendicularGuide);

        shapes.push(shape);
        updateLine(shape);
        selectShape(shape);
        applyLiveSymmetry(shape);
        return shape;
    }

    function createCurve(x, y) {
        const color = getNextColor("curve");

        // Existing elements
        const horizontalGuide = document.createElementNS(SVG_NS, "line");
        const angleGuide = document.createElementNS(SVG_NS, "line");
        const path = document.createElementNS(SVG_NS, "path");
        const hitPath = document.createElementNS(SVG_NS, "path");
        const guideBg = document.createElementNS(SVG_NS, "path");
        const guide = document.createElementNS(SVG_NS, "path");

        // NEW: Curve guides
        const circumferenceGuide = document.createElementNS(SVG_NS, "circle");
        const verticalGuide = document.createElementNS(SVG_NS, "line");
        const startRadialGuide = document.createElementNS(SVG_NS, "line");
        const endRadialGuide = document.createElementNS(SVG_NS, "line");

        const shape = {
            type: "curve",
            name: "Curve",
            cx: x,
            cy: y,
            radius: 3,
            startAngle: Math.PI,
            endAngle: 0,
            color: color,
            strokeWidth: 2,
            hidden: false,
            locked: false,

            element: path,
            hitPath: hitPath,
            guideBg: guideBg,
            guide: guide,
            handles: [],

            horizontalGuide: horizontalGuide,
            angleGuide: angleGuide,

            // NEW guide elements
            circumferenceGuide: circumferenceGuide,
            verticalGuide: verticalGuide,
            startRadialGuide: startRadialGuide,
            endRadialGuide: endRadialGuide,
        };

        // Hit area
        hitPath.setAttribute("fill", "none");
        hitPath.setAttribute("stroke", "transparent");
        hitPath.setAttribute("stroke-width", "3");
        hitPath.setAttribute("stroke-linecap", "round");
        hitPath.setAttribute("pointer-events", "stroke");
        hitPath.style.cursor = "move";

        // Main curve
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("pointer-events", "none");

        // Existing background guide
        guideBg.setAttribute("fill", "none");
        guideBg.setAttribute("stroke", "#334155");
        guideBg.setAttribute("stroke-width", "1.7");
        guideBg.setAttribute("stroke-linecap", "round");
        guideBg.setAttribute("pointer-events", "none");
        guideBg.style.display = "none";

        // Existing curve guide
        guide.setAttribute("fill", "none");
        guide.setAttribute("stroke", "#FFFFFF");
        guide.setAttribute("stroke-width", "0.12");
        guide.setAttribute("stroke-dasharray", "0.35 0.25");
        guide.setAttribute("pointer-events", "none");

        // Shared guide styling
        const styleGuide = (element, color = "#FBBF24", width = "0.12") => {
            element.setAttribute("stroke", color);
            element.setAttribute("stroke-width", width);
            element.setAttribute("stroke-dasharray", "0.4 0.3");
            element.setAttribute("fill", "none");
            element.setAttribute("pointer-events", "none");
            element.style.display = "none";
        };

        styleGuide(horizontalGuide);
        styleGuide(angleGuide);
        styleGuide(verticalGuide);
        styleGuide(startRadialGuide);
        styleGuide(endRadialGuide);

        // Full circumference
        circumferenceGuide.setAttribute("fill", "none");
        circumferenceGuide.setAttribute("stroke", "#94A3B8");
        circumferenceGuide.setAttribute("stroke-width", "0.12");
        circumferenceGuide.setAttribute("stroke-dasharray", "0.3 0.25");
        circumferenceGuide.setAttribute("pointer-events", "none");
        circumferenceGuide.style.display = "none";

        // Show guides when hovering over the curve
        function showCurveGuides() {
            [
                circumferenceGuide,
                horizontalGuide,
                verticalGuide,
                angleGuide,
                startRadialGuide,
                endRadialGuide
            ].forEach(el => el.style.display = "block");

            guideBg.style.display = "block";
        }

        function hideCurveGuides() {
            [
                circumferenceGuide,
                horizontalGuide,
                verticalGuide,
                angleGuide,
                startRadialGuide,
                endRadialGuide
            ].forEach(el => el.style.display = "none");

            guideBg.style.display = "none";
        }

        hitPath.addEventListener("pointerenter", showCurveGuides);
        hitPath.addEventListener("pointerleave", hideCurveGuides);

        // Add elements to workspace
        workspace.appendChild(circumferenceGuide);
        workspace.appendChild(horizontalGuide);
        workspace.appendChild(verticalGuide);
        workspace.appendChild(startRadialGuide);
        workspace.appendChild(endRadialGuide);
        workspace.appendChild(angleGuide);

        workspace.appendChild(path);
        workspace.appendChild(guideBg);
        workspace.appendChild(guide);
        workspace.appendChild(hitPath);

        shapes.push(shape);

        updateCurve(shape);
        selectShape(shape);
        applyLiveSymmetry(shape);

        return shape;
    }

    function createOtherShape(type, x, y) {
        if (type === "curve") return createCurve(x, y);

        const color = getNextColor(type);
        let element;
        const horizontalGuide = document.createElementNS(SVG_NS, "line");
        const verticalGuide = document.createElementNS(SVG_NS, "line");

        function styleHelperGuide(line) {
            line.setAttribute("stroke", "#FBBF24");
            line.setAttribute("stroke-width", "0.12");
            line.setAttribute("stroke-dasharray", "0.4 0.3");
            line.setAttribute("fill", "none");
            line.setAttribute("pointer-events", "none");
            line.style.display = "none";
        }

        styleHelperGuide(horizontalGuide);
        styleHelperGuide(verticalGuide);

        if (type === "circle") {
            element = document.createElementNS(SVG_NS, "circle");
            element.setAttribute("cx", x);
            element.setAttribute("cy", y);
            element.setAttribute("r", "2.5");
            element.setAttribute("stroke", color);
            element.setAttribute("stroke-width", "2");
            element.setAttribute("fill", "none");

        } else if (type === "ellipse") {
            element = document.createElementNS(SVG_NS, "ellipse");
            element.setAttribute("cx", x);
            element.setAttribute("cy", y);
            element.setAttribute("rx", "3");
            element.setAttribute("ry", "2");
            element.setAttribute("stroke", color);
            element.setAttribute("stroke-width", "2");
            element.setAttribute("fill", "none");

        } else if (type === "rectangle") {
            element = document.createElementNS(SVG_NS, "rect");
            element.setAttribute("x", Math.max(0, x - 2.5));
            element.setAttribute("y", Math.max(0, y - 2));
            element.setAttribute("width", "5");
            element.setAttribute("height", "4");
            element.setAttribute("stroke", color);
            element.setAttribute("stroke-width", "2");
            element.setAttribute("fill", "none");

        } else {
            return;
        }


        element.style.cursor = "move";

        workspace.appendChild(horizontalGuide);
        workspace.appendChild(verticalGuide);
        workspace.appendChild(element);

        const shape = {
            type: type,
            name: type === "circle"
                ? "Circle"
                : type === "ellipse"
                    ? "Ellipse"
                    : "Rectangle",
            element: element,
            color: color,
            fill: "none",
            strokeWidth: 2,
            hidden: false,
            locked: false,
            handles: [],
            horizontalGuide: horizontalGuide,
            verticalGuide: verticalGuide
        };

        if (type === "circle") {
            shape.cx = x;
            shape.cy = y;
            shape.radius = 2.5;

        } else if (type === "ellipse") {
            shape.cx = x;
            shape.cy = y;
            shape.rx = 3;
            shape.ry = 2;

        } else {
            shape.x = Math.max(0, x - 2.5);
            shape.y = Math.max(0, y - 2);
            shape.width = 5;
            shape.height = 4;
            shape.cornerRadius = 0;
        }
        function showHelperGuides() {
            horizontalGuide.style.display = "block";
            verticalGuide.style.display = "block";
        }

        function hideHelperGuides() {
            horizontalGuide.style.display = "none";
            verticalGuide.style.display = "none";
        }

        element.addEventListener("pointerenter", showHelperGuides);
        element.addEventListener("pointerleave", hideHelperGuides);

        shapes.push(shape);
        updateSVGSource();
        selectShape(shape);
        applyLiveSymmetry(shape);
        return shape;
    }

    function createPathData(points, curved = false, closePath = true) {
        if (points.length < 2) return "";

        if (!curved) {
            const path = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${formatSVGNumber(p.x)} ${formatSVGNumber(p.y)}`).join(" ");
            return closePath ? `${path} Z` : path;
        }

        if (points.length < 3) {
            const path = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${formatSVGNumber(p.x)} ${formatSVGNumber(p.y)}`).join(" ");
            return closePath ? `${path} Z` : path;
        }

        function midpoint(a, b) {
            return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        }

        let d = "";
        if (closePath) {
            const firstMid = midpoint(points[points.length - 1], points[0]);
            d = `M ${formatSVGNumber(firstMid.x)} ${formatSVGNumber(firstMid.y)}`;
            points.forEach((point, index) => {
                const next = points[(index + 1) % points.length];
                const mid = midpoint(point, next);
                d += ` Q ${formatSVGNumber(point.x)} ${formatSVGNumber(point.y)} ${formatSVGNumber(mid.x)} ${formatSVGNumber(mid.y)}`;
            });
            return `${d} Z`;
        } else {
            d = `M ${formatSVGNumber(points[0].x)} ${formatSVGNumber(points[0].y)}`;
            for (let i = 1; i < points.length - 1; i++) {
                const mid = midpoint(points[i], points[i + 1]);
                d += ` Q ${formatSVGNumber(points[i].x)} ${formatSVGNumber(points[i].y)} ${formatSVGNumber(mid.x)} ${formatSVGNumber(mid.y)}`;
            }
            const last = points[points.length - 1];
            d += ` L ${formatSVGNumber(last.x)} ${formatSVGNumber(last.y)}`;
            return d;
        }
    }

    function getPathParts(shape) {
        return [
            { points: shape.points, curved: shape.curved || false },
            ...(shape.holes || []).map(hole => {
                if (Array.isArray(hole)) return { points: hole, curved: false };
                return hole;
            })
        ];
    }

    function updatePathShape(shape) {
        // Render imported SVG paths without changing their original geometry
        if (typeof shape.svgPathData === "string") {
            shape.element.setAttribute("d", shape.svgPathData);
            shape.element.setAttribute("fill", shape.fill || "none");
            shape.element.setAttribute("fill-rule", "evenodd");
            shape.element.setAttribute("stroke", shape.color || "#FFFFFF");
            shape.element.setAttribute("stroke-width", shape.strokeWidth || 2);
            shape.element.setAttribute("stroke-linecap", "round");
            shape.element.setAttribute("stroke-linejoin", "round");
            shape.element.setAttribute("transform",
                `translate(${shape.offsetX || 0} ${shape.offsetY || 0})`
            );
            shape.element.style.cursor = "move";

            return;
        }
        const hasHoles = shape.holes && shape.holes.length > 0;
        const outerPathData = createPathData(shape.points, shape.curved);

        if (hasHoles) {
            const parts = getPathParts(shape);
            const compoundPathData = parts.map(item => createPathData(item.points, item.curved)).join(" ");

            // shape.element renders the compound fill without stroke (holes are transparent negative space)
            shape.element.setAttribute("d", compoundPathData);
            shape.element.setAttribute("fill", shape.fill || "none");
            shape.element.setAttribute("fill-rule", "evenodd");
            shape.element.setAttribute("stroke", "none");
            shape.element.style.cursor = "move";

            // shape.strokeElement renders the outer boundary stroke only (no outline around holes)
            if (!shape.strokeElement) {
                shape.strokeElement = document.createElementNS(SVG_NS, "path");
                shape.strokeElement.style.pointerEvents = "none";
                if (shape.element.parentNode) {
                    shape.element.parentNode.insertBefore(shape.strokeElement, shape.element.nextSibling);
                }
            }
            shape.strokeElement.setAttribute("d", outerPathData);
            shape.strokeElement.setAttribute("fill", "none");
            shape.strokeElement.setAttribute("stroke", shape.color);
            shape.strokeElement.setAttribute("stroke-width", shape.strokeWidth);
            shape.strokeElement.setAttribute("stroke-linecap", "round");
            shape.strokeElement.setAttribute("stroke-linejoin", "round");
            shape.strokeElement.style.display = shape.hidden ? "none" : "block";
        } else {
            if (shape.strokeElement) {
                shape.strokeElement.remove();
                shape.strokeElement = null;
            }
            shape.element.setAttribute("d", outerPathData);
            shape.element.setAttribute("fill", shape.fill || "none");
            shape.element.setAttribute("fill-rule", "evenodd");
            shape.element.setAttribute("stroke", shape.color);
            shape.element.setAttribute("stroke-width", shape.strokeWidth);
            shape.element.setAttribute("stroke-linecap", "round");
            shape.element.setAttribute("stroke-linejoin", "round");
            shape.element.style.cursor = "move";
        }

        if (selectedShape === shape && !shape.hidden && !shape.locked) {
            updatePathHandles(shape);
        }

        updateSVGSource();
    }

    function finishPath() {
        if (!pathDrawing || pathDrawing.points.length < 3) {
            if (pathDrawing) {
                pathDrawing.preview.remove();
                pathDrawing = null;
            }
            return;
        }

        beginHistoryAction();

        if (pathDrawing.mode === "cutout") {
            const shape = pathDrawing.shape;
            pathDrawing.preview.remove();

            if (!shape.holes) shape.holes = [];
            shape.holes.push({
                points: [...pathDrawing.points],
                curved: pathDrawing.curved
            });

            // If shape had no fill, ensure fill is active so the cutout creates negative space
            if (!shape.fill || shape.fill === "none") {
                shape.fill = shape.color || "#ffffff";
            }

            updatePathShape(shape);
            pathDrawing = null;
            selectShape(shape);
            commitHistoryAction();
            showToast("Hole cutout added", "success");
            return;
        }

        // Normal Path Mode
        const pathShape = {
            type: "path",
            name: "Path",
            element: pathDrawing.preview,
            points: [...pathDrawing.points],
            holes: [],
            curved: pathDrawing.curved,
            color: getNextColor("path"),
            fill: "none",
            strokeWidth: 2,
            hidden: false,
            locked: false,
            handles: []
        };

        pathDrawing = null;
        updatePathShape(pathShape);
        shapes.push(pathShape);

        selectShape(pathShape);
        applyLiveSymmetry(pathShape);
        commitHistoryAction();
        showToast("Path created", "success");
    }

    // ========================================================================
    // 11. SHAPE HANDLES & INTERACTIVE SELECTION
    // ========================================================================
    function createHandlesForShape(shape) {
        if (!shape || shape.hidden || shape.locked) return;

        if (shape.type === "line") {
            updateHandles(shape);
        } else if (shape.type === "curve") {
            updateCurveHandles(shape);
        } else if (
            shape.type === "circle" ||
            shape.type === "ellipse" ||
            shape.type === "rectangle"
        ) {
            updateBasicShapeHandles(shape);
        } else if (shape.type === "path") {
            updatePathHandles(shape);
        }
    }

    function selectShape(shape, additive = false) {
        const oldPrimary = selectedShape;

        // Remove old primary shape handles
        if (oldPrimary && oldPrimary !== shape) {
            oldPrimary.handles?.forEach(h => h.remove());
            oldPrimary.handles = [];
        }

        if (!additive) {
            selectedShapes = shape ? [shape] : [];
            selectedShape = shape;
        } else {
            const index = selectedShapes.indexOf(shape);
            if (index !== -1) {
                selectedShapes.splice(index, 1);
                if (selectedShape === shape) {
                    selectedShape = selectedShapes.at(-1) || null;
                }
            } else {
                selectedShapes.push(shape);
                selectedShape = shape;
            }
        }

        // Update CSS selection glow
        shapes.forEach(item => {
            if (item.element) {
                item.element.classList.toggle("is-selected", selectedShapes.includes(item));
            }
        });

        // Bug Fix: Always recreate handles for newly selected primary shape!
        if (selectedShape && !selectedShape.hidden && !selectedShape.locked) {
            createHandlesForShape(selectedShape);
        }

        updateMeasurementPanel();
        updatePropertiesPanel();
        renderLayers();
        bringHandlesToFront();
    }

    function bringHandlesToFront() {
        shapes.forEach(shape => {
            shape.handles?.forEach(h => workspace.appendChild(h));
        });
        if (gridHoverMarker) workspace.appendChild(gridHoverMarker);
    }

    // Line Handles
    function updateHandles(shape) {
        if (shape.type !== "line") return;

        const points = [
            { x: shape.x1, y: shape.y1, end: "start" },
            { x: shape.x2, y: shape.y2, end: "end" }
        ];

        // If handles already exist, update their positions only.
        if (shape.handles?.length) {
            shape.handles.forEach(el => {
                const point = points.find(p => p.end === el.dataset.end);
                if (!point) return;

                el.setAttribute("cx", point.x);
                el.setAttribute("cy", point.y);
            });

            return;
        }

        shape.handles = [];

        points.forEach(pt => {
            const hoverBg = document.createElementNS(SVG_NS, "circle");
            hoverBg.setAttribute("cx", pt.x);
            hoverBg.setAttribute("cy", pt.y);
            hoverBg.setAttribute("r", "0.85");
            hoverBg.setAttribute("fill", "#64748B");
            hoverBg.setAttribute("pointer-events", "none");
            hoverBg.style.display = "none";
            hoverBg.dataset.end = pt.end;

            const hitArea = document.createElementNS(SVG_NS, "circle");
            hitArea.setAttribute("cx", pt.x);
            hitArea.setAttribute("cy", pt.y);
            hitArea.setAttribute("r", "0.95");
            hitArea.setAttribute("fill", "transparent");
            hitArea.setAttribute("pointer-events", "all");
            hitArea.classList.add("edit-hit-area");
            hitArea.dataset.end = pt.end;

            const handle = document.createElementNS(SVG_NS, "circle");
            handle.setAttribute("cx", pt.x);
            handle.setAttribute("cy", pt.y);
            handle.setAttribute("r", "0.32");
            handle.setAttribute("fill", "#10131a");
            handle.setAttribute("stroke", "#FFFFFF");
            handle.setAttribute("stroke-width", "0.1");
            handle.setAttribute("pointer-events", "none");
            handle.classList.add("edit-handle");
            handle.dataset.end = pt.end;

            hitArea.addEventListener("pointerenter", () => {
                hoverBg.style.display = "block";
                handle.setAttribute("r", "0.42");
            });

            hitArea.addEventListener("pointerleave", () => {
                handle.setAttribute("r", "0.32");

                if (dragging?.shape !== shape || dragging?.end !== pt.end) {
                    hoverBg.style.display = "none";
                }
            });

            workspace.appendChild(hoverBg);
            workspace.appendChild(handle);
            workspace.appendChild(hitArea);

            shape.handles.push(hoverBg, handle, hitArea);
        });
    }

    // Curve Handles (Restored Complete Original 4-Handle Circular-Arc Model)
    function updateCurveHandles(shape) {
        shape.handles?.forEach(el => el.remove());
        shape.handles = [];
        if (shape.type !== "curve" || selectedShape !== shape) return;

        function makeHandle(x, y, action, color, radius = 0.32) {
            const hoverBg = document.createElementNS(SVG_NS, "circle");
            hoverBg.dataset.action = action;
            hoverBg.setAttribute("cx", x);
            hoverBg.setAttribute("cy", y);
            hoverBg.setAttribute("r", "1.05");
            hoverBg.setAttribute("fill", "#64748B");
            hoverBg.setAttribute("pointer-events", "none");
            hoverBg.style.display = "none";

            const hitArea = document.createElementNS(SVG_NS, "circle");
            hitArea.setAttribute("cx", x);
            hitArea.setAttribute("cy", y);
            hitArea.setAttribute("r", "0.65");
            hitArea.setAttribute("fill", "transparent");
            hitArea.setAttribute("stroke", "transparent");
            hitArea.setAttribute("stroke-width", "0.5");
            hitArea.setAttribute("pointer-events", "all");
            hitArea.classList.add("curve-hit-area");
            hitArea.dataset.action = action;

            const handle = document.createElementNS(SVG_NS, "circle");
            handle.dataset.action = action;
            handle.setAttribute("cx", x);
            handle.setAttribute("cy", y);
            handle.setAttribute("r", radius);
            handle.setAttribute("fill", color);
            handle.setAttribute("stroke", "#FFFFFF");
            handle.setAttribute("stroke-width", "0.1");
            handle.setAttribute("pointer-events", "none");

            hitArea.addEventListener("pointerenter", () => hoverBg.style.display = "block");
            hitArea.addEventListener("pointerleave", () => hoverBg.style.display = "none");

            workspace.appendChild(hoverBg);
            workspace.appendChild(handle);
            workspace.appendChild(hitArea);
            shape.handles.push(hoverBg, handle, hitArea);
        }

        let delta = shape.endAngle - shape.startAngle;
        while (delta < 0) delta += Math.PI * 2;
        while (delta >= Math.PI * 2) delta -= Math.PI * 2;

        // 1. Start endpoint handle (A)
        const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
        const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);
        makeHandle(startX, startY, "start", "#60A5FA");

        // 2. End endpoint handle (B)
        const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
        const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);
        makeHandle(endX, endY, "end", "#60A5FA");

        // 3. Rotate around B handle (at 25% arc)
        const angleB = shape.startAngle + delta * 0.25;
        const bX = shape.cx + shape.radius * Math.cos(angleB);
        const bY = shape.cy + shape.radius * Math.sin(angleB);
        makeHandle(bX, bY, "rotate-b", "#FBBF24");

        // 4. Rotate around A handle (at 75% arc)
        const angleA = shape.startAngle + delta * 0.75;
        const aX = shape.cx + shape.radius * Math.cos(angleA);
        const aY = shape.cy + shape.radius * Math.sin(angleA);
        makeHandle(aX, aY, "rotate-a", "#FBBF24");

        // 5. Radius handle (green handle at imaginary circle centre)
        makeHandle(shape.cx, shape.cy, "radius", "#10B981", 0.36);
    }
    function moveCurveHandles(shape) {
        if (shape.type !== "curve" || selectedShape !== shape) return;

        let delta = shape.endAngle - shape.startAngle;

        while (delta < 0) delta += Math.PI * 2;
        while (delta >= Math.PI * 2) delta -= Math.PI * 2;

        const positions = {
            start: {
                x: shape.cx + shape.radius * Math.cos(shape.startAngle),
                y: shape.cy + shape.radius * Math.sin(shape.startAngle)
            },

            end: {
                x: shape.cx + shape.radius * Math.cos(shape.endAngle),
                y: shape.cy + shape.radius * Math.sin(shape.endAngle)
            },

            "rotate-b": {
                x: shape.cx + shape.radius * Math.cos(shape.startAngle + delta * 0.25),
                y: shape.cy + shape.radius * Math.sin(shape.startAngle + delta * 0.25)
            },

            "rotate-a": {
                x: shape.cx + shape.radius * Math.cos(shape.startAngle + delta * 0.75),
                y: shape.cy + shape.radius * Math.sin(shape.startAngle + delta * 0.75)
            },

            radius: {
                x: shape.cx,
                y: shape.cy
            }
        };

        shape.handles.forEach(element => {
            const position = positions[element.dataset.action];

            if (!position) return;

            element.setAttribute("cx", position.x);
            element.setAttribute("cy", position.y);
        });
    }

    // Basic Shape Handles (Circle & Rectangle)
    function updateBasicShapeHandles(shape) {
        shape.handles?.forEach(h => h.remove());
        shape.handles = [];
        if (selectedShape !== shape) return;

        function makeHandle(x, y, action) {
            const hit = document.createElementNS(SVG_NS, "circle");
            hit.setAttribute("cx", x);
            hit.setAttribute("cy", y);
            hit.setAttribute("r", "0.85");
            hit.setAttribute("fill", "transparent");
            hit.setAttribute("pointer-events", "all");
            hit.classList.add("basic-hit-area");
            hit.dataset.action = action;

            const visible = document.createElementNS(SVG_NS, "circle");
            visible.setAttribute("cx", x);
            visible.setAttribute("cy", y);
            visible.setAttribute("r", "0.32");
            visible.setAttribute("fill", "#10131a");
            visible.setAttribute("stroke", "#FFFFFF");
            visible.setAttribute("stroke-width", "0.1");
            visible.setAttribute("pointer-events", "none");

            workspace.appendChild(visible);
            workspace.appendChild(hit);
            shape.handles.push(visible, hit);
        }

        if (shape.type === "circle") {
            makeHandle(shape.cx + shape.radius, shape.cy, "radius");

        } else if (shape.type === "ellipse") {
            // Horizontal radius handle
            makeHandle(shape.cx + shape.rx, shape.cy, "rx");

            // Vertical radius handle
            makeHandle(shape.cx, shape.cy + shape.ry, "ry");

        } else if (shape.type === "rectangle") {
            const x = shape.x;
            const y = shape.y;
            const w = shape.width;
            const h = shape.height;

            makeHandle(x, y, "nw");
            makeHandle(x + w / 2, y, "n");
            makeHandle(x + w, y, "ne");
            makeHandle(
                x + (shape.cornerRadius || 0),
                y,
                "corner-radius"
            );
            makeHandle(x + w, y + h / 2, "e");
            makeHandle(x + w, y + h, "se");
            makeHandle(x + w / 2, y + h, "s");
            makeHandle(x, y + h, "sw");
            makeHandle(x, y + h / 2, "w");
        }
    }
    function cloneSVGSegments(segments) {
        return segments.map(segment => ({ ...segment }));
    }

    function moveSVGAnchor(shape, anchorId, dx, dy) {
        shape.svgEditableSegments.forEach(segment => {
            if (segment.startAnchorId === anchorId) {
                segment.x1 += dx;
                segment.y1 += dy;

                if (segment.type === "cubic" || segment.type === "smooth-cubic") {
                    segment.cx1 += dx;
                    segment.cy1 += dy;
                } else if (
                    segment.type === "quadratic" ||
                    segment.type === "smooth-quadratic"
                ) {
                    segment.cx += dx;
                    segment.cy += dy;
                }
            }

            if (segment.endAnchorId === anchorId) {
                segment.x += dx;
                segment.y += dy;

                if (segment.type === "cubic" || segment.type === "smooth-cubic") {
                    segment.cx2 += dx;
                    segment.cy2 += dy;
                } else if (
                    segment.type === "quadratic" ||
                    segment.type === "smooth-quadratic"
                ) {
                    segment.cx += dx;
                    segment.cy += dy;
                }
            }
        });
    }


    function serializeSVGSegments(segments) {
        const n = value => formatSVGNumber(value);
        const output = [];

        segments.forEach(segment => {
            if (segment.type === "move") return;

            // Every segment starts independently.
            output.push(`M ${n(segment.x1)} ${n(segment.y1)}`);

            switch (segment.type) {
                case "line":
                    output.push(`L ${n(segment.x)} ${n(segment.y)}`);
                    break;

                case "cubic":
                case "smooth-cubic":
                    output.push(
                        `C ${n(segment.cx1)} ${n(segment.cy1)} ` +
                        `${n(segment.cx2)} ${n(segment.cy2)} ` +
                        `${n(segment.x)} ${n(segment.y)}`
                    );
                    break;

                case "quadratic":
                case "smooth-quadratic":
                    output.push(
                        `Q ${n(segment.cx)} ${n(segment.cy)} ` +
                        `${n(segment.x)} ${n(segment.y)}`
                    );
                    break;

                case "arc":
                    output.push(
                        `A ${n(segment.rx)} ${n(segment.ry)} ` +
                        `${n(segment.rotation)} ${segment.largeArc} ` +
                        `${segment.sweep} ${n(segment.x)} ${n(segment.y)}`
                    );
                    break;

                case "close":
                    // Preserve the closing edge as an independent line.
                    output.push(`L ${n(segment.x)} ${n(segment.y)}`);
                    break;
            }
        });

        return output.join(" ");
    }

    function createSVGSegmentHitPath(segment) {
        const d = `M ${segment.x1} ${segment.y1} ${segment.type === "arc"
            ? `A ${segment.rx} ${segment.ry} ${segment.rotation} ${segment.largeArc} ${segment.sweep} ${segment.x} ${segment.y}`
            : segment.type === "cubic" || segment.type === "smooth-cubic"
                ? `C ${segment.cx1} ${segment.cy1} ${segment.cx2} ${segment.cy2} ${segment.x} ${segment.y}`
                : segment.type === "quadratic" || segment.type === "smooth-quadratic"
                    ? `Q ${segment.cx} ${segment.cy} ${segment.x} ${segment.y}`
                    : `L ${segment.x} ${segment.y}`
            }`;

        return d;
    }
    // Path Vertex Handles (Allows Direct Vertex Editing on Canvas)

    function updatePathHandles(shape) {
        shape.handles?.forEach(h => h.remove());
        shape.handles = [];

        if (shape.type !== "path" || selectedShape !== shape) return;

        // Imported SVG path: render one handle per unique anchor.
        if (Array.isArray(shape.svgEditableSegments)) {
            shape.svgAnchors ||= buildSVGAnchorMap(shape.svgEditableSegments);
            // Create an invisible selectable path for every SVG segment.
            shape.svgEditableSegments.forEach(segment => {
                if (segment.type === "move") return;

                const hitPath = document.createElementNS(SVG_NS, "path");

                hitPath.setAttribute("d", createSVGSegmentHitPath(segment));
                hitPath.setAttribute("fill", "none");
                hitPath.setAttribute(
                    "stroke",
                    shape.selectedSegmentId === segment.id
                        ? "#FBBF24"
                        : "transparent"
                );
                hitPath.setAttribute("stroke-width", "1.5");
                hitPath.setAttribute("stroke-linecap", "round");
                hitPath.setAttribute("stroke-linejoin", "round");
                hitPath.setAttribute("pointer-events", "stroke");
                hitPath.setAttribute(
                    "transform",
                    `translate(${shape.offsetX || 0} ${shape.offsetY || 0})`
                );

                hitPath.classList.add("svg-segment-hit-area");
                hitPath.dataset.segmentId = segment.id;

                workspace.appendChild(hitPath);
                shape.handles.push(hitPath);
            });

            shape.svgAnchors.forEach(anchor => {
                const x = anchor.x + (shape.offsetX || 0);
                const y = anchor.y + (shape.offsetY || 0);

                const hit = document.createElementNS(SVG_NS, "circle");
                hit.setAttribute("cx", x);
                hit.setAttribute("cy", y);
                hit.setAttribute("r", "0.8");
                hit.setAttribute("fill", "transparent");
                hit.setAttribute("pointer-events", "all");
                hit.classList.add("svg-anchor-hit-area");
                hit.dataset.anchorId = anchor.id;

                const visible = document.createElementNS(SVG_NS, "circle");
                visible.setAttribute("cx", x);
                visible.setAttribute("cy", y);
                visible.setAttribute("r", "0.28");
                visible.setAttribute("fill", "#818CF8");
                visible.setAttribute("stroke", "#FFFFFF");
                visible.setAttribute("stroke-width", "0.08");
                visible.setAttribute("pointer-events", "none");

                workspace.appendChild(visible);
                workspace.appendChild(hit);

                shape.handles.push(visible, hit);
            });

            return;
        }

        // Existing point-based path handles
        function makeVertexHandle(pt, vertexIndex, holeIndex = -1) {
            const hit = document.createElementNS(SVG_NS, "circle");
            hit.setAttribute("cx", pt.x);
            hit.setAttribute("cy", pt.y);
            hit.setAttribute("r", "0.75");
            hit.setAttribute("fill", "transparent");
            hit.setAttribute("pointer-events", "all");
            hit.classList.add("path-vertex-hit-area");
            hit.dataset.vertexIndex = vertexIndex;
            hit.dataset.holeIndex = holeIndex;

            const visible = document.createElementNS(SVG_NS, "circle");
            visible.setAttribute("cx", pt.x);
            visible.setAttribute("cy", pt.y);
            visible.setAttribute("r", "0.26");
            visible.setAttribute("fill", holeIndex === -1 ? "#818CF8" : "#F472B6");
            visible.setAttribute("stroke", "#FFFFFF");
            visible.setAttribute("stroke-width", "0.08");
            visible.setAttribute("pointer-events", "none");

            workspace.appendChild(visible);
            workspace.appendChild(hit);
            shape.handles.push(visible, hit);
        }

        shape.points.forEach((pt, idx) => makeVertexHandle(pt, idx, -1));

        (shape.holes || []).forEach((hole, hIdx) => {
            const pts = Array.isArray(hole) ? hole : hole.points;
            pts.forEach((pt, pIdx) => makeVertexHandle(pt, pIdx, hIdx));
        });
    }


    // Updates Geometry for Line, Curve, Basic

    function updateLine(shape) {
        const elements = [
            shape.element,
            shape.hoverBg,
            shape.guideBg,
            shape.guide,
            shape.hitLine
        ];

        elements.forEach(el => {
            if (!el) return;

            el.setAttribute("x1", shape.x1);
            el.setAttribute("y1", shape.y1);
            el.setAttribute("x2", shape.x2);
            el.setAttribute("y2", shape.y2);
        });

        // Calculate line midpoint
        const midX = (shape.x1 + shape.x2) / 2;
        const midY = (shape.y1 + shape.y2) / 2;

        // Fixed horizontal guide
        shape.horizontalGuide.setAttribute("x1", 0);
        shape.horizontalGuide.setAttribute("y1", midY);
        shape.horizontalGuide.setAttribute("x2", artboardSize);
        shape.horizontalGuide.setAttribute("y2", midY);

        // Fixed vertical guide
        shape.verticalGuide.setAttribute("x1", midX);
        shape.verticalGuide.setAttribute("y1", 0);
        shape.verticalGuide.setAttribute("x2", midX);
        shape.verticalGuide.setAttribute("y2", artboardSize);

        // Calculate line direction
        const angle = Math.atan2(
            shape.y2 - shape.y1,
            shape.x2 - shape.x1
        );

        // Length of rotating guides
        const length = artboardSize * 1.5;

        // Parallel guide
        const dx = Math.cos(angle) * length / 2;
        const dy = Math.sin(angle) * length / 2;

        shape.alignedGuide.setAttribute("x1", midX - dx);
        shape.alignedGuide.setAttribute("y1", midY - dy);
        shape.alignedGuide.setAttribute("x2", midX + dx);
        shape.alignedGuide.setAttribute("y2", midY + dy);

        // Perpendicular guide
        const px = Math.cos(angle + Math.PI / 2) * length / 2;
        const py = Math.sin(angle + Math.PI / 2) * length / 2;

        shape.perpendicularGuide.setAttribute("x1", midX - px);
        shape.perpendicularGuide.setAttribute("y1", midY - py);
        shape.perpendicularGuide.setAttribute("x2", midX + px);
        shape.perpendicularGuide.setAttribute("y2", midY + py);

        if (selectedShape === shape) {
            updateHandles(shape);
        }

        updateSVGSource();
        shape.element?.setAttribute("stroke", shape.color);
    }


    function snapAngle(angle) {
        const step = Math.PI / 18; // 10 degrees
        return Math.round(angle / step) * step;
    }

    function updateCurve(shape) {
        const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
        const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);

        const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
        const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);

        let delta = shape.endAngle - shape.startAngle;

        while (delta < 0) delta += Math.PI * 2;
        while (delta >= Math.PI * 2) delta -= Math.PI * 2;

        const largeArc = delta > Math.PI ? 1 : 0;

        const curvePath =
            `M ${startX} ${startY} A ${shape.radius} ${shape.radius} 0 ${largeArc} 1 ${endX} ${endY}`;

        // Main curve
        shape.element.setAttribute("d", curvePath);
        shape.element.setAttribute("stroke-width", shape.strokeWidth);

        shape.guideBg.setAttribute("d", curvePath);
        shape.guide.setAttribute("d", curvePath);
        shape.hitPath.setAttribute("d", curvePath);

        // Full circumference
        shape.circumferenceGuide.setAttribute("cx", shape.cx);
        shape.circumferenceGuide.setAttribute("cy", shape.cy);
        shape.circumferenceGuide.setAttribute("r", shape.radius);

        // Full-length horizontal centerline
        shape.horizontalGuide.setAttribute("x1", 0);
        shape.horizontalGuide.setAttribute("y1", shape.cy);
        shape.horizontalGuide.setAttribute("x2", artboardSize);
        shape.horizontalGuide.setAttribute("y2", shape.cy);

        // Full-length vertical centerline
        shape.verticalGuide.setAttribute("x1", shape.cx);
        shape.verticalGuide.setAttribute("y1", 0);
        shape.verticalGuide.setAttribute("x2", shape.cx);
        shape.verticalGuide.setAttribute("y2", artboardSize);

        // Radial line to start endpoint
        shape.startRadialGuide.setAttribute("x1", shape.cx);
        shape.startRadialGuide.setAttribute("y1", shape.cy);
        shape.startRadialGuide.setAttribute("x2", startX);
        shape.startRadialGuide.setAttribute("y2", startY);

        // Radial line to end endpoint
        shape.endRadialGuide.setAttribute("x1", shape.cx);
        shape.endRadialGuide.setAttribute("y1", shape.cy);
        shape.endRadialGuide.setAttribute("x2", endX);
        shape.endRadialGuide.setAttribute("y2", endY);

        // Existing active angle guide
        const activeAngle =
            dragging?.shape === shape && dragging.action === "rotate-a"
                ? shape.startAngle
                : shape.endAngle;

        shape.angleGuide.setAttribute("x1", shape.cx);
        shape.angleGuide.setAttribute("y1", shape.cy);
        shape.angleGuide.setAttribute(
            "x2",
            shape.cx + shape.radius * Math.cos(activeAngle)
        );
        shape.angleGuide.setAttribute(
            "y2",
            shape.cy + shape.radius * Math.sin(activeAngle)
        );

        // Radius indicator and label
        const radiusAngle = (shape.startAngle + shape.endAngle) / 2;

        const radiusEndX = shape.cx + shape.radius * Math.cos(radiusAngle);
        const radiusEndY = shape.cy + shape.radius * Math.sin(radiusAngle);


        if (selectedShape === shape) {
            moveCurveHandles(shape);
        }

        updateSVGSource();
    }

    function updateBasicShape(shape) {
        shape.element.setAttribute("fill", shape.fill || "none");
        shape.element.setAttribute("stroke", shape.color);
        shape.element.setAttribute("stroke-width", shape.strokeWidth);

        if (shape.type === "circle") {
            shape.element.setAttribute("cx", shape.cx);
            shape.element.setAttribute("cy", shape.cy);
            shape.element.setAttribute("r", shape.radius);
        } else if (shape.type === "ellipse") {
            shape.element.setAttribute("cx", shape.cx);
            shape.element.setAttribute("cy", shape.cy);
            shape.element.setAttribute("rx", shape.rx);
            shape.element.setAttribute("ry", shape.ry);
        } else if (shape.type === "rectangle") {
            shape.element.setAttribute("x", shape.x);
            shape.element.setAttribute("y", shape.y);
            shape.element.setAttribute("width", shape.width);
            shape.element.setAttribute("height", shape.height);
            shape.element.setAttribute("rx", shape.cornerRadius || 0);
            shape.element.setAttribute("ry", shape.cornerRadius || 0);
        }
        // Update helper gridlines
        let centerX;
        let centerY;

        if (shape.type === "circle" || shape.type === "ellipse") {
            centerX = shape.cx;
            centerY = shape.cy;
        } else {
            centerX = shape.x + shape.width / 2;
            centerY = shape.y + shape.height / 2;
        }

        shape.horizontalGuide.setAttribute("x1", 0);
        shape.horizontalGuide.setAttribute("y1", centerY);
        shape.horizontalGuide.setAttribute("x2", artboardSize);
        shape.horizontalGuide.setAttribute("y2", centerY);

        shape.verticalGuide.setAttribute("x1", centerX);
        shape.verticalGuide.setAttribute("y1", 0);
        shape.verticalGuide.setAttribute("x2", centerX);
        shape.verticalGuide.setAttribute("y2", artboardSize);

        if (selectedShape === shape && !shape.hidden && !shape.locked) {
            updateBasicShapeHandles(shape);
        }
        updateSVGSource();
    }

    // ========================================================================
    // 12. SNAPPING & ALIGNMENT GUIDES
    // ========================================================================
    function getShapeEndpoints(shape) {
        if (!shape) return [];
        if (shape.type === "line") {
            return [
                { x: shape.x1, y: shape.y1, shape, end: "start" },
                { x: shape.x2, y: shape.y2, shape, end: "end" }
            ];
        }
        if (shape.type === "curve") {
            return [
                { x: shape.cx + shape.radius * Math.cos(shape.startAngle), y: shape.cy + shape.radius * Math.sin(shape.startAngle), shape, end: "start" },
                { x: shape.cx + shape.radius * Math.cos(shape.endAngle), y: shape.cy + shape.radius * Math.sin(shape.endAngle), shape, end: "end" },
                { x: shape.cx, y: shape.cy, shape, end: "center" }
            ];
        }
        if (shape.type === "circle") {
            return [
                { x: shape.cx, y: shape.cy, shape, end: "center" },
                { x: shape.cx, y: shape.cy - shape.radius, shape, end: "top" },
                { x: shape.cx, y: shape.cy + shape.radius, shape, end: "bottom" },
                { x: shape.cx - shape.radius, y: shape.cy, shape, end: "left" },
                { x: shape.cx + shape.radius, y: shape.cy, shape, end: "right" }
            ];
        }
        if (shape.type === "rectangle") {
            return [
                { x: shape.x, y: shape.y, shape, end: "nw" },
                { x: shape.x + shape.width, y: shape.y, shape, end: "ne" },
                { x: shape.x, y: shape.y + shape.height, shape, end: "sw" },
                { x: shape.x + shape.width, y: shape.y + shape.height, shape, end: "se" },
                { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2, shape, end: "center" }
            ];
        }
        if (shape.type === "path") {
            const endpoints = [];
            (shape.points || []).forEach((pt, idx) => {
                endpoints.push({ x: pt.x, y: pt.y, shape, end: `v_${idx}` });
            });
            (shape.holes || []).forEach((hole, hIdx) => {
                const pts = Array.isArray(hole) ? hole : hole.points;
                (pts || []).forEach((pt, pIdx) => {
                    endpoints.push({ x: pt.x, y: pt.y, shape, end: `h_${hIdx}_${pIdx}` });
                });
            });
            return endpoints;
        }
        return [];
    }

    function getSnappedPoint(x, y, currentShape, shiftKey = false) {
        if (shiftKey) {
            if (endpointSnapIndicator) endpointSnapIndicator.style.display = "none";
            return { x, y };
        }

        const snapDistance = 0.55;
        const releaseDistance = 0.65;

        if (dragging?.snappedTo) {
            const target = getShapeEndpoints(dragging.snappedTo.shape).find(pt => pt.end === dragging.snappedTo.end);
            if (target && Math.hypot(x - target.x, y - target.y) <= releaseDistance) {
                if (endpointSnapIndicator) {
                    endpointSnapIndicator.setAttribute("cx", target.x);
                    endpointSnapIndicator.setAttribute("cy", target.y);
                    endpointSnapIndicator.style.display = "block";
                }
                return { x: target.x, y: target.y };
            }
            dragging.snappedTo = null;
        }

        let closest = null;
        let closestDist = snapDistance;

        for (const shape of shapes) {
            if (shape === currentShape || shape.hidden || shape.locked) continue;
            for (const pt of getShapeEndpoints(shape)) {
                const dist = Math.hypot(x - pt.x, y - pt.y);
                if (dist <= closestDist) {
                    closestDist = dist;
                    closest = pt;
                }
            }
        }

        if (closest) {
            dragging.snappedTo = { shape: closest.shape, end: closest.end };
            if (endpointSnapIndicator) {
                endpointSnapIndicator.setAttribute("cx", closest.x);
                endpointSnapIndicator.setAttribute("cy", closest.y);
                endpointSnapIndicator.style.display = "block";
            }
            return { x: closest.x, y: closest.y };
        }

        if (endpointSnapIndicator) endpointSnapIndicator.style.display = "none";
        return { x, y };
    }

    function getAlignmentBounds(shape) {
        if (shape.type === "circle") {
            return { left: shape.cx - shape.radius, right: shape.cx + shape.radius, top: shape.cy - shape.radius, bottom: shape.cy + shape.radius };
        }
        if (shape.type === "ellipse") {
            return {
                left: shape.cx - shape.rx,
                right: shape.cx + shape.rx,
                top: shape.cy - shape.ry,
                bottom: shape.cy + shape.ry
            };
        }
        if (shape.type === "rectangle") {
            return { left: shape.x, right: shape.x + shape.width, top: shape.y, bottom: shape.y + shape.height };
        }
        if (shape.type === "line") {
            return { left: Math.min(shape.x1, shape.x2), right: Math.max(shape.x1, shape.x2), top: Math.min(shape.y1, shape.y2), bottom: Math.max(shape.y1, shape.y2) };
        }
        if (shape.type === "curve") {
            const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
            const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);
            const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
            const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);
            const xs = [startX, endX, shape.cx];
            const ys = [startY, endY, shape.cy];
            return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
        }
        if (shape.type === "path" && shape.points?.length) {
            const xs = shape.points.map(p => p.x);
            const ys = shape.points.map(p => p.y);
            return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
        }
        return null;
    }

    function hideAlignmentGuides() {
        alignmentVertical.style.display = "none";
        alignmentHorizontal.style.display = "none";
    }

    function updateAlignmentGuides(movingShape) {
        hideAlignmentGuides();
        const movingBounds = getAlignmentBounds(movingShape);
        if (!movingBounds) return;

        const movingX = [movingBounds.left, (movingBounds.left + movingBounds.right) / 2, movingBounds.right];
        const movingY = [movingBounds.top, (movingBounds.top + movingBounds.bottom) / 2, movingBounds.bottom];

        const targetsX = [0, artboardSize / 2, artboardSize];
        const targetsY = [0, artboardSize / 2, artboardSize];

        shapes.forEach(other => {
            if (other === movingShape || other.hidden) return;
            const b = getAlignmentBounds(other);
            if (!b) return;
            targetsX.push(b.left, (b.left + b.right) / 2, b.right);
            targetsY.push(b.top, (b.top + b.bottom) / 2, b.bottom);
        });

        const tolerance = 0.12;
        const verticalMatch = movingX.find(v => targetsX.some(t => Math.abs(v - t) <= tolerance));
        const horizontalMatch = movingY.find(v => targetsY.some(t => Math.abs(v - t) <= tolerance));

        if (verticalMatch !== undefined) {
            alignmentVertical.setAttribute("x1", verticalMatch);
            alignmentVertical.setAttribute("x2", verticalMatch);
            alignmentVertical.setAttribute("y1", 0);
            alignmentVertical.setAttribute("y2", artboardSize);
            alignmentVertical.style.display = "block";
        }

        if (horizontalMatch !== undefined) {
            alignmentHorizontal.setAttribute("x1", 0);
            alignmentHorizontal.setAttribute("x2", artboardSize);
            alignmentHorizontal.setAttribute("y1", horizontalMatch);
            alignmentHorizontal.setAttribute("y2", horizontalMatch);
            alignmentHorizontal.style.display = "block";
        }
    }

    function renderCustomMirrorAxes() {
        if (!customMirrorAxesGroup) return;
        customMirrorAxesGroup.innerHTML = "";
        customMirrorAxes.forEach(axis => {
            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", axis.x1);
            line.setAttribute("y1", axis.y1);
            line.setAttribute("x2", axis.x2);
            line.setAttribute("y2", axis.y2);
            line.setAttribute("stroke", "#EC4899");
            line.setAttribute("stroke-width", "0.35");
            line.setAttribute("stroke-dasharray", "0.8 0.5");
            line.setAttribute("opacity", "0.9");
            line.setAttribute("pointer-events", "none");
            customMirrorAxesGroup.appendChild(line);
        });
    }

    // ========================================================================
    // 13. WORKSPACE MOUSE/POINTER DRAG & CANVAS INTERACTIONS
    // ========================================================================
    workspace.addEventListener("pointerdown", event => {
        // Close context menu on any click
        hideContextMenu();

        const pos = getSVGPosition(event);

        // Custom Mirror Axis 2-Point Placement Mode
        if (isPlacingMirrorAxis) {
            if (event.button !== 0) return;
            if (!customMirrorStart) {
                customMirrorStart = { x: Math.round(pos.x * 2) / 2, y: Math.round(pos.y * 2) / 2 };
                showToast("First point placed. Click second point to complete mirror axis.", "info");
            } else {
                const end = { x: Math.round(pos.x * 2) / 2, y: Math.round(pos.y * 2) / 2 };
                if (end.x !== customMirrorStart.x || end.y !== customMirrorStart.y) {
                    customMirrorAxes = [{
                        id: `axis-${Date.now()}`,
                        x1: customMirrorStart.x,
                        y1: customMirrorStart.y,
                        x2: end.x,
                        y2: end.y,
                        active: true
                    }];
                    renderCustomMirrorAxes();
                    showToast("Custom mirror axis set!", "success");
                }
                customMirrorStart = null;
                isPlacingMirrorAxis = false;
                customMirrorToolBtn?.classList.remove("active");
            }
            return;
        }

        // Path drawing in progress
        if (pathDrawing) {
            if (event.button !== 0) return;
            event.preventDefault();
            pathDrawing.points.push(pos);
            const pathData = createPathData(pathDrawing.points, pathDrawing.curved);
            pathDrawing.preview.setAttribute("d", pathData);
            return;
        }

        beginHistoryAction();
        if (event.button === 0 && event.target.setPointerCapture) {
            event.target.setPointerCapture(event.pointerId);
        }

        // Check if locked shape clicked
        const lockedShape = shapes.find(shape => {
            const elements = [shape.element, shape.hoverBg, shape.guideBg, shape.guide, shape.hitLine, shape.hitPath, ...(shape.handles || [])];
            return elements.includes(event.target);
        });

        if (lockedShape?.locked) {
            selectShape(lockedShape, event.shiftKey);
            return;
        }

        const curveHit = event.target.closest(".curve-hit-area");
        const hitArea = event.target.closest(".edit-hit-area");
        const basicHit = event.target.closest(".basic-hit-area");
        const vertexHit = event.target.closest(".path-vertex-hit-area");
        const svgSegmentHit = event.target.closest(".svg-segment-hit-area");

        // Individual imported SVG segment selection
        // Individual imported SVG segment selection
        if (svgSegmentHit) {
            const shape = shapes.find(s =>
                s.type === "path" &&
                s.handles?.includes(svgSegmentHit)
            );

            if (!shape) return;

            const segmentId = svgSegmentHit.dataset.segmentId;

            const segment = shape.svgEditableSegments.find(
                item => item.id === segmentId
            );

            if (!segment) return;

            // Remember which segment is selected.
            shape.selectedSegmentId = segmentId;

            // Select the shape. This rebuilds its handles.
            selectShape(shape);

            // Find the newly created hit area for the same segment.
            const newHitArea = shape.handles.find(handle =>
                handle.classList?.contains("svg-segment-hit-area") &&
                handle.dataset.segmentId === segmentId
            );

            if (!newHitArea) return;

            // Start dragging after the handles have been rebuilt.
            if ([
                "line",
                "close",
                "cubic",
                "smooth-cubic",
                "quadratic",
                "smooth-quadratic"
            ].includes(segment.type)) {
                dragging = {
                    shape,
                    type: "svg-segment",
                    segmentId,
                    startX: pos.x,
                    startY: pos.y,
                    originalSegments: cloneSVGSegments(
                        shape.svgEditableSegments
                    )
                };
            }

            return;
        }

        // 1. Path Vertex Handle Drag
        if (vertexHit) {
            const shape = shapes.find(s => s.type === "path" && s.handles?.includes(vertexHit));
            if (!shape) return;
            selectShape(shape);

            const vIdx = Number(vertexHit.dataset.vertexIndex);
            const hIdx = Number(vertexHit.dataset.holeIndex);

            dragging = {
                shape,
                type: "path-vertex",
                vertexIndex: vIdx,
                holeIndex: hIdx
            };
            return;
        }

        // 2. Circle / Rectangle Resize Handle
        if (basicHit) {
            const shape = shapes.find(s =>
                (s.type === "circle" ||
                    s.type === "ellipse" ||
                    s.type === "rectangle") &&
                s.handles?.includes(basicHit)
            );
            if (!shape) return;
            selectShape(shape);

            dragging = {
                shape,
                type: "basic-handle",
                action: basicHit.dataset.action,
                startX: pos.x,
                startY: pos.y,
                initialX: shape.x,
                initialY: shape.y,
                initialWidth: shape.width,
                initialHeight: shape.height,
                initialRadius: shape.radius,
                initialCornerRadius: shape.cornerRadius || 0
            };
            // Show helper guides
            shape.horizontalGuide.style.display = "block";
            shape.verticalGuide.style.display = "block";
            return;
        }

        // 3. Curve Handle
        if (curveHit) {
            const shape = shapes.find(s =>
                s.type === "curve" &&
                s.handles?.includes(curveHit)
            );

            if (!shape) return;

            const action = curveHit.dataset.action;

            if (selectedShape !== shape) {
                selectShape(shape);
            }

            // Determine fixed pivot for yellow rotation handles
            let pivot = null;

            if (action === "rotate-a") {
                pivot = {
                    x: shape.cx + shape.radius * Math.cos(shape.startAngle),
                    y: shape.cy + shape.radius * Math.sin(shape.startAngle)
                };
            }

            else if (action === "rotate-b") {
                pivot = {
                    x: shape.cx + shape.radius * Math.cos(shape.endAngle),
                    y: shape.cy + shape.radius * Math.sin(shape.endAngle)
                };
            }

            const initialCursorAngle = pivot
                ? Math.atan2(
                    pos.y - pivot.y,
                    pos.x - pivot.x
                )
                : null;

            dragging = {
                shape,
                type: "curve-handle",
                action,

                startX: pos.x,
                startY: pos.y,

                startRadius: shape.radius,

                startCx: shape.cx,
                startCy: shape.cy,

                startAngle: shape.startAngle,
                initialEndAngle: shape.endAngle,

                pivot,
                initialCursorAngle,

                snappedTo: null
            };
            // Show all curve helper guides
            shape.circumferenceGuide.style.display = "block";
            shape.horizontalGuide.style.display = "block";
            shape.verticalGuide.style.display = "block";
            shape.startRadialGuide.style.display = "block";
            shape.endRadialGuide.style.display = "block";
            shape.angleGuide.style.display = "block";

            return;
        }

        // 4. Line Endpoint Handle
        if (hitArea) {
            const shape = shapes.find(s => s.type === "line" && s.handles?.includes(hitArea));
            if (!shape) return;
            selectShape(shape);

            dragging = {
                shape,
                type: "endpoint",
                end: hitArea.dataset.end,
                snappedTo: null
            };
            return;
        }

        // 5. Shape Body Selection & Move
        const clickedShape = shapes.find(item => {
            if (item.hidden) return false;
            if (
                item.type === "circle" ||
                item.type === "ellipse" ||
                item.type === "rectangle" ||
                item.type === "path"
            ) {
                return item.element === event.target || item.strokeElement === event.target;
            }
            if (item.type === "line") {
                return item.hitLine === event.target || item.element === event.target;
            }
            if (item.type === "curve") {
                return item.hitPath === event.target || item.element === event.target;
            }
            return false;
        });

        if (clickedShape) {
            selectShape(clickedShape, event.shiftKey);

            dragging = {
                shape: clickedShape,
                type: "body",
                previousX: pos.x,
                previousY: pos.y,
                snappedTo: null
            };

            if (clickedShape.type === "curve") {
                clickedShape.horizontalGuide.style.display = "block";
                clickedShape.angleGuide.style.display = "block";
            }
            return;
        }

        // 6. Clicking empty canvas -> start marquee selection box
        if (event.button === 0) {
            marqueeStart = {
                x: pos.x,
                y: pos.y,
                shiftKey: event.shiftKey,
                initialSelection: event.shiftKey ? [...selectedShapes] : []
            };
            if (!event.shiftKey) {
                selectShape(null);
            }
            if (marqueeSelectionBox) {
                marqueeSelectionBox.setAttribute("x", pos.x);
                marqueeSelectionBox.setAttribute("y", pos.y);
                marqueeSelectionBox.setAttribute("width", "0");
                marqueeSelectionBox.setAttribute("height", "0");
                marqueeSelectionBox.style.display = "block";
            }
        }
    });

    workspace.addEventListener("pointermove", event => {
        const position = getSVGPosition(event);

        // Grid Hover Highlight
        if (gridHighlightToggle?.checked && gridHoverMarker) {
            const rx = Math.round(position.x);
            const ry = Math.round(position.y);
            gridHoverMarker.setAttribute("cx", rx);
            gridHoverMarker.setAttribute("cy", ry);
            gridHoverMarker.style.display = "block";
        }

        // Marquee Selection Box Update
        if (marqueeStart && marqueeSelectionBox) {
            const minX = Math.min(marqueeStart.x, position.x);
            const minY = Math.min(marqueeStart.y, position.y);
            const width = Math.abs(position.x - marqueeStart.x);
            const height = Math.abs(position.y - marqueeStart.y);

            marqueeSelectionBox.setAttribute("x", minX);
            marqueeSelectionBox.setAttribute("y", minY);
            marqueeSelectionBox.setAttribute("width", width);
            marqueeSelectionBox.setAttribute("height", height);

            const marqueeRect = { left: minX, right: minX + width, top: minY, bottom: minY + height };
            const intersected = [];

            shapes.forEach(shape => {
                if (shape.hidden || shape.locked) return;
                const b = getAlignmentBounds(shape);
                if (b && !(b.right < marqueeRect.left || b.left > marqueeRect.right || b.bottom < marqueeRect.top || b.top > marqueeRect.bottom)) {
                    intersected.push(shape);
                }
            });

            if (marqueeStart.shiftKey) {
                const combined = Array.from(new Set([...marqueeStart.initialSelection, ...intersected]));
                selectedShapes = combined;
                selectedShape = selectedShapes[0] || null;
            } else {
                selectedShapes = intersected;
                selectedShape = intersected[0] || null;
            }

            shapes.forEach(item => {
                if (item.element) {
                    item.element.classList.toggle("is-selected", selectedShapes.includes(item));
                }
            });
            updatePropertiesPanel();
            updateMeasurementPanel();
            renderLayers();
            return;
        }

        if (!dragging || dragging.shape.locked || dragging.shape.hidden) return;

        const shape = dragging.shape;

        if (dragging.type === "svg-segment") {
            const dx = position.x - dragging.startX;
            const dy = position.y - dragging.startY;

            shape.svgEditableSegments = cloneSVGSegments(
                dragging.originalSegments
            );

            const segment = shape.svgEditableSegments.find(
                item => item.id === dragging.segmentId
            );

            if (!segment) return;

            // Detach this segment from its neighboring segments.
            segment.startAnchorId = `${segment.id}-detached-start`;
            segment.endAnchorId = `${segment.id}-detached-end`;

            // Move the segment's endpoints.
            segment.x1 += dx;
            segment.y1 += dy;
            segment.x += dx;
            segment.y += dy;

            // Move cubic curve control points.
            if (
                segment.type === "cubic" ||
                segment.type === "smooth-cubic"
            ) {
                segment.cx1 += dx;
                segment.cy1 += dy;
                segment.cx2 += dx;
                segment.cy2 += dy;
            }

            // Move quadratic curve control points.
            else if (
                segment.type === "quadratic" ||
                segment.type === "smooth-quadratic"
            ) {
                segment.cx += dx;
                segment.cy += dy;
            }

            shape.svgAnchors = buildSVGAnchorMap(
                shape.svgEditableSegments
            );

            shape.svgPathData = serializeSVGSegments(
                shape.svgEditableSegments
            );

            updatePathShape(shape);
            return;
        }


        // Path Vertex Move
        if (dragging.type === "path-vertex") {
            const targetPoint = dragging.holeIndex === -1
                ? shape.points[dragging.vertexIndex]
                : (Array.isArray(shape.holes[dragging.holeIndex])
                    ? shape.holes[dragging.holeIndex][dragging.vertexIndex]
                    : shape.holes[dragging.holeIndex].points[dragging.vertexIndex]);

            if (targetPoint) {
                targetPoint.x = Math.round(position.x * 10) / 10;
                targetPoint.y = Math.round(position.y * 10) / 10;
                updatePathShape(shape);
            }
            return;
        }

        // Line Endpoint Drag (with snapping and Shift override)
        if (dragging.type === "endpoint") {
            const snapped = getSnappedPoint(position.x, position.y, shape, event.shiftKey);
            if (dragging.end === "start") {
                shape.x1 = snapped.x;
                shape.y1 = snapped.y;
            } else {
                shape.x2 = snapped.x;
                shape.y2 = snapped.y;
            }
            updateLine(shape);
            dragging.shape.alignedGuide.style.display = "block";
            dragging.shape.perpendicularGuide.style.display = "block";
            return;
        }

        // =====================================
        // CURVE CENTER DRAG
        // =====================================

        if (dragging.type === "curve-center") {

            const dx = position.x - dragging.startX;
            const dy = position.y - dragging.startY;

            const newX = dragging.initialCx + dx;
            const newY = dragging.initialCy + dy;

            // Snap center to 1-unit grid
            const snappedX = event.shiftKey ? newX : Math.round(newX);
            const snappedY = event.shiftKey ? newY : Math.round(newY);

            shape.cx = Math.max(
                shape.radius,
                Math.min(artboardSize - shape.radius, snappedX)
            );

            shape.cy = Math.max(
                shape.radius,
                Math.min(artboardSize - shape.radius, snappedY)
            );

            updateCurve(shape);
            return;
        }


        // =====================================
        // CURVE HANDLE MOVEMENT
        // =====================================

        if (dragging.type === "curve-handle") {

            const action = dragging.action;

            // BLUE A: Change start angle
            if (action === "start") {

                const angle = Math.atan2(
                    position.y - shape.cy,
                    position.x - shape.cx
                );

                shape.startAngle = snapAngle(angle);
            }


            // BLUE B: Change end angle
            else if (action === "end") {

                const angle = Math.atan2(
                    position.y - shape.cy,
                    position.x - shape.cx
                );

                shape.endAngle = snapAngle(angle);
            }


            // YELLOW: Rotate around fixed endpoint
            else if (
                action === "rotate-a" ||
                action === "rotate-b"
            ) {

                const currentAngle = Math.atan2(
                    position.y - dragging.pivot.y,
                    position.x - dragging.pivot.x
                );

                let rotation =
                    currentAngle - dragging.initialCursorAngle;

                // Normalize rotation
                rotation = Math.atan2(
                    Math.sin(rotation),
                    Math.cos(rotation)
                );

                // Snap rotation to 10 degrees
                rotation = snapAngle(rotation);

                const pivot = dragging.pivot;

                const dx = dragging.startCx - pivot.x;
                const dy = dragging.startCy - pivot.y;

                // Rotate curve centre around fixed endpoint
                shape.cx = pivot.x +
                    dx * Math.cos(rotation) -
                    dy * Math.sin(rotation);

                shape.cy = pivot.y +
                    dx * Math.sin(rotation) +
                    dy * Math.cos(rotation);

                // Rotate both endpoints by exactly the same amount
                shape.startAngle = dragging.startAngle + rotation;
                shape.endAngle = dragging.initialEndAngle + rotation;
            }


            // GREEN: Change radius vertically
            else if (action === "radius") {

                const movement = dragging.startY - position.y;
                const newRadius = dragging.startRadius + movement;

                shape.radius = Math.max(
                    0.3,
                    Math.min(
                        artboardSize,
                        event.shiftKey ? newRadius : Math.round(newRadius)
                    )
                );
            }

            updateCurve(shape);
            return;
        }

        // Basic Shape Handle Resize (Circle / Rect)
        if (dragging.type === "basic-handle") {
            if (shape.type === "circle") {
                const dist = Math.hypot(position.x - shape.cx, position.y - shape.cy);
                shape.radius = Math.max(0.2, Math.min(artboardSize, dist));
                updateBasicShape(shape);
            } else if (shape.type === "ellipse") {
                if (dragging.action === "rx") {
                    shape.rx = Math.max(
                        0.2,
                        Math.abs(position.x - shape.cx)
                    );
                } else if (dragging.action === "ry") {
                    shape.ry = Math.max(
                        0.2,
                        Math.abs(position.y - shape.cy)
                    );
                }

                updateBasicShape(shape);
            } else if (shape.type === "rectangle") {
                const dx = position.x - dragging.startX;
                const dy = position.y - dragging.startY;
                const action = dragging.action;
                if (dragging.action === "corner-radius") {
                    shape.cornerRadius = Math.max(
                        0,
                        Math.min(
                            Math.min(shape.width, shape.height) / 2,
                            position.x - shape.x
                        )
                    );

                    updateBasicShape(shape);
                    return;
                }

                if (action.includes("e")) shape.width = Math.max(0.5, dragging.initialWidth + dx);
                if (action.includes("s")) shape.height = Math.max(0.5, dragging.initialHeight + dy);
                if (action.includes("w")) {
                    const newW = Math.max(0.5, dragging.initialWidth - dx);
                    shape.x = dragging.initialX + (dragging.initialWidth - newW);
                    shape.width = newW;
                }
                if (action.includes("n")) {
                    const newH = Math.max(0.5, dragging.initialHeight - dy);
                    shape.y = dragging.initialY + (dragging.initialHeight - newH);
                    shape.height = newH;
                }
                updateBasicShape(shape);
            }
            return;
        }

        // Whole Shape Body Drag (Multi-selection group move, preserving artboardSize)
        if (dragging.type === "body") {
            const dx = position.x - dragging.previousX;
            const dy = position.y - dragging.previousY;
            dragging.previousX = position.x;
            dragging.previousY = position.y;

            const targets = selectedShapes.length ? selectedShapes : [shape];

            targets.forEach(item => {
                if (item.type === "line") {
                    item.x1 = Math.max(0, Math.min(artboardSize, item.x1 + dx));
                    item.y1 = Math.max(0, Math.min(artboardSize, item.y1 + dy));
                    item.x2 = Math.max(0, Math.min(artboardSize, item.x2 + dx));
                    item.y2 = Math.max(0, Math.min(artboardSize, item.y2 + dy));
                    updateLine(item);
                } else if (item.type === "curve") {
                    item.cx = Math.max(0, Math.min(artboardSize, item.cx + dx));
                    item.cy = Math.max(0, Math.min(artboardSize, item.cy + dy));
                    updateCurve(item);
                } else if (item.type === "circle") {
                    item.cx = Math.max(0, Math.min(artboardSize, item.cx + dx));
                    item.cy = Math.max(0, Math.min(artboardSize, item.cy + dy));
                    updateBasicShape(item);
                } else if (item.type === "ellipse") {
                    item.cx = Math.max(0, Math.min(artboardSize, item.cx + dx));
                    item.cy = Math.max(0, Math.min(artboardSize, item.cy + dy));
                    updateBasicShape(item);
                } else if (item.type === "rectangle") {
                    item.x = Math.max(0, Math.min(artboardSize - item.width, item.x + dx));
                    item.y = Math.max(0, Math.min(artboardSize - item.height, item.y + dy));
                    updateBasicShape(item);
                } else if (item.type === "path") {

                    if (typeof item.svgPathData === "string") {
                        item.offsetX = (item.offsetX || 0) + dx;
                        item.offsetY = (item.offsetY || 0) + dy;
                    } else {
                        item.points.forEach(p => {
                            p.x += dx;
                            p.y += dy;
                        });

                        (item.holes || []).forEach(h => {
                            const pts = Array.isArray(h) ? h : h.points;
                            pts.forEach(p => {
                                p.x += dx;
                                p.y += dy;
                            });
                        });
                    }

                    updatePathShape(item);
                }
            });

            updateAlignmentGuides(shape);
        }
    });

    function stopMovement(event) {
        if (event && event.target.hasPointerCapture?.(event.pointerId)) {
            event.target.releasePointerCapture(event.pointerId);
        }
        if (marqueeStart) {
            marqueeStart = null;
            if (marqueeSelectionBox) {
                marqueeSelectionBox.style.display = "none";
            }
            if (selectedShape && !selectedShape.hidden && !selectedShape.locked) {
                createHandlesForShape(selectedShape);
            }
        }

        if (endpointSnapIndicator) {
            endpointSnapIndicator.style.display = "none";
        }

        if (!dragging) return;

        if (dragging.shape?.type === "curve") {
            const shape = dragging.shape;

            shape.circumferenceGuide.style.display = "none";
            shape.horizontalGuide.style.display = "none";
            shape.verticalGuide.style.display = "none";
            shape.startRadialGuide.style.display = "none";
            shape.endRadialGuide.style.display = "none";
            shape.angleGuide.style.display = "none";
        }
        if (dragging.shape?.type === "line") {
            dragging.shape.alignedGuide.style.display = "none";
            dragging.shape.perpendicularGuide.style.display = "none";
        }
        // Hide circle and rectangle helper guides
        if (
            dragging.shape?.type === "circle" ||
            dragging.shape?.type === "rectangle"
        ) {
            dragging.shape.horizontalGuide.style.display = "none";
            dragging.shape.verticalGuide.style.display = "none";
        }
        hideAlignmentGuides();
        dragging = null;

        updateMeasurementPanel();
        updatePropertiesPanel();
        commitHistoryAction();
    }

    workspace.addEventListener("pointerup", stopMovement);
    workspace.addEventListener("pointercancel", stopMovement);
    workspace.addEventListener("pointerleave", () => {
        if (gridHoverMarker) gridHoverMarker.style.display = "none";
        if (endpointSnapIndicator) endpointSnapIndicator.style.display = "none";
        hideAlignmentGuides();
    });

    // ========================================================================
    // 14. LAYERS PANEL (WITH FIX FOR LOCK ICON BUG)
    // ========================================================================
    function renderLayers() {
        if (!layerCount || !layerList) return;

        layerCount.textContent = shapes.length;

        if (shapes.length === 0) {
            layerList.innerHTML = `<p class="empty-layers">No layers yet</p>`;
            return;
        }

        layerList.innerHTML = [...shapes]
            .map(shape => {
                const index = shapes.indexOf(shape);
                const isSelected = selectedShapes.includes(shape) || selectedShape === shape;
                const safeName = shape.name || `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}`;

                // Bug Fix: When shape.locked is true, show locked.svg!
                const lockIconSrc = shape.locked ? "assets/icons/locked.svg" : "assets/icons/unlocked.svg";
                const lockTitle = shape.locked ? "Unlock layer" : "Lock layer";

                return `
                    <div class="layer-item ${isSelected ? "active" : ""}" data-layer-index="${index}">
                        <span class="layer-name" title="Double click to rename">${safeName}</span>
                        <span class="layer-type">${shape.type}</span>
                        <div class="layer-controls">
                            <button class="layer-move-btn" data-layer-action="up" data-layer-index="${index}" type="button" title="Bring forward" ${index === shapes.length - 1 ? "disabled" : ""}>↑</button>
                            <button class="layer-move-btn" data-layer-action="down" data-layer-index="${index}" type="button" title="Send backward" ${index === 0 ? "disabled" : ""}>↓</button>
                            <button class="layer-visibility-btn" data-layer-action="visibility" data-layer-index="${index}" type="button" title="${shape.hidden ? "Show layer" : "Hide layer"}">
                                ${shape.hidden ? "○" : "●"}
                            </button>
                            <button class="layer-lock-btn" data-layer-action="lock" data-layer-index="${index}" type="button" title="${lockTitle}">
                                <img src="${lockIconSrc}" alt="${shape.locked ? "Locked" : "Unlocked"}">
                            </button>
                            <button class="layer-delete-btn" data-layer-action="delete" data-layer-index="${index}" type="button" title="Delete layer">×</button>
                        </div>
                    </div>
                `;
            })
            .reverse()
            .join("");
    }

    function reorderShape(index, direction) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= shapes.length) return;

        beginHistoryAction();
        const moved = shapes.splice(index, 1)[0];
        shapes.splice(targetIndex, 0, moved);

        // Re-append in new order
        shapes.forEach(shape => {
            getShapeElements(shape).forEach(el => workspace.appendChild(el));
        });

        bringHandlesToFront();
        renderLayers();
        updateSVGSource();
        commitHistoryAction();
    }

    function toggleLayerVisibility(index) {
        const shape = shapes[index];
        if (!shape) return;

        beginHistoryAction();
        shape.hidden = !shape.hidden;

        getShapeElements(shape).forEach(el => {
            el.style.visibility = shape.hidden ? "hidden" : "visible";
        });

        if (shape.hidden && selectedShapes.includes(shape)) {
            selectShape(null);
        }

        renderLayers();
        updateSVGSource();
        commitHistoryAction();
    }

    function toggleLayerLock(index) {
        const shape = shapes[index];
        if (!shape) return;

        beginHistoryAction();
        shape.locked = !shape.locked;

        if (shape.locked) {
            shape.handles?.forEach(h => h.remove());
            shape.handles = [];
        } else if (selectedShape === shape) {
            createHandlesForShape(shape);
        }

        renderLayers();
        commitHistoryAction();
    }

    layerList?.addEventListener("click", event => {
        const moveBtn = event.target.closest(".layer-move-btn");
        const visibilityBtn = event.target.closest(".layer-visibility-btn");
        const lockBtn = event.target.closest(".layer-lock-btn");
        const deleteBtn = event.target.closest(".layer-delete-btn");

        if (visibilityBtn) {
            event.preventDefault();
            event.stopPropagation();
            toggleLayerVisibility(Number(visibilityBtn.dataset.layerIndex));
            return;
        }

        if (lockBtn) {
            event.preventDefault();
            event.stopPropagation();
            toggleLayerLock(Number(lockBtn.dataset.layerIndex));
            return;
        }

        if (deleteBtn) {
            event.preventDefault();
            event.stopPropagation();
            const idx = Number(deleteBtn.dataset.layerIndex);
            if (shapes[idx]) {
                beginHistoryAction();
                removeShape(shapes[idx]);
                shapes.splice(idx, 1);
                selectShape(null);
                renderLayers();
                updateSVGSource();
                commitHistoryAction();
                showToast("Layer deleted", "info");
            }
            return;
        }

        if (moveBtn) {
            event.preventDefault();
            event.stopPropagation();
            const idx = Number(moveBtn.dataset.layerIndex);
            const dir = moveBtn.dataset.layerAction === "up" ? 1 : -1;
            reorderShape(idx, dir);
            return;
        }

        const layerRow = event.target.closest(".layer-item");
        if (layerRow) {
            const idx = Number(layerRow.dataset.layerIndex);
            if (shapes[idx]) selectShape(shapes[idx], event.shiftKey);
        }
    });

    // Rename Layer
    layerList?.addEventListener("dblclick", event => {
        const nameEl = event.target.closest(".layer-name");
        if (!nameEl) return;

        const row = nameEl.closest(".layer-item");
        const idx = Number(row.dataset.layerIndex);
        const shape = shapes[idx];
        if (!shape) return;

        const original = shape.name || shape.type;
        const input = document.createElement("input");
        input.type = "text";
        input.value = original;
        input.style.width = "100px";

        function saveName() {
            const val = input.value.trim();
            shape.name = val || original;
            renderLayers();
        }

        input.addEventListener("blur", saveName);
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") saveName();
            if (e.key === "Escape") renderLayers();
        });

        nameEl.replaceWith(input);
        input.focus();
        input.select();
    });

    // ========================================================================
    // 15. PROPERTIES & MEASUREMENTS PANELS
    // ========================================================================
    function updatePropertiesPanel() {
        if (!propertiesFields) return;

        if (!selectedShape) {
            if (propertiesSelection) propertiesSelection.textContent = "No selection";
            propertiesFields.innerHTML = `<p>Select a shape to edit its properties</p>`;
            return;
        }

        const shape = selectedShape;
        if (propertiesSelection) {
            propertiesSelection.textContent = shape.name || shape.type;
        }

        const strokeWidth = shape.type === "line" ? shape.width : shape.strokeWidth;
        const isFillable =
            shape.type === "circle" ||
            shape.type === "ellipse" ||
            shape.type === "rectangle" ||
            shape.type === "path";

        let html = `
            <div class="property-group">
                <h4>Stroke</h4>
                <div class="property-field">
                    <span>Color</span>
                    <input type="color" data-style="stroke-color" value="${shape.color}">
                </div>
                <div class="property-field">
                    <span>Width</span>
                    <input type="number" data-style="stroke-width" min="0.1" max="5" step="0.1" value="${strokeWidth}">
                </div>
            </div>
        `;

        if (isFillable) {
            const fillEnabled = shape.fill !== "none";
            const fillColor = fillEnabled ? shape.fill : (shape.fillColor || "#ffffff");

            html += `
                <div class="property-group">
                    <h4>Fill</h4>
                    <div class="property-inline-row">
                        <div class="property-field">
                            <span>Color</span>
                            <input type="color" data-style="fill-color" value="${fillColor}" ${!fillEnabled ? "disabled" : ""}>
                        </div>
                        <label class="property-checkbox">
                            <input type="checkbox" data-style="fill-toggle" ${fillEnabled ? "checked" : ""}>
                            <span>Enabled</span>
                        </label>
                    </div>
                </div>
            `;
        }

        if (shape.type === "path") {
            html += `
                <div class="property-group">
                    <h4>Path Options</h4>
                    <div class="property-field">
                        <span>Vertices</span>
                        <span>${shape.points?.length || 0} pts</span>
                    </div>
                    <label class="property-checkbox" style="margin-top: 4px;">
                        <input type="checkbox" data-style="path-curve-toggle" ${shape.curved ? "checked" : ""}>
                        <span>Smooth curve mode</span>
                    </label>
                </div>
            `;
        }

        propertiesFields.innerHTML = html;
    }

    propertiesFields?.addEventListener("change", event => {
        const input = event.target;
        if (!input.matches("[data-style]") || !selectedShape || selectedShape.locked || selectedShape.hidden) return;

        beginHistoryAction();
        const shape = selectedShape;
        const style = input.dataset.style;

        if (style === "stroke-color") {
            shape.color = input.value;
            if (shape.type === "path") updatePathShape(shape);
            else shape.element.setAttribute("stroke", shape.color);
        } else if (style === "stroke-width") {
            const val = Math.max(0.1, Math.min(5, Number(input.value) || 2));
            if (shape.type === "line") {
                shape.width = val;
                shape.element.setAttribute("stroke-width", val);
            } else if (shape.type === "path") {
                shape.strokeWidth = val;
                updatePathShape(shape);
            } else {
                shape.strokeWidth = val;
                shape.element.setAttribute("stroke-width", val);
            }
        } else if (style === "fill-toggle") {
            shape.fill = input.checked ? (shape.fillColor || "#ffffff") : "none";
            shape.element.setAttribute("fill", shape.fill);
            updatePropertiesPanel();
        } else if (style === "fill-color") {
            shape.fillColor = input.value;
            shape.fill = input.value;
            shape.element.setAttribute("fill", shape.fill);
        } else if (style === "path-curve-toggle") {
            shape.curved = input.checked;
            updatePathShape(shape);
        }

        updateSVGSource();
        commitHistoryAction();
    });

    function createMeasurementInput(label, value, fieldKey, editable = true) {
        const formatted = Number(Number(value).toFixed(2));
        return `
            <div class="measurement-field">
                <label>${label}</label>
                <input type="number" step="0.1" ${editable ? "" : "readonly disabled"} data-measurement="${fieldKey}" value="${formatted}">
            </div>
        `;
    }

    function updateMeasurementPanel() {
        if (!measurementFields) return;

        if (!selectedShape) {
            if (measurementSelection) measurementSelection.textContent = "No selection";
            measurementFields.innerHTML = `<p>Select a shape to view measurements</p>`;
            return;
        }

        const shape = selectedShape;
        if (measurementSelection) {
            measurementSelection.textContent = shape.name || shape.type;
        }

        let html = "";

        if (shape.type === "line") {
            const len = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1);
            html += createMeasurementInput("X1", shape.x1, "x1");
            html += createMeasurementInput("Y1", shape.y1, "y1");
            html += createMeasurementInput("X2", shape.x2, "x2");
            html += createMeasurementInput("Y2", shape.y2, "y2");
            html += createMeasurementInput("Length", len, "length", false);
        } else if (shape.type === "curve") {
            html += createMeasurementInput("Center X", shape.cx, "cx");
            html += createMeasurementInput("Center Y", shape.cy, "cy");
            html += createMeasurementInput("Radius", shape.radius, "radius");
            html += createMeasurementInput("Start (°)", shape.startAngle * (180 / Math.PI), "startDeg");
            html += createMeasurementInput("End (°)", shape.endAngle * (180 / Math.PI), "endDeg");
        } else if (shape.type === "circle") {
            html += createMeasurementInput("Center X", shape.cx, "cx");
            html += createMeasurementInput("Center Y", shape.cy, "cy");
            html += createMeasurementInput("Radius", shape.radius, "radius");
            html += createMeasurementInput("Diameter", shape.radius * 2, "diameter", false);
        } else if (shape.type === "ellipse") {
            html += createMeasurementInput("Center X", shape.cx, "cx");
            html += createMeasurementInput("Center Y", shape.cy, "cy");
            html += createMeasurementInput("Radius X", shape.rx, "rx");
            html += createMeasurementInput("Radius Y", shape.ry, "ry");
            html += createMeasurementInput("Width", shape.rx * 2, "ellipse-width", false);
            html += createMeasurementInput("Height", shape.ry * 2, "ellipse-height", false);
        } else if (shape.type === "rectangle") {
            html += createMeasurementInput("X", shape.x, "x");
            html += createMeasurementInput("Y", shape.y, "y");
            html += createMeasurementInput("Width", shape.width, "width");
            html += createMeasurementInput("Height", shape.height, "height");
        } else if (shape.type === "path") {
            const b = getAlignmentBounds(shape);
            if (b) {
                html += createMeasurementInput("Min X", b.left, "left", false);
                html += createMeasurementInput("Min Y", b.top, "top", false);
                html += createMeasurementInput("Width", b.right - b.left, "width", false);
                html += createMeasurementInput("Height", b.bottom - b.top, "height", false);
            }
            html += createMeasurementInput("Vertices", shape.points?.length || 0, "vertices", false);
            html += createMeasurementInput("Holes", shape.holes?.length || 0, "holes", false);
        }

        measurementFields.innerHTML = html;
    }

    measurementFields?.addEventListener("change", event => {
        const input = event.target;
        const key = input.dataset.measurement;
        const val = Number(input.value);
        if (!key || isNaN(val) || !selectedShape || selectedShape.locked || selectedShape.hidden) return;

        beginHistoryAction();
        const shape = selectedShape;

        if (shape.type === "line") {
            if (key === "x1") shape.x1 = val;
            if (key === "y1") shape.y1 = val;
            if (key === "x2") shape.x2 = val;
            if (key === "y2") shape.y2 = val;
            updateLine(shape);
        } else if (shape.type === "curve") {
            if (key === "cx") shape.cx = val;
            if (key === "cy") shape.cy = val;
            if (key === "radius") shape.radius = Math.max(0.2, val);
            if (key === "startDeg") shape.startAngle = val * (Math.PI / 180);
            if (key === "endDeg") shape.endAngle = val * (Math.PI / 180);
            updateCurve(shape);
        } else if (shape.type === "circle") {
            if (key === "cx") shape.cx = val;
            if (key === "cy") shape.cy = val;
            if (key === "radius") shape.radius = Math.max(0.2, val);
            updateBasicShape(shape);
        } else if (shape.type === "ellipse") {
            if (key === "cx") shape.cx = val;
            if (key === "cy") shape.cy = val;
            if (key === "rx") shape.rx = Math.max(0.2, val);
            if (key === "ry") shape.ry = Math.max(0.2, val);

            updateBasicShape(shape);
            updateMeasurementPanel();
        } else if (shape.type === "rectangle") {
            if (key === "x") shape.x = val;
            if (key === "y") shape.y = val;
            if (key === "width") shape.width = Math.max(0.2, val);
            if (key === "height") shape.height = Math.max(0.2, val);
            updateBasicShape(shape);
        }

        commitHistoryAction();
    });

    // ========================================================================
    // 16. ALIGNMENT, TRANSFORM, DUPLICATE & FLIP TOOLS
    // ========================================================================
    function alignSelectedShapes(direction) {
        const targets = selectedShapes.length ? selectedShapes : (selectedShape ? [selectedShape] : []);
        if (targets.length === 0) return;

        beginHistoryAction();

        if (targets.length === 1) {
            // Align single shape to 24×24 workspace boundaries
            const shape = targets[0];
            const b = getAlignmentBounds(shape);
            if (!b) return;

            const w = b.right - b.left;
            const h = b.bottom - b.top;
            let dx = 0;
            let dy = 0;

            if (direction === "align-left") dx = -b.left;
            if (direction === "align-center-x") dx = 12 - (b.left + w / 2);
            if (direction === "align-right") dx = 24 - b.right;
            if (direction === "align-top") dy = -b.top;
            if (direction === "align-middle-y") dy = 12 - (b.top + h / 2);
            if (direction === "align-bottom") dy = 24 - b.bottom;

            translateShape(shape, dx, dy);
        } else {
            // Multi-shape alignment
            const allBounds = targets.map(getAlignmentBounds).filter(Boolean);
            const minX = Math.min(...allBounds.map(b => b.left));
            const maxX = Math.max(...allBounds.map(b => b.right));
            const centerX = (minX + maxX) / 2;

            const minY = Math.min(...allBounds.map(b => b.top));
            const maxY = Math.max(...allBounds.map(b => b.bottom));
            const centerY = (minY + maxY) / 2;

            targets.forEach(shape => {
                const b = getAlignmentBounds(shape);
                if (!b) return;
                let dx = 0;
                let dy = 0;

                if (direction === "align-left") dx = minX - b.left;
                if (direction === "align-center-x") dx = centerX - (b.left + (b.right - b.left) / 2);
                if (direction === "align-right") dx = maxX - b.right;
                if (direction === "align-top") dy = minY - b.top;
                if (direction === "align-middle-y") dy = centerY - (b.top + (b.bottom - b.top) / 2);
                if (direction === "align-bottom") dy = maxY - b.bottom;

                translateShape(shape, dx, dy);
            });
        }

        commitHistoryAction();
        showToast("Shapes aligned", "info");
    }

    function translateShape(shape, dx, dy) {
        if (shape.type === "line") {
            shape.x1 += dx; shape.y1 += dy;
            shape.x2 += dx; shape.y2 += dy;
            updateLine(shape);
        } else if (shape.type === "curve" || shape.type === "circle") {
            shape.cx += dx; shape.cy += dy;
            if (shape.type === "curve") updateCurve(shape);
            else updateBasicShape(shape);
        } else if (shape.type === "rectangle") {
            shape.x += dx; shape.y += dy;
            updateBasicShape(shape);
        } else if (shape.type === "path") {
            shape.points.forEach(p => { p.x += dx; p.y += dy; });
            (shape.holes || []).forEach(h => {
                const pts = Array.isArray(h) ? h : h.points;
                pts.forEach(p => { p.x += dx; p.y += dy; });
            });
            updatePathShape(shape);
        }
    }

    function flipSelectedShapes(axis) {
        const targets = selectedShapes.length ? selectedShapes : (selectedShape ? [selectedShape] : []);
        if (!targets.length) return;

        beginHistoryAction();

        targets.forEach(shape => {
            const b = getAlignmentBounds(shape);
            if (!b) return;
            const midX = (b.left + b.right) / 2;
            const midY = (b.top + b.bottom) / 2;

            if (axis === "h") {
                if (shape.type === "line") {
                    shape.x1 = midX - (shape.x1 - midX);
                    shape.x2 = midX - (shape.x2 - midX);
                    updateLine(shape);
                } else if (shape.type === "curve") {
                    shape.cx = midX - (shape.cx - midX);
                    shape.startAngle = Math.PI - shape.startAngle;
                    shape.endAngle = Math.PI - shape.endAngle;
                    updateCurve(shape);
                } else if (shape.type === "circle") {
                    shape.cx = midX - (shape.cx - midX);
                    updateBasicShape(shape);
                } else if (shape.type === "rectangle") {
                    shape.x = midX - (shape.x + shape.width - midX);
                    updateBasicShape(shape);
                } else if (shape.type === "path") {
                    shape.points.forEach(p => { p.x = midX - (p.x - midX); });
                    (shape.holes || []).forEach(h => {
                        const pts = Array.isArray(h) ? h : h.points;
                        pts.forEach(p => { p.x = midX - (p.x - midX); });
                    });
                    updatePathShape(shape);
                }
            } else if (axis === "v") {
                if (shape.type === "line") {
                    shape.y1 = midY - (shape.y1 - midY);
                    shape.y2 = midY - (shape.y2 - midY);
                    updateLine(shape);
                } else if (shape.type === "curve") {
                    shape.cy = midY - (shape.cy - midY);
                    shape.startAngle = -shape.startAngle;
                    shape.endAngle = -shape.endAngle;
                    updateCurve(shape);
                } else if (shape.type === "circle") {
                    shape.cy = midY - (shape.cy - midY);
                    updateBasicShape(shape);
                } else if (shape.type === "rectangle") {
                    shape.y = midY - (shape.y + shape.height - midY);
                    updateBasicShape(shape);
                } else if (shape.type === "path") {
                    shape.points.forEach(p => { p.y = midY - (p.y - midY); });
                    (shape.holes || []).forEach(h => {
                        const pts = Array.isArray(h) ? h : h.points;
                        pts.forEach(p => { p.y = midY - (p.y - midY); });
                    });
                    updatePathShape(shape);
                }
            }
        });

        if (selectedShape) createHandlesForShape(selectedShape);
        updateMeasurementPanel();
        updatePropertiesPanel();
        commitHistoryAction();
        showToast(`Flipped ${axis === "h" ? "horizontally" : "vertically"}`, "info");
    }

    function mirrorSelectedShapes(axis) {
        const targets = selectedShapes.length ? selectedShapes : (selectedShape ? [selectedShape] : []);
        if (!targets.length) return;

        beginHistoryAction();
        const mid = artboardSize / 2;

        targets.forEach(shape => {
            if (axis === "h") {
                if (shape.type === "line") {
                    shape.y1 = artboardSize - shape.y1;
                    shape.y2 = artboardSize - shape.y2;
                    updateLine(shape);
                } else if (shape.type === "curve") {
                    shape.cy = artboardSize - shape.cy;
                    shape.startAngle = -shape.startAngle;
                    shape.endAngle = -shape.endAngle;
                    updateCurve(shape);
                } else if (shape.type === "circle") {
                    shape.cy = artboardSize - shape.cy;
                    updateBasicShape(shape);
                } else if (shape.type === "rectangle") {
                    shape.y = artboardSize - (shape.y + shape.height);
                    updateBasicShape(shape);
                } else if (shape.type === "path") {
                    shape.points.forEach(p => { p.y = artboardSize - p.y; });
                    (shape.holes || []).forEach(h => {
                        const pts = Array.isArray(h) ? h : h.points;
                        pts.forEach(p => { p.y = artboardSize - p.y; });
                    });
                    updatePathShape(shape);
                }
            } else if (axis === "v") {
                if (shape.type === "line") {
                    shape.x1 = artboardSize - shape.x1;
                    shape.x2 = artboardSize - shape.x2;
                    updateLine(shape);
                } else if (shape.type === "curve") {
                    shape.cx = artboardSize - shape.cx;
                    shape.startAngle = Math.PI - shape.startAngle;
                    shape.endAngle = Math.PI - shape.endAngle;
                    updateCurve(shape);
                } else if (shape.type === "circle") {
                    shape.cx = artboardSize - shape.cx;
                    updateBasicShape(shape);
                } else if (shape.type === "rectangle") {
                    shape.x = artboardSize - (shape.x + shape.width);
                    updateBasicShape(shape);
                } else if (shape.type === "path") {
                    shape.points.forEach(p => { p.x = artboardSize - p.x; });
                    (shape.holes || []).forEach(h => {
                        const pts = Array.isArray(h) ? h : h.points;
                        pts.forEach(p => { p.x = artboardSize - p.x; });
                    });
                    updatePathShape(shape);
                }
            }
        });

        if (selectedShape) createHandlesForShape(selectedShape);
        updateMeasurementPanel();
        updatePropertiesPanel();
        commitHistoryAction();
        showToast(`Mirrored ${axis === "h" ? "horizontally" : "vertically"} across artboard`, "info");
    }

    function mirrorAcrossCustomAxis() {
        if (!customMirrorAxes.length) {
            showToast("No custom mirror axis set. Click 'Custom Axis' and select 2 points on canvas.", "warning");
            return;
        }
        const axis = customMirrorAxes[0];
        const targets = selectedShapes.length ? selectedShapes : (selectedShape ? [selectedShape] : []);
        if (!targets.length) return;

        beginHistoryAction();

        targets.forEach(shape => {
            if (shape.type === "line") {
                const p1 = reflectPointAcrossLine(shape.x1, shape.y1, axis.x1, axis.y1, axis.x2, axis.y2);
                const p2 = reflectPointAcrossLine(shape.x2, shape.y2, axis.x1, axis.y1, axis.x2, axis.y2);
                shape.x1 = p1.x; shape.y1 = p1.y;
                shape.x2 = p2.x; shape.y2 = p2.y;
                updateLine(shape);
            } else if (shape.type === "circle") {
                const c = reflectPointAcrossLine(shape.cx, shape.cy, axis.x1, axis.y1, axis.x2, axis.y2);
                shape.cx = c.x; shape.cy = c.y;
                updateBasicShape(shape);
            } else if (shape.type === "curve") {
                const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
                const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);
                const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
                const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);
                const pStart = reflectPointAcrossLine(startX, startY, axis.x1, axis.y1, axis.x2, axis.y2);
                const pEnd = reflectPointAcrossLine(endX, endY, axis.x1, axis.y1, axis.x2, axis.y2);
                const pCenter = reflectPointAcrossLine(shape.cx, shape.cy, axis.x1, axis.y1, axis.x2, axis.y2);
                shape.cx = pCenter.x;
                shape.cy = pCenter.y;
                shape.startAngle = Math.atan2(pEnd.y - shape.cy, pEnd.x - shape.cx);
                shape.endAngle = Math.atan2(pStart.y - shape.cy, pStart.x - shape.cx);
                updateCurve(shape);
            } else if (shape.type === "rectangle") {
                const p1 = reflectPointAcrossLine(shape.x, shape.y, axis.x1, axis.y1, axis.x2, axis.y2);
                const p2 = reflectPointAcrossLine(shape.x + shape.width, shape.y + shape.height, axis.x1, axis.y1, axis.x2, axis.y2);
                shape.x = Math.min(p1.x, p2.x);
                shape.y = Math.min(p1.y, p2.y);
                shape.width = Math.abs(p2.x - p1.x);
                shape.height = Math.abs(p2.y - p1.y);
                updateBasicShape(shape);
            } else if (shape.type === "path") {
                shape.points = shape.points.map(p => reflectPointAcrossLine(p.x, p.y, axis.x1, axis.y1, axis.x2, axis.y2));
                (shape.holes || []).forEach(h => {
                    const pts = Array.isArray(h) ? h : h.points;
                    const reflected = pts.map(p => reflectPointAcrossLine(p.x, p.y, axis.x1, axis.y1, axis.x2, axis.y2));
                    if (Array.isArray(h)) {
                        h.splice(0, h.length, ...reflected);
                    } else {
                        h.points = reflected;
                    }
                });
                updatePathShape(shape);
            }
        });

        if (selectedShape) createHandlesForShape(selectedShape);
        updateMeasurementPanel();
        updatePropertiesPanel();
        commitHistoryAction();
        showToast("Mirrored across custom axis", "success");
    }

    function duplicateAndMirrorSelectedShapes() {
        const targets = selectedShapes.length ? selectedShapes : (selectedShape ? [selectedShape] : []);
        if (!targets.length) return;

        duplicateSelectedShapes();
        if (customMirrorAxes.length) {
            mirrorAcrossCustomAxis();
        } else {
            mirrorSelectedShapes("v");
        }
    }

    function removeShape(shape) {
        shape.handles?.forEach(h => h.remove());
        shape.handles = [];
        getShapeElements(shape).forEach(el => el.remove());
    }

    function duplicateSelectedShapes() {
        const targets = selectedShapes.length ? selectedShapes : (selectedShape ? [selectedShape] : []);
        if (!targets.length) return;

        beginHistoryAction();
        const created = [];

        targets.forEach(shape => {
            const data = {};
            Object.keys(shape).forEach(k => {
                if (!shapeDOMKeys.has(k)) data[k] = structuredClone(shape[k]);
            });

            // Offset copy (preserves path points AND cutout holes)
            if (data.type === "line") {
                data.x1 += COPY_OFFSET; data.x2 += COPY_OFFSET;
                data.y1 += COPY_OFFSET; data.y2 += COPY_OFFSET;
                        } else if (
                data.type === "curve" ||
                data.type === "circle" ||
                data.type === "ellipse"
            ) {
                data.cx += COPY_OFFSET; data.cy += COPY_OFFSET;
            } else if (data.type === "rectangle") {
                data.x += COPY_OFFSET; data.y += COPY_OFFSET;
            } else if (data.type === "path") {
                data.points = (data.points || []).map(p => ({ x: p.x + COPY_OFFSET, y: p.y + COPY_OFFSET }));
                data.holes = (data.holes || []).map(h => {
                    const pts = Array.isArray(h) ? h : h.points;
                    const mapped = (pts || []).map(p => ({ x: p.x + COPY_OFFSET, y: p.y + COPY_OFFSET }));
                    return Array.isArray(h) ? mapped : { ...h, points: mapped };
                });
            }

            const newShape = createShapeFromCopy(data);
            if (newShape) created.push(newShape);
        });

        selectedShapes = created;
        selectedShape = created[0] || null;
        renderLayers();
        updateSVGSource();
        commitHistoryAction();
        showToast("Duplicated selection", "success");
    }

    function createShapeFromCopy(data) {
        let shape;

        if (data.type === "line") {
            createLine(data.x1, data.y1);
            shape = shapes[shapes.length - 1];
            Object.assign(shape, data);
            updateLine(shape);
        } else if (data.type === "curve") {
            createCurve(data.cx, data.cy);
            shape = shapes[shapes.length - 1];
            Object.assign(shape, data);
            updateCurve(shape);
        } else if (
            data.type === "circle" ||
            data.type === "ellipse" ||
            data.type === "rectangle"
        ) {
            createOtherShape(data.type, 12, 12);
            shape = shapes[shapes.length - 1];
            Object.assign(shape, data);
            updateBasicShape(shape);
        } else if (data.type === "path") {
            const el = document.createElementNS(SVG_NS, "path");

            shape = {
                ...structuredClone(data),
                element: el,
                handles: []
            };

            workspace.appendChild(el);
            shapes.push(shape);

            updatePathShape(shape);
        }

        return shape;
    }

    transformToolbar?.addEventListener("click", event => {
        const btn = event.target.closest(".tool-action-btn");
        if (!btn) return;
        const action = btn.dataset.action;

        if (action.startsWith("align-")) alignSelectedShapes(action);
        else if (action === "flip-h") flipSelectedShapes("h");
        else if (action === "flip-v") flipSelectedShapes("v");
        else if (action === "custom-mirror-axis") {
            isPlacingMirrorAxis = !isPlacingMirrorAxis;
            customMirrorStart = null;
            btn.classList.toggle("active", isPlacingMirrorAxis);
            if (isPlacingMirrorAxis) {
                showToast("Click 2 points on the canvas to place a custom mirror axis", "info");
            } else {
                showToast("Custom mirror tool canceled", "info");
            }
        }
        else if (action === "custom-mirror") mirrorAcrossCustomAxis();
        else if (action === "duplicate-mirror") duplicateAndMirrorSelectedShapes();
        else if (action === "duplicate") duplicateSelectedShapes();
        else if (action === "bring-front") {
            if (selectedShape) {
                const idx = shapes.indexOf(selectedShape);
                if (idx !== -1 && idx < shapes.length - 1) reorderShape(idx, 1);
            }
        }
    });

    liveSymmetryHCheckbox?.addEventListener("change", e => {
        liveSymmetryH = e.target.checked;
        showToast(`Horizontal live symmetry ${liveSymmetryH ? "enabled" : "disabled"}`, "info");
    });

    liveSymmetryVCheckbox?.addEventListener("change", e => {
        liveSymmetryV = e.target.checked;
        showToast(`Vertical live symmetry ${liveSymmetryV ? "enabled" : "disabled"}`, "info");
    });

    deleteButton?.addEventListener("click", () => {
        const targets = selectedShapes.length ? [...selectedShapes] : (selectedShape ? [selectedShape] : []);
        if (!targets.length) return;

        beginHistoryAction();
        targets.forEach(s => removeShape(s));
        shapes = shapes.filter(s => !targets.includes(s));
        selectShape(null);
        renderLayers();
        updateSVGSource();
        commitHistoryAction();
        showToast("Deleted shape(s)", "info");
    });

    // ========================================================================
    // 17. SVG SOURCE CODE & ROBUST PARSER
    // ========================================================================
    function formatSVGNumber(value) {
        return Number(Number(value).toFixed(3)).toString();
    }

    function generateSVG(colorMode = "original") {
        return generateSVGFromShapes(shapes, colorMode);
    }

    function generateSVGFromShapes(sourceShapes, colorMode = "original") {
        const artwork = [];

        sourceShapes.forEach(shape => {
            if (shape.hidden) return;

            let strokeColor = shape.color;
            if (colorMode === "white") strokeColor = "#FFFFFF";
            else if (colorMode === "black") strokeColor = "#000000";
            else if (colorMode === "accent") strokeColor = document.body.getAttribute("data-accent") || "#ff0077";

            if (shape.type === "line") {
                artwork.push(`    <line x1="${formatSVGNumber(shape.x1)}" y1="${formatSVGNumber(shape.y1)}" x2="${formatSVGNumber(shape.x2)}" y2="${formatSVGNumber(shape.y2)}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.width)}" stroke-linecap="${shape.cap || "round"}"/>`);
            } else if (shape.type === "curve") {
                const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
                const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);
                const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
                const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);

                let delta = shape.endAngle - shape.startAngle;
                while (delta < 0) delta += Math.PI * 2;
                while (delta >= Math.PI * 2) delta -= Math.PI * 2;
                const largeArc = delta > Math.PI ? 1 : 0;

                const pathD = `M ${formatSVGNumber(startX)} ${formatSVGNumber(startY)} A ${formatSVGNumber(shape.radius)} ${formatSVGNumber(shape.radius)} 0 ${largeArc} 1 ${formatSVGNumber(endX)} ${formatSVGNumber(endY)}`;
                artwork.push(`    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round"/>`);
            } else if (shape.type === "path") {

                // Imported SVG path: preserve its original Bézier geometry
                if (typeof shape.svgPathData === "string") {

                    const transform =
                        shape.offsetX || shape.offsetY
                            ? ` transform="translate(${formatSVGNumber(shape.offsetX || 0)} ${formatSVGNumber(shape.offsetY || 0)})"`
                            : "";

                    artwork.push(
                        `    <path d="${shape.svgPathData}"${transform} fill="${shape.fill || "none"}" fill-rule="evenodd" stroke="${strokeColor || "none"}" stroke-width="${formatSVGNumber(shape.strokeWidth || 2)}" stroke-linecap="round" stroke-linejoin="round"/>`
                    );

                } else {

                    const hasHoles = shape.holes && shape.holes.length > 0;
                    const outerPathData = createPathData(shape.points, shape.curved);

                    if (hasHoles) {
                        const parts = getPathParts(shape);
                        const compoundPathData = parts.map(item =>
                            createPathData(item.points, item.curved)
                        ).join(" ");

                        if (shape.fill && shape.fill !== "none") {
                            artwork.push(
                                `    <path d="${compoundPathData}" fill="${shape.fill}" fill-rule="evenodd" stroke="none"/>`
                            );
                        }

                        if (shape.strokeWidth && strokeColor && strokeColor !== "none") {
                            artwork.push(
                                `    <path d="${compoundPathData}" fill="none" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`
                            );
                        }

                    } else {
                        artwork.push(
                            `    <path d="${outerPathData}" fill="${shape.fill || "none"}" fill-rule="evenodd" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`
                        );
                    }
                }
            } else if (shape.type === "circle") {
                artwork.push(`    <circle cx="${formatSVGNumber(shape.cx)}" cy="${formatSVGNumber(shape.cy)}" r="${formatSVGNumber(shape.radius)}" fill="${shape.fill || "none"}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`);
            } else if (shape.type === "ellipse") {
                artwork.push(
                    `    <ellipse cx="${formatSVGNumber(shape.cx)}" cy="${formatSVGNumber(shape.cy)}" rx="${formatSVGNumber(shape.rx)}" ry="${formatSVGNumber(shape.ry)}" fill="${shape.fill || "none"}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`
                );
            } else if (shape.type === "rectangle") {
                artwork.push(`    <rect x="${formatSVGNumber(shape.x)}" y="${formatSVGNumber(shape.y)}" width="${formatSVGNumber(shape.width)}" height="${formatSVGNumber(shape.height)}" fill="${shape.fill || "none"}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`);
            }
        });

        return [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${artboardSize}" height="${artboardSize}" viewBox="0 0 ${artboardSize} ${artboardSize}">`,
            artwork.join("\n"),
            `</svg>`
        ].join("\n");
    }

    function updateSVGSource() {
        if (!svgCode) return;
        svgCode.value = generateSVG();
    }

    function parseSVGPathSegments(d) {
        if (typeof d !== "string") {
            throw new Error("SVG path data must be a string.");
        }

        // Tokenize SVG commands and numbers, including scientific notation.
        const tokenRegex =
            /[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g;

        const tokens = [];
        let match;
        let lastIndex = 0;

        while ((match = tokenRegex.exec(d)) !== null) {
            const skipped = d.slice(lastIndex, match.index);

            // Only SVG separators are allowed between tokens.
            if (!/^[\s,]*$/.test(skipped)) {
                throw new Error(
                    `Invalid SVG path data near: "${skipped}"`
                );
            }

            tokens.push(match[0]);
            lastIndex = tokenRegex.lastIndex;
        }

        if (!/^[\s,]*$/.test(d.slice(lastIndex))) {
            throw new Error("Invalid characters at the end of SVG path data.");
        }

        const segments = [];

        let i = 0;
        let command = null;

        let x = 0;
        let y = 0;

        let startX = 0;
        let startY = 0;

        let segmentCounter = 0;
        let anchorCounter = 0;
        let subpathCounter = 0;

        let currentAnchorId = null;
        let subpathStartAnchorId = null;
        let currentSubpathId = null;

        let previousControl = null;
        let previousCurveType = null;

        const isCommand = token => /^[a-zA-Z]$/.test(token);

        function readNumber() {
            if (i >= tokens.length || isCommand(tokens[i])) {
                throw new Error(
                    `Not enough parameters for SVG command "${command}".`
                );
            }

            const value = Number(tokens[i++]);

            if (!Number.isFinite(value)) {
                throw new Error("Invalid number in SVG path data.");
            }

            return value;
        }

        function hasNumbers() {
            return i < tokens.length && !isCommand(tokens[i]);
        }

        function createAnchorId() {
            return `anchor-${++anchorCounter}`;
        }

        function createSegment(type, data, startId, endId) {
            return {
                id: `segment-${++segmentCounter}`,
                type,
                command,
                subpathId: currentSubpathId,

                startAnchorId: startId,
                endAnchorId: endId,

                ...data
            };
        }

        function resetCurveControl() {
            previousControl = null;
            previousCurveType = null;
        }

        while (i < tokens.length) {
            if (isCommand(tokens[i])) {
                command = tokens[i++];
            } else if (!command) {
                throw new Error("SVG path must begin with a command.");
            }

            const relative = command === command.toLowerCase();
            const type = command.toUpperCase();

            if (!"MLHVCSQTAZ".includes(type)) {
                throw new Error(`Unsupported SVG path command: "${command}".`);
            }

            // Close the current subpath.
            if (type === "Z") {
                if (!currentAnchorId || !subpathStartAnchorId) {
                    throw new Error("Close command has no active subpath.");
                }

                segments.push(
                    createSegment(
                        "close",
                        {
                            x1: x,
                            y1: y,
                            x: startX,
                            y: startY,
                            startX,
                            startY
                        },
                        currentAnchorId,
                        subpathStartAnchorId
                    )
                );

                x = startX;
                y = startY;
                currentAnchorId = subpathStartAnchorId;

                resetCurveControl();

                // Z cannot repeat without another command.
                command = null;
                continue;
            }

            if (!hasNumbers()) {
                throw new Error(
                    `SVG command "${command}" is missing its parameters.`
                );
            }

            const ox = x;
            const oy = y;

            let segment;
            let nx;
            let ny;

            // Move and line commands.
            if (type === "M" || type === "L" || type === "T") {
                nx = readNumber();
                ny = readNumber();

                if (relative) {
                    nx += ox;
                    ny += oy;
                }

                if (type === "M") {
                    currentSubpathId = `subpath-${++subpathCounter}`;

                    const newAnchorId = createAnchorId();

                    segment = createSegment(
                        "move",
                        {
                            x1: ox,
                            y1: oy,
                            x: nx,
                            y: ny
                        },
                        null,
                        newAnchorId
                    );

                    startX = nx;
                    startY = ny;

                    currentAnchorId = newAnchorId;
                    subpathStartAnchorId = newAnchorId;

                    // Following coordinate pairs after M become L.
                    command = relative ? "l" : "L";

                    resetCurveControl();
                } else {
                    const newAnchorId = createAnchorId();

                    if (type === "T") {
                        const canReflect =
                            previousCurveType === "quadratic";

                        const cx = canReflect && previousControl
                            ? 2 * ox - previousControl.x
                            : ox;

                        const cy = canReflect && previousControl
                            ? 2 * oy - previousControl.y
                            : oy;

                        segment = createSegment(
                            "smooth-quadratic",
                            {
                                x1: ox,
                                y1: oy,
                                cx,
                                cy,
                                x: nx,
                                y: ny
                            },
                            currentAnchorId,
                            newAnchorId
                        );

                        previousControl = { x: cx, y: cy };
                        previousCurveType = "quadratic";
                    } else {
                        segment = createSegment(
                            "line",
                            {
                                x1: ox,
                                y1: oy,
                                x: nx,
                                y: ny
                            },
                            currentAnchorId,
                            newAnchorId
                        );

                        resetCurveControl();
                    }

                    currentAnchorId = newAnchorId;
                }

                x = nx;
                y = ny;
            }

            // Horizontal and vertical lines.
            else if (type === "H" || type === "V") {
                const value = readNumber();

                nx = type === "H"
                    ? (relative ? ox + value : value)
                    : ox;

                ny = type === "V"
                    ? (relative ? oy + value : value)
                    : oy;

                const newAnchorId = createAnchorId();

                segment = createSegment(
                    "line",
                    {
                        x1: ox,
                        y1: oy,
                        x: nx,
                        y: ny
                    },
                    currentAnchorId,
                    newAnchorId
                );

                x = nx;
                y = ny;
                currentAnchorId = newAnchorId;

                resetCurveControl();
            }

            // Cubic Bezier curves.
            else if (type === "C") {
                let cx1 = readNumber();
                let cy1 = readNumber();
                let cx2 = readNumber();
                let cy2 = readNumber();

                nx = readNumber();
                ny = readNumber();

                if (relative) {
                    cx1 += ox;
                    cy1 += oy;
                    cx2 += ox;
                    cy2 += oy;
                    nx += ox;
                    ny += oy;
                }

                const newAnchorId = createAnchorId();

                segment = createSegment(
                    "cubic",
                    {
                        x1: ox,
                        y1: oy,
                        cx1,
                        cy1,
                        cx2,
                        cy2,
                        x: nx,
                        y: ny
                    },
                    currentAnchorId,
                    newAnchorId
                );

                previousControl = { x: cx2, y: cy2 };
                previousCurveType = "cubic";

                x = nx;
                y = ny;
                currentAnchorId = newAnchorId;
            }

            // Smooth cubic Bezier curves.
            else if (type === "S") {
                let cx2 = readNumber();
                let cy2 = readNumber();

                nx = readNumber();
                ny = readNumber();

                if (relative) {
                    cx2 += ox;
                    cy2 += oy;
                    nx += ox;
                    ny += oy;
                }

                const canReflect =
                    previousCurveType === "cubic";

                const cx1 = canReflect && previousControl
                    ? 2 * ox - previousControl.x
                    : ox;

                const cy1 = canReflect && previousControl
                    ? 2 * oy - previousControl.y
                    : oy;

                const newAnchorId = createAnchorId();

                segment = createSegment(
                    "smooth-cubic",
                    {
                        x1: ox,
                        y1: oy,
                        cx1,
                        cy1,
                        cx2,
                        cy2,
                        x: nx,
                        y: ny
                    },
                    currentAnchorId,
                    newAnchorId
                );

                previousControl = { x: cx2, y: cy2 };
                previousCurveType = "cubic";

                x = nx;
                y = ny;
                currentAnchorId = newAnchorId;
            }

            // Quadratic Bezier curves.
            else if (type === "Q") {
                let cx = readNumber();
                let cy = readNumber();

                nx = readNumber();
                ny = readNumber();

                if (relative) {
                    cx += ox;
                    cy += oy;
                    nx += ox;
                    ny += oy;
                }

                const newAnchorId = createAnchorId();

                segment = createSegment(
                    "quadratic",
                    {
                        x1: ox,
                        y1: oy,
                        cx,
                        cy,
                        x: nx,
                        y: ny
                    },
                    currentAnchorId,
                    newAnchorId
                );

                previousControl = { x: cx, y: cy };
                previousCurveType = "quadratic";

                x = nx;
                y = ny;
                currentAnchorId = newAnchorId;
            }

            // Elliptical arc segments.
            else if (type === "A") {
                const rx = readNumber();
                const ry = readNumber();
                const rotation = readNumber();
                const largeArc = readNumber();
                const sweep = readNumber();

                nx = readNumber();
                ny = readNumber();

                if (relative) {
                    nx += ox;
                    ny += oy;
                }

                if (
                    (largeArc !== 0 && largeArc !== 1) ||
                    (sweep !== 0 && sweep !== 1)
                ) {
                    throw new Error("Invalid SVG arc flags.");
                }

                const newAnchorId = createAnchorId();

                segment = createSegment(
                    "arc",
                    {
                        x1: ox,
                        y1: oy,
                        rx: Math.abs(rx),
                        ry: Math.abs(ry),
                        rotation,
                        largeArc,
                        sweep,
                        x: nx,
                        y: ny
                    },
                    currentAnchorId,
                    newAnchorId
                );

                x = nx;
                y = ny;
                currentAnchorId = newAnchorId;

                resetCurveControl();
            }

            if (segment) {
                segments.push(segment);
            }
        }

        return segments;
    }
    function buildSVGAnchorMap(segments) {
        const anchorMap = new Map();

        function addAnchor(anchorId, x, y, segmentId, role) {
            if (!anchorId) return;

            if (!anchorMap.has(anchorId)) {
                anchorMap.set(anchorId, {
                    id: anchorId,
                    x,
                    y,
                    connectedSegments: []
                });
            }

            const anchor = anchorMap.get(anchorId);

            if (!anchor.connectedSegments.some(item => item.segmentId === segmentId && item.role === role)) {
                anchor.connectedSegments.push({
                    segmentId,
                    role
                });
            }
        }

        segments.forEach(segment => {
            // A segment's starting anchor.
            if (segment.startAnchorId) {
                addAnchor(
                    segment.startAnchorId,
                    segment.x1,
                    segment.y1,
                    segment.id,
                    "start"
                );
            }

            // A segment's ending anchor.
            if (segment.endAnchorId) {
                addAnchor(
                    segment.endAnchorId,
                    segment.x,
                    segment.y,
                    segment.id,
                    "end"
                );
            }
        });

        return Array.from(anchorMap.values());
    }

    // Bug Fix: Enhanced SVG Source Parser that accepts arbitrary paths and large arcs
    function readSVGSource() {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode.value, "image/svg+xml");
        if (doc.querySelector("parsererror")) {
            throw new Error("Invalid XML/SVG markup.");
        }

        const root = doc.documentElement;
        if (root.localName !== "svg") {
            throw new Error("Missing <svg> root element.");
        }

        const parsed = [];

        Array.from(root.children).forEach(el => {
            const tag = el.localName.toLowerCase();
            const stroke = el.getAttribute("stroke") || "#FFFFFF";
            const fill = el.getAttribute("fill") || "none";
            const strokeWidth = Math.max(0.1, Math.min(5, Number(el.getAttribute("stroke-width")) || 2));

            if (tag === "line") {
                parsed.push({
                    type: "line",
                    x1: Number(el.getAttribute("x1")) || 0,
                    y1: Number(el.getAttribute("y1")) || 0,
                    x2: Number(el.getAttribute("x2")) || 0,
                    y2: Number(el.getAttribute("y2")) || 0,
                    color: stroke,
                    strokeWidth,
                    width: strokeWidth
                });
            } else if (tag === "circle") {
                parsed.push({
                    type: "circle",
                    cx: Number(el.getAttribute("cx")) || 12,
                    cy: Number(el.getAttribute("cy")) || 12,
                    radius: Number(el.getAttribute("r")) || 2.5,
                    color: stroke,
                    fill,
                    strokeWidth
                });
            } else if (tag === "ellipse") {
                parsed.push({
                    type: "ellipse",
                    cx: Number(el.getAttribute("cx")) || 12,
                    cy: Number(el.getAttribute("cy")) || 12,
                    rx: Number(el.getAttribute("rx")) || 2.5,
                    ry: Number(el.getAttribute("ry")) || 2.5,
                    color: stroke,
                    fill,
                    strokeWidth
                });
            } else if (tag === "rect") {
                parsed.push({
                    type: "rectangle",
                    x: Number(el.getAttribute("x")) || 0,
                    y: Number(el.getAttribute("y")) || 0,
                    width: Number(el.getAttribute("width")) || 5,
                    height: Number(el.getAttribute("height")) || 4,
                    cornerRadius: parseFloat(el.getAttribute("rx")) || 0,
                    cornerRadiusY: parseFloat(el.getAttribute("ry")) || 0,
                    color: stroke,
                    fill,
                    strokeWidth
                });
            } else if (tag === "path") {
                const d = el.getAttribute("d") || "";

                if (d.trim()) {
                    parsed.push({
                        type: "path",
                        svgPathData: d,

                        // Individual editable SVG segments
                        svgEditableSegments: parseSVGPathSegments(d),
                        svgAnchors: buildSVGAnchorMap(parseSVGPathSegments(d)),

                        points: [],
                        holes: [],
                        curved: false,
                        color: stroke,
                        fill,
                        strokeWidth
                    });
                } else {
                    // Arbitrary / Compound Path: split into subpaths
                    const subpathRegex = /M\s*([-\d.]+)[,\s]+([-\d.]+)([^M]*)/gi;
                    let match;
                    let outerPoints = null;
                    const holes = [];

                    while ((match = subpathRegex.exec(d)) !== null) {
                        const startPt = { x: Number(match[1]), y: Number(match[2]) };
                        const rest = match[3] || "";
                        const pts = [startPt];
                        const ptMatches = rest.matchAll(/[L]\s*([-\d.]+)[,\s]+([-\d.]+)/gi);
                        for (const pm of ptMatches) {
                            pts.push({ x: Number(pm[1]), y: Number(pm[2]) });
                        }
                        if (pts.length >= 2) {
                            if (!outerPoints) {
                                outerPoints = pts;
                            } else {
                                holes.push({ points: pts, curved: rest.includes("Q") });
                            }
                        }
                    }

                    if (outerPoints && outerPoints.length >= 2) {
                        parsed.push({
                            type: "path",
                            points: outerPoints,
                            holes: holes,
                            curved: d.includes("Q"),
                            color: stroke,
                            fill,
                            strokeWidth
                        });
                    }
                }
            }
        });

        return parsed;
    }

    applyCodeButton?.addEventListener("click", () => {
        let parsed;
        try {
            parsed = readSVGSource();
        } catch (e) {
            alert(`SVG Parse Error:\n${e.message}`);
            return;
        }

        beginHistoryAction();

        // Clear existing
        shapes.forEach(s => removeShape(s));
        shapes = [];
        selectShape(null);

        parsed.forEach(data => {
            if (data.type === "importedArc") {
                const arc = arcEndpointToCenter(
                    data.startX, data.startY,
                    data.radius, data.radius,
                    data.phi || 0,
                    data.largeArc, data.sweep,
                    data.endX, data.endY
                );

                createCurve(arc.cx, arc.cy);
                const s = shapes[shapes.length - 1];
                s.radius = arc.rx;
                s.startAngle = arc.startAngle;
                s.endAngle = arc.endAngle;
                s.color = data.color;
                s.strokeWidth = data.strokeWidth;
                updateCurve(s);

            } else {
                if (data.type === "path") {
                    console.log("Original path:", data.svgPathData);
                    console.log("Editable segments:", data.svgEditableSegments);
                }

                createShapeFromCopy(data);
            }
        });

        renderLayers();
        updateMeasurementPanel();
        updatePropertiesPanel();
        updateSVGSource();
        bringHandlesToFront();
        commitHistoryAction();

        showToast("SVG source changes applied", "success");
    });

    copyCodeButton?.addEventListener("click", async () => {
        if (!svgCode) return;
        try {
            await navigator.clipboard.writeText(svgCode.value);
            copyCodeButton.textContent = "Copied!";
            setTimeout(() => { copyCodeButton.textContent = "Copy"; }, 1500);
            showToast("SVG copied to clipboard", "success");
        } catch (e) {
            console.error("Copy failed:", e);
        }
    });

    // ========================================================================
    // 18. EXPORT (SVG VECTOR + HIGH-RES PNG BITMAP)
    // ========================================================================
    let activeExportFormat = "svg";
    let activeExportColor = "original";
    let activeExportScale = 2; // 48px
    let exportTargetProject = null;

    topbarExportBtn?.addEventListener("click", () => {

        const activeProject = projectManager.projects.find(
            p => p.id === projectManager.activeProjectId
        );

        // Use the homepage preview project if its drawer is open.
        // Otherwise, use the editor's active project.
        exportTargetProject = selectedHomeProject || activeProject;

        if (!exportTargetProject) {
            showToast("No project selected for export", "error");
            return;
        }

        activeExportColor = exportTargetProject.finishStrokeColor || "original";

        document.querySelectorAll(".export-option").forEach(option => {
            option.classList.toggle(
                "active",
                option.dataset.color === activeExportColor
            );
        });

        exportModal?.classList.add("show");
    });

    exportCancel?.addEventListener("click", () => {
        exportModal?.classList.remove("show");
    });

    exportTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            exportTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeExportFormat = tab.dataset.exportFormat;

            if (pngResolutionSection) {
                pngResolutionSection.style.display = activeExportFormat === "png" ? "flex" : "none";
            }
        });
    });

    exportOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            exportOptions.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            activeExportColor = opt.dataset.color;
        });
    });

    resButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            resButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeExportScale = Number(btn.dataset.scale) || 2;
        });
    });

    exportDownloadBtn?.addEventListener("click", () => {
        const activeProject = exportTargetProject;

        if (!activeProject?.data?.shapes) {
            showToast("Project drawing data is missing", "error");
            return;
        }

        const fileName = (activeProject.name || "icon")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "-");

        const svgString = generateSVGFromShapes(
            activeProject.data.shapes,
            activeExportColor
        );

        if (activeExportFormat === "svg") {
            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.svg`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            exportModal.classList.remove("show");
            showToast(`Downloaded ${fileName}.svg`, "success");
        } else {
            // PNG Export via HTML Canvas
            const size = Math.round(24 * activeExportScale);
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");

            const img = new Image();
            const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(url);

                canvas.toBlob(pngBlob => {
                    if (!pngBlob) return;
                    const pngUrl = URL.createObjectURL(pngBlob);
                    const a = document.createElement("a");
                    a.href = pngUrl;
                    a.download = `${fileName}-${size}x${size}.png`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
                    exportModal.classList.remove("show");
                    showToast(`Exported ${size}×${size} PNG`, "success");
                });
            };

            img.src = url;
        }
    });

    // ========================================================================
    // 19. HOMEPAGE GALLERY, TABS, SEARCH & DETAILS DRAWER
    // ========================================================================
    function getProjectSearchTerms(project) {
        if (Array.isArray(project.searchTerms) && project.searchTerms.length) {
            return project.searchTerms;
        }
        const name = (project.name || "").trim().toLowerCase();
        const category = (project.category || "").trim().toLowerCase();
        const baseTerms = [name, category].filter(Boolean);

        // Expanded intelligent synonym matching
        if (["search", "magnifier", "magnifying glass", "find"].some(k => name.includes(k))) {
            return [...baseTerms, "magnifier", "scan", "lookup", "query", "zoom", "inspect"];
        }
        if (["arrow", "nav", "chevron", "direction"].some(k => name.includes(k))) {
            return [...baseTerms, "direction", "pointer", "chevron", "next", "back"];
        }
        if (["home", "house", "building"].some(k => name.includes(k))) {
            return [...baseTerms, "main", "dashboard", "house", "estate"];
        }
        if (["user", "profile", "account", "person"].some(k => name.includes(k))) {
            return [...baseTerms, "avatar", "member", "customer", "contact"];
        }

        return baseTerms;
    }

    function renderHomeProjects() {
        if (!homeProjectGrid) return;
        homeProjectGrid.innerHTML = "";

        const allFinished = projectManager.projects.filter(p => p.status === "finished");
        let finished = [...allFinished];

        // Filter by Tab
        if (activeHomeTab === "recent") {
            const sevenDaysAgo = Date.now() - 7 * 86400000;
            finished = finished.filter(p => (Date.parse(p.savedAt) || 0) >= sevenDaysAgo);
        } else if (activeHomeTab === "favorites") {
            finished = finished.filter(p => p.favorite === true);
        }

        // Populate alphabetical category list in sidebar
        const categoryCounts = {};
        allFinished.forEach(p => {
            const cat = (p.category || "General").trim();
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        const sortedCategories = Object.keys(categoryCounts).sort((a, b) => a.localeCompare(b));

        if (categoriesAlphabeticalList) {
            categoriesAlphabeticalList.innerHTML = "";
            sortedCategories.forEach(cat => {
                const item = document.createElement("button");
                item.type = "button";
                item.className = `cat-list-pill ${selectedCategoryFilter === cat ? "active" : ""}`;
                item.innerHTML = `<span class="cat-pill-name">${cat}</span><span class="cat-pill-count">${categoryCounts[cat]}</span>`;
                item.addEventListener("click", () => {
                    selectedCategoryFilter = selectedCategoryFilter === cat ? null : cat;
                    renderHomeProjects();
                });
                categoriesAlphabeticalList.appendChild(item);
            });
        }

        if (clearCategoryFilterBtn) {
            clearCategoryFilterBtn.style.display = selectedCategoryFilter ? "inline-block" : "none";
        }

        // Category Select Dropdown in Toolbar
        if (homeCategorySelect) {
            const previous = homeCategorySelect.value;
            homeCategorySelect.innerHTML = `<option value="all">All categories</option>`;
            sortedCategories.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = `${cat} (${categoryCounts[cat]})`;
                homeCategorySelect.appendChild(opt);
            });
            if (sortedCategories.includes(previous)) homeCategorySelect.value = previous;
        }

        const activeCategory = homeCategorySelect?.value || "all";
        if (selectedCategoryFilter) {
            finished = finished.filter(p => (p.category || "General").trim() === selectedCategoryFilter);
        } else if (activeCategory !== "all") {
            finished = finished.filter(p => (p.category || "General").trim() === activeCategory);
        }

        // Search Filter (only matches name, category, or specific keywords; no default "icon" match)
        const query = homeSearchInput?.value.trim().toLowerCase();
        if (clearSearchBtn) {
            clearSearchBtn.style.display = query ? "block" : "none";
        }

        if (query) {
            const words = query.split(/\s+/).filter(Boolean);
            finished = finished.filter(p => {
                const text = `${p.name || ""} ${p.category || ""} ${getProjectSearchTerms(p).join(" ")}`.toLowerCase();
                return words.every(w => text.includes(w));
            });
        }

        // Sorting
        const sortVal = homeSortSelect?.value || "newest";
        finished.sort((a, b) => {
            const dateA = Date.parse(a.savedAt) || 0;
            const dateB = Date.parse(b.savedAt) || 0;
            const nameA = (a.name || "").toLowerCase();
            const nameB = (b.name || "").toLowerCase();

            if (sortVal === "newest") return dateB - dateA;
            if (sortVal === "oldest") return dateA - dateB;
            if (sortVal === "az") return nameA.localeCompare(nameB);
            if (sortVal === "za") return nameB.localeCompare(nameA);
            return 0;
        });

        // View Mode Class
        homeProjectGrid.classList.toggle("list-view", homeViewMode === "list");

        if (finished.length === 0) {
            const msg = query ? `No icons matching "${query}"` : "No icons found in this view.";
            homeProjectGrid.innerHTML = `<p class="home-no-results">${msg}</p>`;
            updateProjectCounters();
            return;
        }

        function createHomeProjectCard(project) {
            const card = document.createElement("div");
            card.className = `home-project-card ${selectedHomeProject?.id === project.id ? "active" : ""
                }`;
            card.dataset.projectId = project.id;
            card.tabIndex = 0;

            const preview = document.createElement("div");
            preview.className = "home-project-preview";

            if (project.thumbnail) {
                preview.innerHTML = project.thumbnail;
            } else {
                preview.textContent = "✦";
            }

            const tooltip = document.createElement("div");
            tooltip.className = "home-card-tooltip";
            tooltip.textContent = project.name || "Untitled icon";

            const starBtn = document.createElement("button");
            starBtn.type = "button";
            starBtn.className = `home-card-fav-star ${project.favorite ? "active" : ""}`;
            starBtn.innerHTML = project.favorite ? "★" : "☆";
            starBtn.title = "Toggle Favorite";

            starBtn.addEventListener("click", e => {
                e.stopPropagation();
                project.favorite = !project.favorite;
                starBtn.classList.toggle("active", project.favorite);
                starBtn.innerHTML = project.favorite ? "★" : "☆";
                saveProjectManager();
                updateProjectCounters();
                if (activeHomeTab === "favorites" && !project.favorite) {
                    renderHomeProjects();
                }
            });

            card.appendChild(preview);

            if (homeViewMode === "list") {
                const infoCol = document.createElement("div");
                infoCol.className = "home-project-info-col";

                const name = document.createElement("span");
                name.className = "home-project-name";
                name.textContent = project.name || "Untitled icon";

                const cat = document.createElement("span");
                cat.className = "home-project-category";
                cat.textContent = `${project.category || "General"} • ${new Date(project.savedAt).toLocaleDateString()}`;

                infoCol.appendChild(name);
                infoCol.appendChild(cat);
                card.appendChild(infoCol);
            } else {
                const name = document.createElement("span");
                name.className = "home-project-name";
                name.textContent = project.name || "Untitled icon";
                card.appendChild(name);
            }

            card.appendChild(tooltip);
            card.appendChild(starBtn);

            card.addEventListener("click", () => showProjectPreview(project));
            card.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    showProjectPreview(project);
                }
            });

            return card;
        }

        if (galleryViewCategory === "categories" && !selectedCategoryFilter) {
            const grouped = {};
            finished.forEach(p => {
                const c = (p.category || "General").trim();
                if (!grouped[c]) grouped[c] = [];
                grouped[c].push(p);
            });

            Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach(catName => {
                const groupContainer = document.createElement("div");
                groupContainer.className = "gallery-category-group";

                const header = document.createElement("div");
                header.className = "gallery-category-header";
                header.innerHTML = `
                    <span class="cat-header-title">${catName}</span>
                    <span class="cat-header-count">${grouped[catName].length} ${grouped[catName].length === 1 ? "icon" : "icons"}</span>
                `;

                const cardsGrid = document.createElement("div");
                cardsGrid.className = `gallery-category-cards home-project-grid ${homeViewMode === "list" ? "list-view" : ""}`;

                grouped[catName].forEach(p => cardsGrid.appendChild(createHomeProjectCard(p)));

                groupContainer.appendChild(header);
                groupContainer.appendChild(cardsGrid);
                homeProjectGrid.appendChild(groupContainer);
            });
        } else {
            finished.forEach(project => {
                homeProjectGrid.appendChild(createHomeProjectCard(project));
            });
        }

        updateProjectCounters();
    }

    function updateHomeProjectSelection() {
        document.querySelectorAll(".home-project-card").forEach(card => {
            card.classList.toggle(
                "active",
                card.dataset.projectId === selectedHomeProject?.id
            );
        });
    }

    viewModeAllBtn?.addEventListener("click", () => {
        viewModeAllBtn.classList.add("active");
        viewModeCategoriesBtn?.classList.remove("active");
        galleryViewCategory = "all";
        renderHomeProjects();
    });

    viewModeCategoriesBtn?.addEventListener("click", () => {
        viewModeCategoriesBtn.classList.add("active");
        viewModeAllBtn?.classList.remove("active");
        galleryViewCategory = "categories";
        renderHomeProjects();
    });

    clearCategoryFilterBtn?.addEventListener("click", () => {
        selectedCategoryFilter = null;
        renderHomeProjects();
    });

    homeTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            homeTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeHomeTab = tab.dataset.tab;
            renderHomeProjects();
        });
    });

    homeViewToggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            homeViewToggleBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            homeViewMode = btn.dataset.view;
            try {
                localStorage.setItem(VIEW_MODE_STORAGE_KEY, homeViewMode);
            } catch (e) { }
            renderHomeProjects();
        });
    });

    homeSearchInput?.addEventListener("input", renderHomeProjects);
    homeSortSelect?.addEventListener("change", renderHomeProjects);
    homeCategorySelect?.addEventListener("change", renderHomeProjects);

    clearSearchBtn?.addEventListener("click", () => {
        if (homeSearchInput) homeSearchInput.value = "";
        renderHomeProjects();
    });

    // Preview Drawer Helpers
    function getPreviewSVG(project, strokeW = 2) {
        if (!project?.thumbnail) return "";
        const svg = project.thumbnail.replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeW}"`);
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function showProjectPreview(project) {
        if (!project || !projectDetails) return;

        selectedHomeProject = project;
        updateHomeProjectSelection();
        if (projectRelated) projectRelated.hidden = true;

        if (projectName) projectName.textContent = project.name || "Untitled icon";
        if (projectCategoryBadge) projectCategoryBadge.textContent = project.category || "General";
        if (projectDateBadge) projectDateBadge.textContent = `Saved ${new Date(project.savedAt).toLocaleDateString()}`;

        if (previewStrokeWidth) previewStrokeWidth.value = 2;
        if (previewStrokeValue) previewStrokeValue.textContent = "2.0";
        if (projectPreviewImage) projectPreviewImage.src = getPreviewSVG(project, 2);

        if (projectFavoriteBtn) {
            projectFavoriteBtn.classList.toggle("active", project.favorite === true);
            projectFavoriteBtn.innerHTML = project.favorite ? "★" : "☆";
        }

        // Render search tags
        if (projectSearchTerms) {
            projectSearchTerms.innerHTML = "";
            const terms = getProjectSearchTerms(project);
            terms.forEach(t => {
                const tag = document.createElement("span");
                tag.className = "project-search-term";
                tag.textContent = t;
                projectSearchTerms.appendChild(tag);
            });
        }

        if (projectMoreSearchButton) {
            projectMoreSearchButton.title = `More icons with "${project.name}" in their name`;
        }

        renderRelatedProjects(project);

        projectDetails.classList.add("show");
        projectDetails.setAttribute("aria-hidden", "false");
    }

    function closeProjectPreview() {
        projectDetails?.classList.remove("show", "expanded");
        projectDetails?.setAttribute("aria-hidden", "true");

        if (projectRelated) projectRelated.hidden = true; // ADD THIS

        selectedHomeProject = null;
        updateHomeProjectSelection();
    }

    projectDetailsClose?.addEventListener("click", closeProjectPreview);
    // Move drawer upward and reveal related icons
    projectMoreSearchButton?.addEventListener("click", () => {
        if (!selectedHomeProject || !projectDetails || !projectRelated) return;

        projectRelated.hidden = false;
        projectDetails.classList.add("expanded");
    });
    // Export the currently previewed icon
    document.getElementById("project-export-button")?.addEventListener("click", () => {
        topbarExportBtn?.click();
    });

    projectFavoriteBtn?.addEventListener("click", () => {
        if (!selectedHomeProject) return;
        selectedHomeProject.favorite = !selectedHomeProject.favorite;
        projectFavoriteBtn.classList.toggle("active", selectedHomeProject.favorite);
        projectFavoriteBtn.innerHTML = selectedHomeProject.favorite ? "★" : "☆";
        saveProjectManager();
        renderHomeProjects();
    });

    previewStrokeWidth?.addEventListener("input", () => {
        if (!selectedHomeProject) return;
        const val = Number(previewStrokeWidth.value) || 2;
        previewStrokeValue.textContent = val.toFixed(1);
        projectPreviewImage.src = getPreviewSVG(selectedHomeProject, val);
    });

    projectEditButton?.addEventListener("click", () => {
        if (!selectedHomeProject) return;
        const id = selectedHomeProject.id;
        const success = switchProject(id);
        if (success) {
            closeProjectPreview();
            openIconEditor();
        }
    });

    projectRemixButton?.addEventListener("click", () => {
        if (!selectedHomeProject) return;

        if (
            projectManager.activeProjectId &&
            projectManager.projects.some(p => p.id === projectManager.activeProjectId)
        ) {
            saveProjectToBrowser();
        }
        const sourceProject = projectManager.projects.find(p => p.id === selectedHomeProject.id);
        if (!sourceProject?.data) {
            showToast("Original icon data missing", "error");
            return;
        }

        const copiedData = structuredClone(sourceProject.data);
        const baseName = `${sourceProject.name || "Untitled"} (Remix)`;
        let remixName = baseName;
        let c = 2;

        while (projectManager.projects.some(p => p.name.toLowerCase() === remixName.toLowerCase())) {
            remixName = `${baseName} ${c++}`;
        }

        const remix = createProject(copiedData);
        remix.name = remixName;
        remix.category = sourceProject.category || "General";
        remix.searchTerms = [...getProjectSearchTerms(sourceProject)];
        remix.remixedFrom = sourceProject.id;

        projectManager.projects.push(remix);
        saveProjectManager();

        const success = switchProject(remix.id, false);

        if (!success) {
            showToast("Remix created, but could not load into editor", "error");
            return;
        }

        closeProjectPreview();
        openIconEditor();
        showToast(`Remixed as "${remixName}"`, "success");
    });

    projectDeleteButton?.addEventListener("click", () => {
        if (!selectedHomeProject) return;
        const name = selectedHomeProject.name || "Untitled icon";

        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        projectManager.projects = projectManager.projects.filter(p => p.id !== selectedHomeProject.id);
        saveProjectManager();
        closeProjectPreview();
        renderHomeProjects();
        showToast(`Deleted "${name}"`, "info");
    });



    function renderRelatedProjects(project) {
        if (!relatedProjectGrid) return;
        relatedProjectGrid.innerHTML = "";

        const terms = getProjectSearchTerms(project).map(t => t.toLowerCase());
        const related = projectManager.projects.filter(p => {
            if (p.status !== "finished" || p.id === project.id) return false;
            const pTerms = getProjectSearchTerms(p).map(t => t.toLowerCase());
            return terms.some(t => pTerms.includes(t) || (p.name && p.name.toLowerCase().includes(t)));
        });

        if (relatedHeadingText) relatedHeadingText.textContent = `Related to "${project.name}"`;
        if (relatedCount) relatedCount.textContent = `${related.length} icons`;

        if (related.length === 0) {
            relatedProjectGrid.innerHTML = `<p class="related-empty">No other icons match these terms.</p>`;
            return;
        }

        related.forEach(item => {
            const card = document.createElement("button");
            card.className = "related-project-card";
            card.type = "button";

            if (item.thumbnail) {
                const img = document.createElement("img");
                img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.thumbnail)}`;
                img.alt = item.name;
                card.appendChild(img);
            }
            const span = document.createElement("span");
            span.textContent = item.name || "Untitled";
            card.appendChild(span);

            card.addEventListener("click", () => showProjectPreview(item));
            relatedProjectGrid.appendChild(card);
        });
    }

    function updateHomeButtonLabel() {
        if (!homeButton) return;
        const isGallery = homeScreen?.classList.contains("show");
        homeButton.textContent = isGallery ? "Editor" : "Gallery";
        homeButton.title = isGallery ? "Return to Icon Editor" : "Open Icon Gallery";
    }

    function openIconEditor() {
        homeScreen?.classList.remove("show");
        updateHomeButtonLabel();
    }

    // ========================================================================
    // 20. SIDEBAR NAVIGATION: GALLERY, ALL PROJECTS, PREFERENCES
    // ========================================================================
    function switchHomeView(viewName) {
        sidebarOptions.forEach(opt => {
            opt.classList.toggle("active", opt.dataset.homeView === viewName);
        });

        Object.keys(homeViewSections).forEach(name => {
            const section = homeViewSections[name];
            if (!section) return;
            section.style.display = name === viewName ? "flex" : "none";
        });

        if (viewName === "projects") {
            renderManagementTable();
        } else if (viewName === "gallery") {
            renderHomeProjects();
        }
    }

    sidebarOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            const view = opt.dataset.homeView;
            if (view) switchHomeView(view);
        });
    });

    function renderManagementTable() {
        const finished = projectManager.projects.filter(p => p.status === "finished");
        const unfinished = projectManager.projects.filter(p => p.status === "unfinished");

        if (managerFinishedCount) managerFinishedCount.textContent = finished.length;
        if (managerUnfinishedCount) managerUnfinishedCount.textContent = unfinished.length;

        function createProjectManagerCard(project, isFinished) {
            const card = document.createElement("div");
            card.className = "management-project-card";
            card.dataset.id = project.id;

            const preview = document.createElement("div");
            preview.className = "management-card-preview";
            if (project.thumbnail) {
                preview.innerHTML = project.thumbnail;
            } else {
                preview.textContent = "✦";
            }

            const info = document.createElement("div");
            info.className = "management-card-info";

            const name = document.createElement("h4");
            name.className = "management-card-name";
            name.textContent = project.name || "Untitled";

            const meta = document.createElement("p");
            meta.className = "management-card-meta";
            meta.textContent = `${project.category || "General"} • ${new Date(project.savedAt).toLocaleDateString()}`;

            info.appendChild(name);
            info.appendChild(meta);

            const actions = document.createElement("div");
            actions.className = "management-card-actions";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "btn btn-sm btn-secondary";
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
                const success = switchProject(project.id);
                if (success) openIconEditor();
            });

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "btn btn-sm btn-danger";
            delBtn.textContent = "Delete";
            delBtn.addEventListener("click", () => {
                if (isFinished) {
                    if (deleteConfirmModal && deleteTargetProjectName && deleteConfirmBtn && deleteCancelBtn) {
                        deleteTargetProjectName.textContent = project.name || "this icon";
                        deleteConfirmModal.style.display = "flex";
                        deleteConfirmModal.classList.add("show");

                        deleteConfirmBtn.onclick = () => {
                            deleteConfirmModal.style.display = "none";
                            deleteConfirmModal.classList.remove("show");
                            projectManager.projects = projectManager.projects.filter(p => p.id !== project.id);
                            saveProjectManager();
                            renderManagementTable();
                            renderHomeProjects();
                            renderUnfinishedProjects();
                            showToast(`Deleted "${project.name}"`, "info");
                        };

                        deleteCancelBtn.onclick = () => {
                            deleteConfirmModal.style.display = "none";
                            deleteConfirmModal.classList.remove("show");
                        };
                    } else {
                        if (confirm(`Permanently delete finished icon "${project.name}"?`)) {
                            projectManager.projects = projectManager.projects.filter(p => p.id !== project.id);
                            saveProjectManager();
                            renderManagementTable();
                            renderHomeProjects();
                            renderUnfinishedProjects();
                            showToast(`Deleted "${project.name}"`, "info");
                        }
                    }
                } else {
                    projectManager.projects = projectManager.projects.filter(p => p.id !== project.id);
                    saveProjectManager();
                    renderManagementTable();
                    renderHomeProjects();
                    renderUnfinishedProjects();
                    showToast("Draft deleted", "info");
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);

            card.appendChild(preview);
            card.appendChild(info);
            card.appendChild(actions);

            return card;
        }

        if (finishedProjectGrid) {
            finishedProjectGrid.innerHTML = "";
            if (finished.length === 0) {
                finishedProjectGrid.innerHTML = `<p class="management-empty-msg">No finished icons yet.</p>`;
            } else {
                finished.forEach(p => finishedProjectGrid.appendChild(createProjectManagerCard(p, true)));
            }
        }

        if (unfinishedProjectGrid) {
            unfinishedProjectGrid.innerHTML = "";
            if (unfinished.length === 0) {
                unfinishedProjectGrid.innerHTML = `<p class="management-empty-msg">No unfinished drafts.</p>`;
            } else {
                unfinished.forEach(p => unfinishedProjectGrid.appendChild(createProjectManagerCard(p, false)));
            }
        }
    }

    managerNewIconBtn?.addEventListener("click", () => {
        createNewProject();
        openIconEditor();
    });

    // Preferences Actions
    settingsBackupBtn?.addEventListener("click", downloadProjectFile);
    settingsClearAllBtn?.addEventListener("click", () => {
        if (!confirm("Warning: This will clear all saved icons and preferences from this browser. Continue?")) return;
        localStorage.clear();
        location.reload();
    });

    // ========================================================================
    // 21. FINISH PROJECT DIALOG
    // ========================================================================
    finishProjectButton?.addEventListener("click", () => {
        if (!finishModal) return;
        const activeProject = projectManager.projects.find(p => p.id === projectManager.activeProjectId);

        finishIconName.value = activeProject?.name || "";
        finishIconCategory.value = activeProject?.category || "General";
        const savedColorOption = activeProject?.finishStrokeColor || "original";
        const colorRadio = document.querySelector(
            `input[name="finish-style-choice"][value="${savedColorOption}"]`
        );

        if (colorRadio) colorRadio.checked = true;
        finishModal.classList.add("show");
        finishIconName.focus();
    });

    finishCancel?.addEventListener("click", () => {
        finishModal.classList.remove("show");
    });

    finishConfirm?.addEventListener("click", () => {
        const name = finishIconName.value.trim();
        if (!name) {
            finishIconName.focus();
            finishIconName.placeholder = "Please enter an icon name";
            return;
        }

        const colorOption = document.querySelector(
            'input[name="finish-style-choice"]:checked'
        )?.value || "original";

        saveProjectToBrowser();

        const activeProject = projectManager.projects.find(
            p => p.id === projectManager.activeProjectId
        );

        if (!activeProject) return;

        activeProject.name = name;
        activeProject.category = finishIconCategory.value;
        activeProject.finishStrokeColor = colorOption;
        activeProject.thumbnail = generateSVG(
            colorOption === "white" ? "white" : "original"
        );
        activeProject.status = "finished";
        activeProject.savedAt = new Date().toISOString();

        saveProjectManager();
        renderHomeProjects();
        renderUnfinishedProjects();
        renderManagementTable();
        updateActiveProjectNameDisplay();

        finishModal.classList.remove("show");
        homeScreen.classList.add("show");
        updateHomeButtonLabel();
        showToast(`Finished icon "${name}" added to Gallery!`, "success");
    });

    finishIconName?.addEventListener("keydown", e => {
        if (e.key === "Enter") finishConfirm.click();
    });

    // ========================================================================
    // 22. MENU, TOPBAR, FILE IMPORT & BACKUP
    // ========================================================================
    saveProjectButton?.addEventListener("click", () => {
        saveProjectToBrowser();
        showToast("Project saved", "success");
    });

    newProjectButton?.addEventListener("click", () => {
        createNewProject();
        fileDropdown?.classList.remove("show");
    });

    exportProjectJsonBtn?.addEventListener("click", () => {
        downloadProjectFile();
        fileDropdown?.classList.remove("show");
    });

    importProjectJsonBtn?.addEventListener("click", () => {
        importProjectFileInput?.click();
        fileDropdown?.classList.remove("show");
    });

    importProjectFileInput?.addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.projectManager && Array.isArray(parsed.projectManager.projects)) {
                    projectManager = parsed.projectManager;
                } else if (Array.isArray(parsed.projects)) {
                    projectManager = parsed;
                } else if (parsed.shapes && parsed.version) {
                    // Single project import
                    const p = createProject(parsed);
                    projectManager.projects.push(p);
                    projectManager.activeProjectId = p.id;
                } else {
                    throw new Error("Unrecognized project file format.");
                }

                saveProjectManager();
                restoreProjectFromBrowser();
                renderHomeProjects();
                renderUnfinishedProjects();
                showToast("Project backup restored successfully", "success");
            } catch (err) {
                alert(`Could not import file: ${err.message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    });

    fileMenuButton?.addEventListener("click", e => {
        e.stopPropagation();
        fileDropdown?.classList.toggle("show");
    });

    document.addEventListener("click", e => {
        if (fileDropdown && !e.target.closest(".file-menu-wrapper")) {
            fileDropdown.classList.remove("show");
        }
    });

    homeButton?.addEventListener("click", () => {
        homeScreen.classList.toggle("show");
        updateHomeButtonLabel();
        if (homeScreen.classList.contains("show")) {
            renderHomeProjects();
        }
    });

    logoHomeButton?.addEventListener("click", () => {
        homeScreen.classList.add("show");
        updateHomeButtonLabel();
        renderHomeProjects();
    });

    // Requirement: The homepage Edit button must continue creating a new project and opening the editor.
    homeEditButton?.addEventListener("click", () => {
        closeProjectPreview();
        createNewProject();
        openIconEditor();
    });

    function renderUnfinishedProjects() {
        const list = document.getElementById("unfinished-project-list");
        if (!list) return;

        const unfinished = projectManager.projects.filter(p => p.status === "unfinished" && p.id !== projectManager.activeProjectId);

        if (unfinished.length === 0) {
            list.innerHTML = `<p class="dropdown-empty">No unfinished Icons</p>`;
            return;
        }

        list.innerHTML = "";
        unfinished.forEach(project => {
            const btn = document.createElement("button");
            btn.textContent = project.name || "Untitled";
            btn.addEventListener("click", () => {
                switchProject(project.id);
                fileDropdown.classList.remove("show");
            });
            list.appendChild(btn);
        });
    }

    // ========================================================================
    // 23. CONTEXT MENU & SHORTCUTS HELP
    // ========================================================================
    workspace.addEventListener("contextmenu", event => {
        event.preventDefault();
        if (!canvasContextMenu) return;

        canvasContextMenu.style.left = `${event.clientX}px`;
        canvasContextMenu.style.top = `${event.clientY}px`;
        canvasContextMenu.style.display = "flex";
    });

    function hideContextMenu() {
        if (canvasContextMenu) canvasContextMenu.style.display = "none";
    }

    document.addEventListener("click", hideContextMenu);

    canvasContextMenu?.addEventListener("click", event => {
        const item = event.target.closest(".context-menu-item");
        if (!item) return;

        const act = item.dataset.context;
        if (act === "duplicate") duplicateSelectedShapes();
        else if (act === "copy") copySelectedShapes();
        else if (act === "paste") pasteCopiedShapes();
        else if (act === "flip-h") flipSelectedShapes("h");
        else if (act === "flip-v") flipSelectedShapes("v");
        else if (act === "bring-front") {
            if (selectedShape) {
                const idx = shapes.indexOf(selectedShape);
                if (idx !== -1) reorderShape(idx, 1);
            }
        } else if (act === "send-back") {
            if (selectedShape) {
                const idx = shapes.indexOf(selectedShape);
                if (idx !== -1) reorderShape(idx, -1);
            }
        } else if (act === "toggle-lock") {
            if (selectedShape) {
                const idx = shapes.indexOf(selectedShape);
                if (idx !== -1) toggleLayerLock(idx);
            }
        } else if (act === "delete") {
            deleteButton?.click();
        }

        hideContextMenu();
    });

    function copySelectedShapes() {
        const targets = selectedShapes.length ? selectedShapes : (selectedShape ? [selectedShape] : []);
        if (!targets.length) return;

        copiedShapes = targets.map(shape => {
            const data = {};
            Object.keys(shape).forEach(k => {
                if (!shapeDOMKeys.has(k)) data[k] = structuredClone(shape[k]);
            });
            return data;
        });

        showToast(`Copied ${copiedShapes.length} shape(s)`, "info");
    }

    function pasteCopiedShapes() {
        if (!copiedShapes.length) return;
        beginHistoryAction();

        const created = [];
        copiedShapes.forEach(data => {
            const moved = structuredClone(data);
            if (moved.type === "line") {
                moved.x1 += COPY_OFFSET; moved.x2 += COPY_OFFSET;
                moved.y1 += COPY_OFFSET; moved.y2 += COPY_OFFSET;
                       } else if (
                moved.type === "curve" ||
                moved.type === "circle" ||
                moved.type === "ellipse"
            ) {
                moved.cx += COPY_OFFSET; moved.cy += COPY_OFFSET;
            } else if (moved.type === "rectangle") {
                moved.x += COPY_OFFSET; moved.y += COPY_OFFSET;
            } else if (moved.type === "path") {
                moved.points = (moved.points || []).map(p => ({ x: p.x + COPY_OFFSET, y: p.y + COPY_OFFSET }));
                moved.holes = (moved.holes || []).map(h => {
                    const pts = Array.isArray(h) ? h : h.points;
                    const mapped = (pts || []).map(p => ({ x: p.x + COPY_OFFSET, y: p.y + COPY_OFFSET }));
                    return Array.isArray(h) ? mapped : { ...h, points: mapped };
                });
            }
            const s = createShapeFromCopy(moved);
            if (s) created.push(s);
        });

        selectedShapes = created;
        selectedShape = created[0] || null;
        renderLayers();
        updateSVGSource();
        commitHistoryAction();
        showToast("Pasted shape(s)", "success");
    }

    shortcutsTriggerBtn?.addEventListener("click", () => {
        shortcutsModal?.classList.add("show");
    });

    shortcutsCloseBtn?.addEventListener("click", () => {
        shortcutsModal?.classList.remove("show");
    });

    // Global Keyboard Shortcuts
    document.addEventListener("keydown", event => {
        const isTyping = event.target.matches("input, textarea, select") || event.target.isContentEditable;
        if (isTyping) return;

        const ctrl = event.ctrlKey || event.metaKey;
        const key = event.key.toLowerCase();

        if (event.key === "?") {
            shortcutsModal?.classList.toggle("show");
            return;
        }

        if (event.key === "Escape") {
            if (pathDrawing) {
                pathDrawing.preview.remove();
                pathDrawing = null;
                showToast("Path drawing cancelled", "info");
                return;
            }
            if (shortcutsModal?.classList.contains("show")) {
                shortcutsModal.classList.remove("show");
                return;
            }
            if (exportModal?.classList.contains("show")) {
                exportModal.classList.remove("show");
                return;
            }
            if (finishModal?.classList.contains("show")) {
                finishModal.classList.remove("show");
                return;
            }
            if (selectedHomeProject) {
                closeProjectPreview();
                return;
            }
            selectShape(null);
            return;
        }

        if (event.key === "Enter" && pathDrawing) {
            event.preventDefault();
            finishPath();
            return;
        }

        if (ctrl && key === "s") {
            event.preventDefault();
            saveProjectToBrowser();
            showToast("Project saved", "success");
            return;
        }

        if (ctrl && key === "z" && !event.shiftKey) {
            event.preventDefault();
            undoAction();
            return;
        }

        if (ctrl && (key === "y" || (key === "z" && event.shiftKey))) {
            event.preventDefault();
            redoAction();
            return;
        }

        if (ctrl && key === "d") {
            event.preventDefault();
            duplicateSelectedShapes();
            return;
        }

        if (ctrl && key === "c") {
            event.preventDefault();
            copySelectedShapes();
            return;
        }

        if (ctrl && key === "v") {
            event.preventDefault();
            pasteCopiedShapes();
            return;
        }

        if (event.key === "Delete" || event.key === "Backspace") {
            deleteButton?.click();
            return;
        }
    });

    // ========================================================================
    // 24. COLLAPSIBLE PANELS & WORKSPACE GUIDELINES TOGGLE
    // ========================================================================
    document.addEventListener("click", event => {
        const btn = event.target.closest(".collapse-btn");
        if (!btn) return;

        const section = btn.closest(".tools-panel, .properties-panel, .layers-panel, .svg, .measurement-panel");
        if (!section) return;

        const content = section.querySelector(".collapse-content");
        if (!content) return;

        const willCollapse = !content.classList.contains("collapsed");
        content.classList.toggle("collapsed", willCollapse);
        btn.setAttribute("aria-expanded", String(!willCollapse));
        btn.title = willCollapse ? "Expand" : "Collapse";
    });

    showGuidelinesCheckbox?.addEventListener("change", () => {
        if (workspaceGuidelines) {
            workspaceGuidelines.style.display = showGuidelinesCheckbox.checked ? "inline" : "none";
        }
    });

    showCoordinatesCheckbox?.addEventListener("change", () => {
        if (coordinateLabels) {
            coordinateLabels.style.display = showCoordinatesCheckbox.checked ? "inline" : "none";
        }
        saveProjectToBrowser();
    });

    gridHighlightToggle?.addEventListener("change", () => {
        if (!gridHighlightToggle.checked && gridHoverMarker) {
            gridHoverMarker.style.display = "none";
        }
        saveProjectToBrowser();
    });

    pathStyleToggle?.addEventListener("change", saveProjectToBrowser);

    // ========================================================================
    // 25. APP INITIALIZATION LIFECYCLE
    // ========================================================================
    loadProjectManager();
    restoreProjectFromBrowser();
    renderHomeProjects();
    renderUnfinishedProjects();
    updateSVGSource();

    // Restore view mode preference
    try {
        const savedView = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        if (savedView === "list" || savedView === "grid") {
            homeViewMode = savedView;
            homeViewToggleBtns.forEach(b => b.classList.toggle("active", b.dataset.view === homeViewMode));
            homeProjectGrid?.classList.toggle("list-view", homeViewMode === "list");
        }
    } catch (e) { }

    resetProjectHistory();
    updateHistoryButtons();
    updateActiveProjectNameDisplay();

    console.log("✦ Icon Maker PRO successfully initialized.");
})();
