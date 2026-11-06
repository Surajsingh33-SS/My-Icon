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

    // Guidelines & Highlight
    const showGuidelinesCheckbox = document.getElementById("show-guidelines");
    const workspaceGuidelines = document.getElementById("workspace-guidelines");
    const showCoordinatesCheckbox = document.getElementById("show-coordinates");
    const coordinateLabels = document.getElementById("coordinate-labels");
    const gridHighlightToggle = document.getElementById("show-grid-highlight");
    const gridHoverMarker = document.getElementById("grid-hover-marker");

    // History & Actions
    const undoButton = document.getElementById("undo-btn");
    const redoButton = document.getElementById("redo-btn");

    // Zoom & Pan
    const zoomInButton = document.getElementById("zoom-in");
    const zoomOutButton = document.getElementById("zoom-out");
    const zoomResetButton = document.getElementById("zoom-reset");
    const zoomLevelText = document.getElementById("zoom-level");

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

    // Sidebar Views
    const sidebarOptions = document.querySelectorAll(".sidebar-option");
    const homeViewSections = {
        gallery: document.getElementById("home-view-gallery"),
        projects: document.getElementById("home-view-projects"),
        settings: document.getElementById("home-view-settings")
    };
    const managementTableContainer = document.getElementById("management-table-container");
    const managerNewIconBtn = document.getElementById("manager-new-icon-btn");

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
    let selectedHomeProject = null;

    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 5;
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
        "hoverBg",
        "guideBg",
        "guide",
        "hitLine",
        "hitPath",
        "horizontalGuide",
        "angleGuide",
        "handles"
    ]);

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
                activeProject.thumbnail = generateSVG();
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

    function switchProject(projectId) {
        const target = projectManager.projects.find(p => p.id === projectId);
        if (!target) return false;

        saveProjectToBrowser();
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
    // 8. COORDINATE MAPPING, ZOOM & PAN
    // ========================================================================
    function getSVGPosition(event) {
        const point = workspace.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;

        const svgPoint = point.matrixTransform(workspace.getScreenCTM().inverse());
        return {
            x: Math.max(0, Math.min(24, svgPoint.x)),
            y: Math.max(0, Math.min(24, svgPoint.y))
        };
    }

    function updateWorkspaceZoom() {
        const viewSize = 24 / zoomLevel;
        const maxPan = 24 - viewSize;

        panX = Math.max(0, Math.min(maxPan, panX));
        panY = Math.max(0, Math.min(maxPan, panY));

        workspace.setAttribute("viewBox", `${panX} ${panY} ${viewSize} ${viewSize}`);
        if (zoomLevelText) {
            zoomLevelText.textContent = `${Math.round(zoomLevel * 100)}%`;
        }
    }

    zoomInButton?.addEventListener("click", () => {
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP);
        updateWorkspaceZoom();
    });

    zoomOutButton?.addEventListener("click", () => {
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP);
        updateWorkspaceZoom();
    });

    zoomResetButton?.addEventListener("click", () => {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        updateWorkspaceZoom();
    });

    // Panning & Wheel Zoom
    workspaceContainer?.addEventListener("wheel", event => {
        if (event.altKey) {
            event.preventDefault();
            const zoomFactor = Math.exp(-event.deltaY * 0.01);
            zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * zoomFactor));
            updateWorkspaceZoom();
            return;
        }

        if (zoomLevel <= 1 || event.deltaMode !== 0) return;
        event.preventDefault();

        const viewSize = 24 / zoomLevel;
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
    function getShapeElements(shape) {
        if (shape.type === "line") {
            return [shape.hoverBg, shape.element, shape.guideBg, shape.guide, shape.hitLine].filter(Boolean);
        }
        if (shape.type === "curve") {
            return [shape.element, shape.guideBg, shape.guide, shape.hitPath, shape.horizontalGuide, shape.angleGuide].filter(Boolean);
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

        const shape = {
            type: "line",
            name: "Line",
            x1: Math.max(0, x - 3),
            y1: y,
            x2: Math.min(24, x + 3),
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
            handles: []
        };

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
        });
        hitLine.addEventListener("pointerleave", () => {
            hoverBg.style.display = "none";
            guideBg.style.display = "none";
        });

        workspace.appendChild(hoverBg);
        workspace.appendChild(line);
        workspace.appendChild(guideBg);
        workspace.appendChild(guide);
        workspace.appendChild(hitLine);

        shapes.push(shape);
        updateLine(shape);
        selectShape(shape);
        return shape;
    }

    function createCurve(x, y) {
        const color = getNextColor("curve");

        const horizontalGuide = document.createElementNS(SVG_NS, "line");
        const angleGuide = document.createElementNS(SVG_NS, "line");
        const path = document.createElementNS(SVG_NS, "path");
        const hitPath = document.createElementNS(SVG_NS, "path");
        const guideBg = document.createElementNS(SVG_NS, "path");
        const guide = document.createElementNS(SVG_NS, "path");

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
            angleGuide: angleGuide
        };

        hitPath.setAttribute("fill", "none");
        hitPath.setAttribute("stroke", "transparent");
        hitPath.setAttribute("stroke-width", "3");
        hitPath.setAttribute("stroke-linecap", "round");
        hitPath.setAttribute("pointer-events", "stroke");
        hitPath.style.cursor = "move";

        path.setAttribute("fill", "none");
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("pointer-events", "none");

        guideBg.setAttribute("fill", "none");
        guideBg.setAttribute("stroke", "#334155");
        guideBg.setAttribute("stroke-width", "1.7");
        guideBg.setAttribute("stroke-linecap", "round");
        guideBg.setAttribute("pointer-events", "none");
        guideBg.style.display = "none";

        guide.setAttribute("fill", "none");
        guide.setAttribute("stroke", "#FFFFFF");
        guide.setAttribute("stroke-width", "0.12");
        guide.setAttribute("stroke-dasharray", "0.35 0.25");
        guide.setAttribute("pointer-events", "none");

        horizontalGuide.setAttribute("stroke", "#FBBF24");
        horizontalGuide.setAttribute("stroke-width", "0.15");
        horizontalGuide.setAttribute("stroke-dasharray", "0.4 0.3");
        horizontalGuide.setAttribute("pointer-events", "none");
        horizontalGuide.style.display = "none";

        angleGuide.setAttribute("stroke", "#FBBF24");
        angleGuide.setAttribute("stroke-width", "0.12");
        angleGuide.setAttribute("stroke-dasharray", "0.4 0.3");
        angleGuide.setAttribute("pointer-events", "none");
        angleGuide.style.display = "none";

        hitPath.addEventListener("pointerenter", () => {
            guideBg.style.display = "block";
        });
        hitPath.addEventListener("pointerleave", () => {
            guideBg.style.display = "none";
        });

        workspace.appendChild(path);
        workspace.appendChild(guideBg);
        workspace.appendChild(guide);
        workspace.appendChild(hitPath);
        workspace.appendChild(horizontalGuide);
        workspace.appendChild(angleGuide);

        shapes.push(shape);
        updateCurve(shape);
        selectShape(shape);
        return shape;
    }

    function createOtherShape(type, x, y) {
        if (type === "curve") return createCurve(x, y);

        const color = getNextColor(type);
        let element;

        if (type === "circle") {
            element = document.createElementNS(SVG_NS, "circle");
            element.setAttribute("cx", x);
            element.setAttribute("cy", y);
            element.setAttribute("r", "2.5");
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
        workspace.appendChild(element);

        const shape = {
            type: type,
            name: type === "circle" ? "Circle" : "Rectangle",
            element: element,
            color: color,
            fill: "none",
            strokeWidth: 2,
            hidden: false,
            locked: false,
            handles: []
        };

        if (type === "circle") {
            shape.cx = x;
            shape.cy = y;
            shape.radius = 2.5;
        } else {
            shape.x = Math.max(0, x - 2.5);
            shape.y = Math.max(0, y - 2);
            shape.width = 5;
            shape.height = 4;
        }

        shapes.push(shape);
        updateSVGSource();
        selectShape(shape);
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
        const parts = getPathParts(shape);
        const pathData = parts.map(item => createPathData(item.points, item.curved)).join(" ");

        shape.element.setAttribute("d", pathData);
        shape.element.setAttribute("fill", shape.fill || "none");
        shape.element.setAttribute("fill-rule", "evenodd");
        shape.element.setAttribute("stroke", shape.color);
        shape.element.setAttribute("stroke-width", shape.strokeWidth);
        shape.element.setAttribute("stroke-linecap", "round");
        shape.element.setAttribute("stroke-linejoin", "round");
        shape.element.style.cursor = "move";

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
        } else if (shape.type === "circle" || shape.type === "rectangle") {
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
        shape.handles?.forEach(el => el.remove());
        shape.handles = [];
        if (shape.type !== "line") return;

        const points = [
            { x: shape.x1, y: shape.y1, end: "start" },
            { x: shape.x2, y: shape.y2, end: "end" }
        ];

        points.forEach(pt => {
            const hoverBg = document.createElementNS(SVG_NS, "circle");
            hoverBg.setAttribute("cx", pt.x);
            hoverBg.setAttribute("cy", pt.y);
            hoverBg.setAttribute("r", "0.85");
            hoverBg.setAttribute("fill", "#64748B");
            hoverBg.setAttribute("pointer-events", "none");
            hoverBg.style.display = "none";

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

            hitArea.addEventListener("pointerenter", () => hoverBg.style.display = "block");
            hitArea.addEventListener("pointerleave", () => {
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

    // Curve Handles
    function updateCurveHandles(shape) {
        shape.handles?.forEach(el => el.remove());
        shape.handles = [];
        if (shape.type !== "curve") return;

        function makeHandle(x, y, action, color, radius = 0.32) {
            const hoverBg = document.createElementNS(SVG_NS, "circle");
            hoverBg.setAttribute("cx", x);
            hoverBg.setAttribute("cy", y);
            hoverBg.setAttribute("r", "0.95");
            hoverBg.setAttribute("fill", "#64748B");
            hoverBg.setAttribute("pointer-events", "none");
            hoverBg.style.display = "none";

            const hitArea = document.createElementNS(SVG_NS, "circle");
            hitArea.setAttribute("cx", x);
            hitArea.setAttribute("cy", y);
            hitArea.setAttribute("r", "1.15");
            hitArea.setAttribute("fill", "transparent");
            hitArea.setAttribute("pointer-events", "all");
            hitArea.classList.add("curve-hit-area");
            hitArea.dataset.action = action;

            const handle = document.createElementNS(SVG_NS, "circle");
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

        // Start angle handle
        makeHandle(
            shape.cx + shape.radius * Math.cos(shape.startAngle),
            shape.cy + shape.radius * Math.sin(shape.startAngle),
            "rotate-a",
            "#10131a"
        );

        // End angle handle
        makeHandle(
            shape.cx + shape.radius * Math.cos(shape.endAngle),
            shape.cy + shape.radius * Math.sin(shape.endAngle),
            "rotate-b",
            "#10131a"
        );

        // Radius handle (green center circle)
        const midAngle = (shape.startAngle + shape.endAngle) / 2;
        makeHandle(
            shape.cx + shape.radius * Math.cos(midAngle),
            shape.cy + shape.radius * Math.sin(midAngle),
            "radius",
            "#10B981",
            0.28
        );
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
        } else if (shape.type === "rectangle") {
            const x = shape.x;
            const y = shape.y;
            const w = shape.width;
            const h = shape.height;

            makeHandle(x, y, "nw");
            makeHandle(x + w / 2, y, "n");
            makeHandle(x + w, y, "ne");
            makeHandle(x + w, y + h / 2, "e");
            makeHandle(x + w, y + h, "se");
            makeHandle(x + w / 2, y + h, "s");
            makeHandle(x, y + h, "sw");
            makeHandle(x, y + h / 2, "w");
        }
    }

    // Path Vertex Handles (Allows Direct Vertex Editing on Canvas)
    function updatePathHandles(shape) {
        shape.handles?.forEach(h => h.remove());
        shape.handles = [];
        if (shape.type !== "path" || selectedShape !== shape) return;

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

        // Primary outline vertices
        shape.points.forEach((pt, idx) => makeVertexHandle(pt, idx, -1));

        // Cutout hole vertices
        (shape.holes || []).forEach((hole, hIdx) => {
            const pts = Array.isArray(hole) ? hole : hole.points;
            pts.forEach((pt, pIdx) => makeVertexHandle(pt, pIdx, hIdx));
        });
    }

    // Updates Geometry for Line, Curve, Basic
    function updateLine(shape) {
        [shape.element, shape.hoverBg, shape.guideBg, shape.guide, shape.hitLine].forEach(el => {
            if (!el) return;
            el.setAttribute("x1", shape.x1);
            el.setAttribute("y1", shape.y1);
            el.setAttribute("x2", shape.x2);
            el.setAttribute("y2", shape.y2);
        });

        if (selectedShape === shape) updateHandles(shape);
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
        const curvePath = `M ${startX} ${startY} A ${shape.radius} ${shape.radius} 0 ${largeArc} 1 ${endX} ${endY}`;

        shape.element.setAttribute("d", curvePath);
        shape.element.setAttribute("stroke-width", shape.strokeWidth);
        shape.guideBg.setAttribute("d", curvePath);
        shape.guide.setAttribute("d", curvePath);
        shape.hitPath.setAttribute("d", curvePath);

        shape.horizontalGuide.setAttribute("x1", shape.cx);
        shape.horizontalGuide.setAttribute("y1", shape.cy);
        shape.horizontalGuide.setAttribute("x2", 24);
        shape.horizontalGuide.setAttribute("y2", shape.cy);

        const activeAngle = dragging?.shape === shape && dragging.action === "rotate-a" ? shape.startAngle : shape.endAngle;
        shape.angleGuide.setAttribute("x1", shape.cx);
        shape.angleGuide.setAttribute("y1", shape.cy);
        shape.angleGuide.setAttribute("x2", shape.cx + shape.radius * Math.cos(activeAngle));
        shape.angleGuide.setAttribute("y2", shape.cy + shape.radius * Math.sin(activeAngle));

        if (selectedShape === shape) updateCurveHandles(shape);
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
        } else if (shape.type === "rectangle") {
            shape.element.setAttribute("x", shape.x);
            shape.element.setAttribute("y", shape.y);
            shape.element.setAttribute("width", shape.width);
            shape.element.setAttribute("height", shape.height);
        }

        if (selectedShape === shape && !shape.hidden && !shape.locked) {
            updateBasicShapeHandles(shape);
        }
        updateSVGSource();
    }

    // ========================================================================
    // 12. SNAPPING & ALIGNMENT GUIDES
    // ========================================================================
    function getShapeEndpoints(shape) {
        if (shape.type === "line") {
            return [
                { x: shape.x1, y: shape.y1, shape, end: "start" },
                { x: shape.x2, y: shape.y2, shape, end: "end" }
            ];
        }
        if (shape.type === "curve") {
            return [
                { x: shape.cx + shape.radius * Math.cos(shape.startAngle), y: shape.cy + shape.radius * Math.sin(shape.startAngle), shape, end: "start" },
                { x: shape.cx + shape.radius * Math.cos(shape.endAngle), y: shape.cy + shape.radius * Math.sin(shape.endAngle), shape, end: "end" }
            ];
        }
        return [];
    }

    function getSnappedPoint(x, y, currentShape) {
        const snapDistance = 0.3;
        const releaseDistance = 0.4;

        if (dragging?.snappedTo) {
            const target = getShapeEndpoints(dragging.snappedTo.shape).find(pt => pt.end === dragging.snappedTo.end);
            if (target && Math.hypot(x - target.x, y - target.y) <= releaseDistance) {
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
            return { x: closest.x, y: closest.y };
        }

        return { x, y };
    }

    function getAlignmentBounds(shape) {
        if (shape.type === "circle") {
            return { left: shape.cx - shape.radius, right: shape.cx + shape.radius, top: shape.cy - shape.radius, bottom: shape.cy + shape.radius };
        }
        if (shape.type === "rectangle") {
            return { left: shape.x, right: shape.x + shape.width, top: shape.y, bottom: shape.y + shape.height };
        }
        if (shape.type === "line") {
            return { left: Math.min(shape.x1, shape.x2), right: Math.max(shape.x1, shape.x2), top: Math.min(shape.y1, shape.y2), bottom: Math.max(shape.y1, shape.y2) };
        }
        if (shape.type === "curve") {
            return { left: shape.cx - shape.radius, right: shape.cx + shape.radius, top: shape.cy - shape.radius, bottom: shape.cy + shape.radius };
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

        const targetsX = [0, 12, 24];
        const targetsY = [0, 12, 24];

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
            alignmentVertical.setAttribute("y2", 24);
            alignmentVertical.style.display = "block";
        }

        if (horizontalMatch !== undefined) {
            alignmentHorizontal.setAttribute("x1", 0);
            alignmentHorizontal.setAttribute("x2", 24);
            alignmentHorizontal.setAttribute("y1", horizontalMatch);
            alignmentHorizontal.setAttribute("y2", horizontalMatch);
            alignmentHorizontal.style.display = "block";
        }
    }

    // ========================================================================
    // 13. WORKSPACE MOUSE/POINTER DRAG & CANVAS INTERACTIONS
    // ========================================================================
    workspace.addEventListener("pointerdown", event => {
        // Close context menu on any click
        hideContextMenu();

        // Path drawing in progress
        if (pathDrawing) {
            if (event.button !== 0) return;
            event.preventDefault();
            const pos = getSVGPosition(event);
            pathDrawing.points.push(pos);
            const pathData = createPathData(pathDrawing.points, pathDrawing.curved);
            pathDrawing.preview.setAttribute("d", pathData);
            return;
        }

        beginHistoryAction();

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
            const shape = shapes.find(s => (s.type === "circle" || s.type === "rectangle") && s.handles?.includes(basicHit));
            if (!shape) return;
            selectShape(shape);

            const pos = getSVGPosition(event);
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
                initialRadius: shape.radius
            };
            return;
        }

        // 3. Curve Handle
        if (curveHit) {
            const shape = shapes.find(s => s.type === "curve" && s.handles?.includes(curveHit));
            if (!shape) return;
            selectShape(shape);

            const pos = getSVGPosition(event);
            const action = curveHit.dataset.action;

            let pivot = null;
            if (action === "rotate-b") {
                pivot = { x: shape.cx + shape.radius * Math.cos(shape.endAngle), y: shape.cy + shape.radius * Math.sin(shape.endAngle) };
            } else if (action === "rotate-a") {
                pivot = { x: shape.cx + shape.radius * Math.cos(shape.startAngle), y: shape.cy + shape.radius * Math.sin(shape.startAngle) };
            }

            dragging = {
                shape,
                type: "curve-handle",
                action,
                startY: pos.y,
                startRadius: shape.radius,
                pivot,
                startAngle: shape.startAngle,
                initialEndAngle: shape.endAngle,
                snappedTo: null
            };
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
            if (item.type === "circle" || item.type === "rectangle" || item.type === "path") {
                return item.element === event.target;
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
            const pos = getSVGPosition(event);

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

        // Clicking empty canvas
        if (!event.shiftKey) {
            selectShape(null);
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

        if (!dragging || dragging.shape.locked || dragging.shape.hidden) return;

        const shape = dragging.shape;

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

        // Line Endpoint Drag
        if (dragging.type === "endpoint") {
            const snapped = getSnappedPoint(position.x, position.y, shape);
            if (dragging.end === "start") {
                shape.x1 = snapped.x;
                shape.y1 = snapped.y;
            } else {
                shape.x2 = snapped.x;
                shape.y2 = snapped.y;
            }
            updateLine(shape);
            return;
        }

        // Curve Handle Move
        if (dragging.type === "curve-handle") {
            if (dragging.action === "rotate-a" || dragging.action === "rotate-b") {
                const angle = Math.atan2(position.y - shape.cy, position.x - shape.cx);
                const finalAngle = snapAngle(angle);

                if (dragging.action === "rotate-a") shape.startAngle = finalAngle;
                else shape.endAngle = finalAngle;

                updateCurve(shape);
            } else if (dragging.action === "radius") {
                const dist = Math.hypot(position.x - shape.cx, position.y - shape.cy);
                shape.radius = Math.max(0.5, Math.min(12, dist));
                updateCurve(shape);
            }
            return;
        }

        // Basic Shape Handle Resize (Circle / Rect)
        if (dragging.type === "basic-handle") {
            if (shape.type === "circle") {
                const dist = Math.hypot(position.x - shape.cx, position.y - shape.cy);
                shape.radius = Math.max(0.2, Math.min(12, dist));
                updateBasicShape(shape);
            } else if (shape.type === "rectangle") {
                const dx = position.x - dragging.startX;
                const dy = position.y - dragging.startY;
                const action = dragging.action;

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

        // Whole Shape Body Drag
        if (dragging.type === "body") {
            const dx = position.x - dragging.previousX;
            const dy = position.y - dragging.previousY;
            dragging.previousX = position.x;
            dragging.previousY = position.y;

            // Move all selected shapes together
            const targets = selectedShapes.length ? selectedShapes : [shape];

            targets.forEach(item => {
                if (item.type === "line") {
                    item.x1 = Math.max(0, Math.min(24, item.x1 + dx));
                    item.y1 = Math.max(0, Math.min(24, item.y1 + dy));
                    item.x2 = Math.max(0, Math.min(24, item.x2 + dx));
                    item.y2 = Math.max(0, Math.min(24, item.y2 + dy));
                    updateLine(item);
                } else if (item.type === "curve") {
                    item.cx = Math.max(0, Math.min(24, item.cx + dx));
                    item.cy = Math.max(0, Math.min(24, item.cy + dy));
                    updateCurve(item);
                } else if (item.type === "circle") {
                    item.cx = Math.max(0, Math.min(24, item.cx + dx));
                    item.cy = Math.max(0, Math.min(24, item.cy + dy));
                    updateBasicShape(item);
                } else if (item.type === "rectangle") {
                    item.x = Math.max(0, Math.min(24 - item.width, item.x + dx));
                    item.y = Math.max(0, Math.min(24 - item.height, item.y + dy));
                    updateBasicShape(item);
                } else if (item.type === "path") {
                    item.points.forEach(p => { p.x += dx; p.y += dy; });
                    (item.holes || []).forEach(h => {
                        const pts = Array.isArray(h) ? h : h.points;
                        pts.forEach(p => { p.x += dx; p.y += dy; });
                    });
                    updatePathShape(item);
                }
            });

            updateAlignmentGuides(shape);
        }
    });

    function stopMovement() {
        if (!dragging) return;

        if (dragging.shape?.type === "curve") {
            dragging.shape.horizontalGuide.style.display = "none";
            dragging.shape.angleGuide.style.display = "none";
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
        const isFillable = shape.type === "circle" || shape.type === "rectangle" || shape.type === "path";

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
            shape.element.setAttribute("stroke", shape.color);
        } else if (style === "stroke-width") {
            const val = Math.max(0.1, Math.min(5, Number(input.value) || 2));
            if (shape.type === "line") {
                shape.width = val;
                shape.element.setAttribute("stroke-width", val);
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
                    shape.startAngle = Math.PI - shape.startAngle;
                    shape.endAngle = Math.PI - shape.endAngle;
                    updateCurve(shape);
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
                    shape.startAngle = -shape.startAngle;
                    shape.endAngle = -shape.endAngle;
                    updateCurve(shape);
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

        commitHistoryAction();
        showToast(`Flipped ${axis === "h" ? "horizontally" : "vertically"}`, "info");
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

            // Offset copy
            if (data.type === "line") {
                data.x1 += COPY_OFFSET; data.x2 += COPY_OFFSET;
                data.y1 += COPY_OFFSET; data.y2 += COPY_OFFSET;
            } else if (data.type === "curve" || data.type === "circle") {
                data.cx += COPY_OFFSET; data.cy += COPY_OFFSET;
            } else if (data.type === "rectangle") {
                data.x += COPY_OFFSET; data.y += COPY_OFFSET;
            } else if (data.type === "path") {
                data.points = data.points.map(p => ({ x: p.x + COPY_OFFSET, y: p.y + COPY_OFFSET }));
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
        } else if (data.type === "circle" || data.type === "rectangle") {
            createOtherShape(data.type, 12, 12);
            shape = shapes[shapes.length - 1];
            Object.assign(shape, data);
            updateBasicShape(shape);
        } else if (data.type === "path") {
            const el = document.createElementNS(SVG_NS, "path");
            shape = { ...structuredClone(data), element: el, handles: [] };
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
        else if (action === "duplicate") duplicateSelectedShapes();
        else if (action === "bring-front") {
            if (selectedShape) {
                const idx = shapes.indexOf(selectedShape);
                if (idx !== -1 && idx < shapes.length - 1) reorderShape(idx, 1);
            }
        }
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
        const artwork = [];

        shapes.forEach(shape => {
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
                const pathData = getPathParts(shape).map(p => createPathData(p.points, p.curved)).join(" ");
                artwork.push(`    <path d="${pathData}" fill="${shape.fill || "none"}" fill-rule="evenodd" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`);
            } else if (shape.type === "circle") {
                artwork.push(`    <circle cx="${formatSVGNumber(shape.cx)}" cy="${formatSVGNumber(shape.cy)}" r="${formatSVGNumber(shape.radius)}" fill="${shape.fill || "none"}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`);
            } else if (shape.type === "rectangle") {
                artwork.push(`    <rect x="${formatSVGNumber(shape.x)}" y="${formatSVGNumber(shape.y)}" width="${formatSVGNumber(shape.width)}" height="${formatSVGNumber(shape.height)}" fill="${shape.fill || "none"}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`);
            }
        });

        return [
            `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">`,
            artwork.join("\n"),
            `</svg>`
        ].join("\n");
    }

    function updateSVGSource() {
        if (!svgCode) return;
        svgCode.value = generateSVG();
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
            } else if (tag === "rect") {
                parsed.push({
                    type: "rectangle",
                    x: Number(el.getAttribute("x")) || 0,
                    y: Number(el.getAttribute("y")) || 0,
                    width: Number(el.getAttribute("width")) || 5,
                    height: Number(el.getAttribute("height")) || 4,
                    color: stroke,
                    fill,
                    strokeWidth
                });
            } else if (tag === "path") {
                const d = el.getAttribute("d") || "";

                // Check if simple circular arc
                const arcMatch = d.match(/^\s*M\s*([-\d.]+)[,\s]+([-\d.]+)\s+A\s*([-\d.]+)[,\s]+([-\d.]+)\s+0\s+([01])\s+([01])\s+([-\d.]+)[,\s]+([-\d.]+)\s*$/i);
                if (arcMatch) {
                    const [, x1, y1, rx, ry, largeArc, sweep, x2, y2] = arcMatch;
                    const cx = (Number(x1) + Number(x2)) / 2;
                    const cy = (Number(y1) + Number(y2)) / 2;
                    parsed.push({
                        type: "importedArc",
                        startX: Number(x1), startY: Number(y1),
                        endX: Number(x2), endY: Number(y2),
                        radius: Number(rx),
                        largeArc: Number(largeArc),
                        sweep: Number(sweep),
                        color: stroke,
                        strokeWidth
                    });
                } else {
                    // Arbitrary / Compound Path
                    const points = [];
                    const matches = d.matchAll(/[ML]\s*([-\d.]+)[,\s]+([-\d.]+)/gi);
                    for (const m of matches) {
                        points.push({ x: Number(m[1]), y: Number(m[2]) });
                    }

                    if (points.length >= 2) {
                        parsed.push({
                            type: "path",
                            points,
                            holes: [],
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
                const cx = (data.startX + data.endX) / 2;
                const cy = (data.startY + data.endY) / 2;
                createCurve(cx, cy);
                const s = shapes[shapes.length - 1];
                s.radius = data.radius;
                s.startAngle = Math.atan2(data.startY - cy, data.startX - cx);
                s.endAngle = Math.atan2(data.endY - cy, data.endX - cx);
                s.color = data.color;
                s.strokeWidth = data.strokeWidth;
                updateCurve(s);
            } else {
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

    topbarExportBtn?.addEventListener("click", () => {
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
        const activeProject = projectManager.projects.find(p => p.id === projectManager.activeProjectId);
        const fileName = (activeProject?.name || "icon").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
        const svgString = generateSVG(activeExportColor);

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
        const baseTerms = [name, project.category?.toLowerCase() || "icon"];

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

        let finished = projectManager.projects.filter(p => p.status === "finished");

        // Filter by Tab
        if (activeHomeTab === "recent") {
            const sevenDaysAgo = Date.now() - 7 * 86400000;
            finished = finished.filter(p => (Date.parse(p.savedAt) || 0) >= sevenDaysAgo);
        } else if (activeHomeTab === "favorites") {
            finished = finished.filter(p => p.favorite === true);
        }

        // Category Filter
        if (homeCategorySelect) {
            const previous = homeCategorySelect.value;
            const categories = [...new Set(projectManager.projects.filter(p => p.status === "finished").map(p => (p.category || "General").trim()))].sort();

            homeCategorySelect.innerHTML = `<option value="all">All categories</option>`;
            categories.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = cat;
                homeCategorySelect.appendChild(opt);
            });

            if (categories.includes(previous)) homeCategorySelect.value = previous;
        }

        const activeCategory = homeCategorySelect?.value || "all";
        if (activeCategory !== "all") {
            finished = finished.filter(p => (p.category || "General").trim() === activeCategory);
        }

        // Search Filter
        const query = homeSearchInput?.value.trim().toLowerCase();
        if (clearSearchBtn) {
            clearSearchBtn.style.display = query ? "block" : "none";
        }

        if (query) {
            const words = query.split(/\s+/);
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
            return;
        }

        // Render Cards
        finished.forEach(project => {
            const card = document.createElement("div");
            card.className = "home-project-card";
            card.dataset.projectId = project.id;
            card.tabIndex = 0;

            const preview = document.createElement("div");
            preview.className = "home-project-preview";

            if (project.thumbnail) {
                const img = document.createElement("img");
                img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(project.thumbnail)}`;
                img.alt = project.name || "Icon";
                preview.appendChild(img);
            } else {
                preview.textContent = "✦";
            }

            const starBtn = document.createElement("button");
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

            card.appendChild(starBtn);

            card.addEventListener("click", () => showProjectPreview(project));
            card.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    showProjectPreview(project);
                }
            });

            homeProjectGrid.appendChild(card);
        });

        updateProjectCounters();
    }

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
            } catch (e) {}
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
            projectMoreSearchButton.textContent = `More icons with "${project.name}" in their name`;
        }

        renderRelatedProjects(project);

        projectDetails.classList.add("show");
        projectDetails.setAttribute("aria-hidden", "false");
    }

    function closeProjectPreview() {
        projectDetails?.classList.remove("show");
        projectDetails?.classList.remove("full-screen");
        projectDetails?.setAttribute("aria-hidden", "true");
        selectedHomeProject = null;
    }

    projectDetailsClose?.addEventListener("click", closeProjectPreview);

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

        saveProjectToBrowser();
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

        switchProject(remix.id);
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

    projectMoreSearchButton?.addEventListener("click", () => {
        if (!projectDetails) return;
        const expanded = projectDetails.classList.toggle("full-screen");
        if (projectRelated) projectRelated.hidden = !expanded;
        projectMoreSearchButton.textContent = expanded ? "Show less" : "More icons with this name";
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

    function openIconEditor() {
        homeScreen?.classList.remove("show");
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
        if (!managementTableContainer) return;

        if (projectManager.projects.length === 0) {
            managementTableContainer.innerHTML = `<p class="home-empty">No projects found.</p>`;
            return;
        }

        let html = `
            <table class="project-table">
                <thead>
                    <tr>
                        <th>Icon Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Last Modified</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        projectManager.projects.forEach(project => {
            const isFinished = project.status === "finished";
            const dateStr = new Date(project.savedAt).toLocaleString();

            html += `
                <tr data-project-id="${project.id}">
                    <td><strong>${project.name || "Untitled"}</strong></td>
                    <td>${project.category || "General"}</td>
                    <td><span class="status-badge ${isFinished ? "finished" : "unfinished"}">${isFinished ? "Finished" : "Unfinished"}</span></td>
                    <td>${dateStr}</td>
                    <td style="text-align: right;">
                        <div class="table-actions" style="justify-content: flex-end;">
                            <button class="btn btn-sm btn-secondary manager-edit-btn" data-id="${project.id}">Edit</button>
                            <button class="btn btn-sm btn-danger manager-delete-btn" data-id="${project.id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        managementTableContainer.innerHTML = html;

        managementTableContainer.querySelectorAll(".manager-edit-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const success = switchProject(btn.dataset.id);
                if (success) openIconEditor();
            });
        });

        managementTableContainer.querySelectorAll(".manager-delete-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                projectManager.projects = projectManager.projects.filter(p => p.id !== id);
                saveProjectManager();
                renderManagementTable();
                renderHomeProjects();
                showToast("Project deleted", "info");
            });
        });
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

        saveProjectToBrowser();

        const activeProject = projectManager.projects.find(p => p.id === projectManager.activeProjectId);
        if (!activeProject) return;

        activeProject.name = name;
        activeProject.category = finishIconCategory.value;
        activeProject.thumbnail = generateSVG();
        activeProject.status = "finished";
        activeProject.savedAt = new Date().toISOString();

        saveProjectManager();
        renderHomeProjects();
        renderUnfinishedProjects();
        updateActiveProjectNameDisplay();

        finishModal.classList.remove("show");
        homeScreen.classList.add("show");
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
        if (homeScreen.classList.contains("show")) {
            renderHomeProjects();
        }
    });

    logoHomeButton?.addEventListener("click", () => {
        homeScreen.classList.add("show");
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
            } else if (moved.type === "curve" || moved.type === "circle") {
                moved.cx += COPY_OFFSET; moved.cy += COPY_OFFSET;
            } else if (moved.type === "rectangle") {
                moved.x += COPY_OFFSET; moved.y += COPY_OFFSET;
            } else if (moved.type === "path") {
                moved.points = moved.points.map(p => ({ x: p.x + COPY_OFFSET, y: p.y + COPY_OFFSET }));
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
    } catch (e) {}

    resetProjectHistory();
    updateHistoryButtons();
    updateActiveProjectNameDisplay();

    console.log("✦ Icon Maker PRO successfully initialized.");
})();
