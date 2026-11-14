/**
 * ============================================================================
 * ICON MAKER PRO — CORE JAVASCRIPT APPLICATION
 * Advanced 24×24 Vector Drawing Engine, Multi-Project Manager & Studio UI
 * ============================================================================
 */

(function () {
    "use strict";

    // =====================================
    // CUSTOM STYLED SELECT DROPDOWNS
    // =====================================

    function createStyledDropdown(select, type) {
        if (!select) return null;

        const wrapper = document.createElement("div");
        wrapper.className = "styled-select";
        wrapper.dataset.select = type;

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "styled-select-trigger";
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");

        const label = document.createElement("span");
        label.className = "styled-select-label";
        const gridModeIcons = {
            full: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3v18" />
            <path d="M3 15h18" />
            <path d="M3 9h18" />
            <path d="M9 3v18" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
    `,
            keyframe: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18" />
            <path d="M3 12h18" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
    `,
            clean: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 9.344V3" />
            <path d="m2 2 20 20" />
            <path d="M20.414 20.414A2 2 0 0119 21H5a2 2 0 01-2-2V5a2 2 0 01.586-1.414" />
            <path d="M20.656 15H21" />
            <path d="M21 9h-6.344" />
            <path d="M3 15h12v6" />
            <path d="M3 9h6v12" />
            <path d="M8.656 3H19a2 2 0 012 2v10.343" />
            <path d="M9 3v.344" />
        </svg>
    `
        };

        const chevron = document.createElement("span");
        chevron.className = "styled-select-chevron";
        chevron.setAttribute("aria-hidden", "true");

        trigger.append(label);

        if (type !== "grid-mode") {
            trigger.append(chevron);
        }

        const menu = document.createElement("div");
        menu.className = "styled-select-menu";
        menu.setAttribute("role", "listbox");

        function close() {
            wrapper.classList.remove("open");
            trigger.setAttribute("aria-expanded", "false");
        }

        function refresh() {
            const selectedOption = select.selectedOptions[0];

            if (type === "grid-mode") {
                label.innerHTML = gridModeIcons[select.value] || "";
                trigger.title = selectedOption?.textContent || "Grid Display Mode";
                trigger.setAttribute(
                    "aria-label",
                    `Grid Display Mode: ${selectedOption?.textContent || ""}`
                );
            } else {
                label.textContent = selectedOption?.textContent || "";
            }

            menu.innerHTML = "";

            Array.from(select.options).forEach(option => {
                const item = document.createElement("button");

                item.type = "button";
                item.className = "styled-select-option";
                item.setAttribute("role", "option");
                item.setAttribute(
                    "aria-selected",
                    String(option.value === select.value)
                );

                if (type === "grid-mode") {
                    const icon = document.createElement("span");
                    icon.className = "styled-select-option-icon";
                    icon.innerHTML = gridModeIcons[option.value] || "";

                    const text = document.createElement("span");
                    text.className = "styled-select-option-label";
                    text.textContent = option.textContent;

                    item.append(icon, text);
                } else {
                    item.textContent = option.textContent;
                }

                if (option.value === select.value) {
                    item.classList.add("selected");
                }

                item.addEventListener("click", () => {
                    select.value = option.value;

                    close();
                    refresh();

                    // Keep the original select's existing change listeners working.
                    select.dispatchEvent(
                        new Event("change", { bubbles: true })
                    );
                });

                menu.appendChild(item);
            });
        }

        trigger.addEventListener("click", event => {
            event.stopPropagation();

            const shouldOpen = !wrapper.classList.contains("open");

            // Close any other custom dropdown first.
            document.querySelectorAll(".styled-select.open").forEach(openDropdown => {
                if (openDropdown !== wrapper) {
                    openDropdown.classList.remove("open");

                    openDropdown
                        .querySelector(".styled-select-trigger")
                        ?.setAttribute("aria-expanded", "false");
                }
            });

            wrapper.classList.toggle("open", shouldOpen);
            trigger.setAttribute("aria-expanded", String(shouldOpen));
        });

        // Close when clicking outside this dropdown.
        document.addEventListener("click", event => {
            if (!wrapper.contains(event.target)) {
                close();
            }
        });

        // Close when Escape is pressed.
        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                close();
            }
        });

        wrapper.append(trigger, menu);

        select.insertAdjacentElement("afterend", wrapper);
        select.classList.add("native-select-hidden");

        refresh();

        return { refresh, close };
    }
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

    const gridModeDropdown = createStyledDropdown(
        gridModeSelect,
        "grid-mode"
    );

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
    const mirrorAxisModeSelect = document.getElementById("mirror-axis-mode");
    const mirrorAxisCountInput = document.getElementById("mirror-axis-count");

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
    const homeSearchScopeToggle = document.getElementById("home-search-scope-toggle");
    const clearSearchBtn = document.getElementById("clear-search-btn");
    const homeCategorySelect = document.getElementById("home-category-select");
    const homeSortSelect = document.getElementById("home-sort-select");
    const homeCategoryDropdown = createStyledDropdown(
        homeCategorySelect,
        "category"
    );

    const homeSortDropdown = createStyledDropdown(
        homeSortSelect,
        "sort"
    );
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
    const snapToggleButton = document.getElementById("snap-toggle-button");

    // Project Manager Views
    const sidebarOptions = document.querySelectorAll(".sidebar-option");
    const homeViewSections = {
        gallery: document.getElementById("home-view-gallery"),
        "icon-library": document.getElementById("home-view-icon-library"),
        projects: document.getElementById("home-view-projects"),
        settings: document.getElementById("home-view-settings")
    };
    const managementTableContainer = document.getElementById("management-table-container");
    const managerNewIconBtn = document.getElementById("manager-new-icon-btn");
    const finishedProjectGrid = document.getElementById("finished-project-grid");
    const unfinishedProjectGrid = document.getElementById("unfinished-project-grid");
    const managerFinishedCount = document.getElementById("manager-finished-count");
    const managerUnfinishedCount = document.getElementById("manager-unfinished-count");

    // Project Manager collapsible sections
    document.querySelectorAll(".collapsible-manager-header").forEach(header => {
        header.addEventListener("click", () => {
            const grid = header.nextElementSibling;
            if (!grid) return;

            const isExpanded = header.getAttribute("aria-expanded") === "true";
            header.setAttribute("aria-expanded", String(!isExpanded));
            grid.hidden = isExpanded;
        });
    });

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
    const projectRelatedPage = document.getElementById("project-related-page");
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
    const deleteConfirmTitle = document.getElementById("delete-confirm-title");
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
    const clearCustomAxisBtn = document.getElementById("clear-custom-axis-btn");
    // Keep the floating transform toolbar outside editor/sidebar stacking contexts.
    if (transformToolbar && transformToolbar.parentElement !== document.body) {
        document.body.appendChild(transformToolbar);
    }

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
    let connections = [];
    let pathDrawing = null;
    let selectedShape = null;
    let selectedShapes = [];

    let dragging = null;
    let draggingTool = null;
    let dropPreview = null;
    let copiedShapes = [];

    let isRestoringProject = false;
    let isCreatingShapeCopy = false;
    let activeHomeTab = "all";
    let searchAllLucideIcons = false; // 'all' | 'recent' | 'favorites'
    let homeViewMode = "grid"; // 'grid' | 'list'
    let galleryViewCategory = "all"; // 'all' | 'categories'
    let selectedCategoryFilter = null;
    let selectedHomeProject = null;
    let projectToDelete = null;

    let artboardSize = 24; // 24 | 32
    let liveSymmetryH = false;
    let liveSymmetryV = false;
    let customMirrorAxes = []; // Custom reflection lines; uniform sets share groupId
    let isPlacingMirrorAxis = false;
    let mirrorAxisPlacementPoints = [];
    let selectedCustomAxisGroupId = null;
    let copiedCustomAxes = [];
    let customAxisDrag = null;

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
        ellipse: ["#38BDF8", "#0EA5E9", "#06B6D4", "#67E8F9"],
        rectangle: ["#FBBF24", "#FB923C", "#F97316", "#F87171"],
        path: ["#A78BFA", "#60A5FA", "#34D399", "#F472B6"]
    };

    const colorCounters = {
        line: 0,
        curve: 0,
        circle: 0,
        ellipse: 0,
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
        "handles",
        "helperGuides",
        "circumferenceGuide",
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

        themeToggleKnob.innerHTML = isLight
            ? '<img src="assets/icons/sun-fill.svg" alt="Sun">'
            : '<img src="assets/icons/moon-fill.svg" alt="Moon">';

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-label",
                isLight ? "Switch to dark theme" : "Switch to light theme"
            );
            themeToggle.setAttribute("aria-pressed", String(isLight));
        }

        // Update Global Preview default color with the theme
        if (globalIconColor) {
            globalIconColor.value = isLight ? "#000000" : "#FFFFFF";
        }

        // Refresh the global preview and its displayed values
        updateGlobalCustomizationState(false);

        try {
            localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark");
        } catch (error) {
            console.warn("Could not save theme preference:", error);
        }
    }
    // =====================================
    // ENDPOINT SNAP TOGGLE
    // =====================================

    let snapEnabled = true;

    function updateSnapButton() {
        if (!snapToggleButton) return;

        snapToggleButton.textContent = snapEnabled ? "Snap" : "Free";
        snapToggleButton.setAttribute("aria-pressed", String(snapEnabled));

        snapToggleButton.title = snapEnabled
            ? "Endpoint snapping ON (Alt + S)"
            : "Endpoint snapping OFF (Alt + S)";
    }

    function toggleSnapping() {
        snapEnabled = !snapEnabled;

        // Cancel any temporary snap during an active drag.
        if (!snapEnabled) {
            if (dragging) {
                dragging.snappedTo = null;
                dragging.sourceHandle = null;
                dragging.releasedSnap = null;
            }

            hideSnapTarget();

            if (endpointSnapIndicator) {
                endpointSnapIndicator.style.display = "none";
            }
        }

        updateSnapButton();
    }

    snapToggleButton?.addEventListener("click", toggleSnapping);

    updateSnapButton();

    function applyAccentColor(color) {
        const normalizedColor = String(color || "").toLowerCase();
        const safeColor = ALLOWED_ACCENTS.includes(normalizedColor) ? normalizedColor : DEFAULT_ACCENT;

        document.body.setAttribute("data-accent", safeColor);
        // Choose readable tooltip text based on accent brightness.
        const hex = safeColor.replace("#", "");

        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        const linearize = value =>
            value <= 0.04045
                ? value / 12.92
                : Math.pow((value + 0.055) / 1.055, 2.4);

        const brightness =
            0.2126 * linearize(r) +
            0.7152 * linearize(g) +
            0.0722 * linearize(b);

        document.documentElement.style.setProperty(
            "--accent-contrast",
            brightness > 0.50 ? "#090a0f" : "#ffffff"
        );

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
        const color = globalIconColor.value ||
            (document.body.classList.contains("light-theme") ? "#000000" : "#ffffff");
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

        const galleryColor =
            document.body.classList.contains("light-theme") &&
                color.toLowerCase() === "#000000"
                ? "rgb(48, 48, 48)"
                : color;
        const defaultColor = document.body.classList.contains("light-theme")
            ? "#000000"
            : "#ffffff";

        const isChanged = color.toLowerCase() !== defaultColor || stroke !== 2 || size !== 24;
        if (resetGlobalCustomization) {
            resetGlobalCustomization.disabled = !isChanged;
        }


        // Apply Global Preview settings to inline SVG thumbnails
        document.querySelectorAll(".home-project-preview svg").forEach(svg => {
            // Icon size
            svg.style.width = `${size}px`;
            svg.style.height = `${size}px`;

            // Icon stroke color and thickness

            svg.querySelectorAll("[stroke], [fill]").forEach(shape => {
                const originalStroke = shape.getAttribute("stroke");
                const originalFill = shape.getAttribute("fill");

                // Update stroke color and thickness
                if (originalStroke && originalStroke !== "none") {
                    shape.style.setProperty("stroke", galleryColor, "important");
                    shape.style.setProperty("stroke-width", `${stroke}px`, "important");
                }

                // Update visible fill without filling transparent shapes
                if (originalFill && originalFill !== "none") {
                    shape.style.setProperty("fill", galleryColor, "important");
                }
            });

        });

        // Keep the open preview drawer synced with global color and stroke width
        if (selectedHomeProject && projectPreviewImage) {
            if (previewStrokeWidth) {
                previewStrokeWidth.value = stroke;
            }

            if (previewStrokeValue) {
                previewStrokeValue.textContent = stroke.toFixed(1);
            }

            projectPreviewImage.src = getPreviewSVG(selectedHomeProject, stroke);
        }

        // Also support image-based thumbnails
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
        if (globalIconColor) {
            globalIconColor.value = document.body.classList.contains("light-theme")
                ? "#000000"
                : "#FFFFFF";
        }
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
            connections: structuredClone(connections),
            customMirrorAxes: structuredClone(customMirrorAxes),
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


    // ========================================================================
    // ICON CATEGORY SYSTEM
    // ========================================================================

    const STANDARD_ICON_CATEGORIES = [
        "Accessibility",
        "Accounts & access",
        "Animals",
        "Arrows",
        "Buildings",
        "Charts",
        "Communication",
        "Connectivity",
        "Cursors",
        "Design",
        "Coding & development",
        "Devices",
        "Emoji",
        "File icons",
        "Finance",
        "Food & beverage",
        "Gaming",
        "Home",
        "Layout",
        "Letters & digits",
        "Mail",
        "Mathematics",
        "Medical",
        "Multimedia",
        "Nature",
        "Navigation & places",
        "Notifications",
        "People",
        "Photography",
        "Science",
        "Seasons",
        "Security",
        "Shapes",
        "Shopping",
        "Social",
        "Sports",
        "Sustainability",
        "Text formatting",
        "Time & calendar",
        "Tools",
        "Transportation",
        "Travel",
        "Weather"
    ];

    const CUSTOM_CATEGORIES_STORAGE_KEY = "iconMakerCustomCategories";
    const CATEGORY_MIGRATION_KEY = "iconMakerCategoryMigrationV1";

    // Keywords used to recognize icon names.
    const ICON_CATEGORY_KEYWORDS = {
        "Accessibility": [
            "accessibility", "wheelchair", "hearing", "blind",
            "screen reader", "assistive"
        ],
        "Accounts & access": [
            "user", "account", "profile", "login", "logout",
            "log-in", "log-out", "password", "key", "contact",
            "badge", "id-card", "fingerprint"
        , "badge-check", "verified badge", "verification badge"],
        "Animals": [
            "cat", "dog", "bird", "fish", "paw", "rabbit",
            "bug", "butterfly", "turtle", "horse", "fox", "wolf"
        ],
        "Arrows": [
            "arrow", "chevron", "move", "undo", "redo",
            "corner", "rotate", "refresh", "repeat", "reply"
        ],
        "Buildings": [
            "building", "hospital", "school", "office",
            "factory", "church", "castle", "warehouse"
        ],
        "Charts": [
            "chart", "graph", "bar-chart", "pie-chart",
            "trending", "analytics", "activity"
        ],
        "Communication": [
            "message", "chat", "comment", "conversation",
            "phone", "call", "speech", "mic", "microphone"
        ],
        "Connectivity": [
            "wifi", "bluetooth", "signal", "network",
            "router", "antenna", "connection", "radio-tower"
        ],
        "Cursors": [
            "cursor", "pointer", "mouse-pointer", "click",
            "hand", "select"
        ],
        "Design": [
            "palette", "paint", "brush", "pen-tool",
            "ruler", "pencil", "draft", "vector", "swatch"
        ],
        "Coding & development": [
            "code", "terminal", "bug", "git", "braces",
            "brackets", "variable", "function", "database",
            "server", "binary", "command"
        ],
        "Devices": [
            "computer", "monitor", "laptop", "desktop",
            "tablet", "smartphone", "mobile", "keyboard",
            "mouse", "printer", "watch"
        ],
        "Emoji": [
            "smile", "smiley", "frown", "laugh", "angry",
            "heart-eyes", "meh", "emoji"
        ],
        "File icons": [
            "file", "folder", "document", "clipboard",
            "archive", "attachment", "paperclip"
        ],
        "Finance": [
            "wallet", "money", "cash", "coin", "bank",
            "credit-card", "dollar", "currency", "receipt",
            "bitcoin", "piggy-bank"
        ],
        "Food & beverage": [
            "food", "coffee", "cup", "pizza", "burger",
            "cake", "apple", "carrot", "beer", "wine",
            "utensils", "restaurant"
        ],
        "Gaming": [
            "gamepad", "game", "joystick", "dice",
            "chess", "controller", "puzzle"
        ],
        "Home": [
            "home", "house", "sofa", "bed", "lamp",
            "door", "window", "refrigerator", "couch"
        ],
        "Layout": [
            "layout", "columns", "rows", "grid", "panel",
            "sidebar", "align", "gallery", "table"
        ],
        "Letters & digits": [
            "letter", "alphabet", "number", "digit",
            "type", "uppercase", "lowercase"
        ],
        "Mail": [
            "mail", "email", "inbox", "envelope",
            "send", "forward", "reply-all"
        ],
        "Mathematics": [
            "plus", "minus", "divide", "multiply",
            "equals", "percent", "infinity", "calculator",
            "sigma", "pi", "sqrt"
        ],
        "Medical": [
            "medical", "health", "hospital", "pill",
            "medicine", "stethoscope", "syringe",
            "thermometer", "bandage", "heart-pulse"
        ],
        "Multimedia": [
            "play", "pause", "stop", "video", "music",
            "audio", "volume", "speaker", "headphones",
            "film", "clapperboard"
        ],
        "Nature": [
            "tree", "flower", "leaf", "plant", "forest",
            "mountain", "earth", "globe", "seedling"
        ],
        "Navigation & places": [
            "map", "map-pin", "location", "compass",
            "navigation", "pin", "landmark", "signpost"
        ],
        "Notifications": [
            "bell", "notification", "alert", "alarm",
            "warning", "badge"
        ],
        "People": [
            "users", "people", "person", "man", "woman",
            "child", "baby", "group", "team", "smile"
        ],
        "Photography": [
            "camera", "image", "photo", "picture",
            "aperture", "focus", "scan"
        ],
        "Science": [
            "flask", "atom", "microscope", "telescope",
            "dna", "molecule", "beaker", "test-tube"
        ],
        "Seasons": [
            "spring", "summer", "autumn", "fall", "winter"
        ],
        "Security": [
            "shield", "lock", "unlock", "security",
            "safe", "fingerprint", "scan-face"
        , "badge-check", "verified badge", "verification badge"],
        "Shapes": [
            "circle", "square", "triangle", "rectangle",
            "hexagon", "polygon", "shape", "pentagon",
            "octagon", "diamond"
        ],
        "Shopping": [
            "cart", "shopping", "bag", "basket",
            "store", "tag", "barcode", "package"
        ],
        "Social": [
            "share", "social", "heart", "thumbs-up",
            "thumbs-down", "like", "follow", "hashtag"
        ],
        "Sports": [
            "football", "basketball", "soccer", "tennis",
            "trophy", "medal", "volleyball", "baseball"
        ],
        "Sustainability": [
            "recycle", "recycling", "eco", "sustainability",
            "solar", "wind", "renewable"
        ],
        "Text formatting": [
            "bold", "italic", "underline", "strikethrough",
            "align-left", "align-center", "align-right",
            "list", "heading", "type"
        ],
        "Time & calendar": [
            "clock", "calendar", "timer", "hourglass",
            "watch", "history", "stopwatch", "date"
        ],
        "Tools": [
            "tool", "wrench", "hammer", "screwdriver",
            "settings", "sliders", "cog", "gear"
        ],
        "Transportation": [
            "car", "bus", "train", "truck", "bicycle",
            "bike", "plane", "ship", "taxi", "motorcycle"
        ],
        "Travel": [
            "suitcase", "luggage", "passport", "ticket",
            "hotel", "tent", "backpack", "旅"
        ],
        "Weather": [
            "sun", "moon", "cloud", "rain", "snow",
            "wind", "storm", "cloudy", "sunrise", "sunset"
        ]
    };

   // Automatically detect all matching categories from an icon's name.
function detectIconCategories(iconName) {
    const name = (iconName || "").toLowerCase()
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!name) return ["Uncategorized"];

    const searchableName = " " + name + " ";
    const matches = new Set();

    for (const [category, keywords] of Object.entries(ICON_CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            const normalizedKeyword = keyword.toLowerCase()
                .replace(/[_-]+/g, " ")
                .replace(/\s+/g, " ")
                .trim();

            // Match complete words/phrases, not accidental substrings.
            if (searchableName.includes(" " + normalizedKeyword + " ")) {
                matches.add(category);
            }
        }
    }

    return matches.size ? [...matches] : ["Uncategorized"];
}

    // Map official Lucide category labels to the editor's category vocabulary.
    const LUCIDE_CATEGORY_MAP = {
        "accessibility": "Accessibility",
        "account": "Accounts & access",
        "accounts": "Accounts & access",
        "animals": "Animals",
        "arrows": "Arrows",
        "buildings": "Buildings",
        "charts": "Charts",
        "communication": "Communication",
        "connectivity": "Connectivity",
        "cursors": "Cursors",
        "design": "Design",
        "development": "Coding & development",
        "coding": "Coding & development",
        "devices": "Devices",
        "emoji": "Emoji",
        "files": "File icons",
        "file": "File icons",
        "finance": "Finance",
        "food": "Food & beverage",
        "food beverage": "Food & beverage",
        "gaming": "Gaming",
        "home": "Home",
        "layout": "Layout",
        "letters": "Letters & digits",
        "letters digits": "Letters & digits",
        "mail": "Mail",
        "math": "Mathematics",
        "mathematics": "Mathematics",
        "medical": "Medical",
        "multimedia": "Multimedia",
        "nature": "Nature",
        "navigation": "Navigation & places",
        "notifications": "Notifications",
        "people": "People",
        "photography": "Photography",
        "science": "Science",
        "seasons": "Seasons",
        "security": "Security",
        "shapes": "Shapes",
        "shopping": "Shopping",
        "social": "Social",
        "sports": "Sports",
        "sustainability": "Sustainability",
        "text": "Text formatting",
        "text formatting": "Text formatting",
        "time": "Time & calendar",
        "tools": "Tools",
        "transportation": "Transportation",
        "travel": "Travel",
        "weather": "Weather"
    };

    function getOfficialProjectCategories(project) {
        if (!project || !iconMetadataCache) return [];
        const record = getIconMetadataRecord(iconMetadataCache, project.name);
        const official = Array.isArray(record?.lucide?.categories) ? record.lucide.categories : [];
        return [...new Set(official.map(value => {
            const key = String(value).toLowerCase().replace(/[-_]+/g, " ").trim();
            return LUCIDE_CATEGORY_MAP[key] || null;
        }).filter(Boolean))];
    }

    // Resolve effective categories. Manual choices always override automatic sources.
    function getProjectCategories(project) {
        if (!project) return ["Uncategorized"];
        if (Array.isArray(project.manualCategories) && project.manualCategories.length)
            return [...new Set(project.manualCategories.filter(Boolean))];

        const savedAutomatic = Array.isArray(project.autoCategories)
            ? project.autoCategories.filter(value => value && value !== "Uncategorized")
            : [];
        const official = getOfficialProjectCategories(project);
        const detected = detectIconCategories(project.name || "")
            .filter(value => value !== "Uncategorized");

        const combined = [...new Set([...savedAutomatic, ...official, ...detected])];
        return combined.length ? combined : ["Uncategorized"];
    }

    function setProjectManualCategories(project, categories) {
        const cleaned = [...new Set((categories || []).map(c => String(c).trim()).filter(Boolean))];
        if (!cleaned.length) return false;
        project.manualCategories = cleaned;
        project.categories = [...cleaned];
        project.categorySource = "manual";
        project.category = cleaned[0];
        return true;
    }

    function refreshProjectAutomaticCategories(project) {
        if (!project) return;
        const detected = detectIconCategories(project.name || "")
            .filter(value => value !== "Uncategorized");
        const official = getOfficialProjectCategories(project);
        project.autoCategories = [...new Set([...official, ...detected])];
        if (!Array.isArray(project.manualCategories) || !project.manualCategories.length) {
            project.categories = [...project.autoCategories];
            project.categorySource = "automatic";
            project.category = project.autoCategories[0] || "Uncategorized";
        }
    }

    // Get saved custom categories.
    function getCustomCategories() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY) || "[]"
            );

            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not load custom categories:", error);
            return [];
        }
    }

    function getAllIconCategories() {
        return [
            ...STANDARD_ICON_CATEGORIES,
            ...getCustomCategories(),
            "Uncategorized"
        ];
    }

    function saveCustomCategory(categoryName) {
        const name = categoryName.trim();

        if (!name) return false;

        const allCategories = getAllIconCategories();

        if (allCategories.some(
            category => category.toLowerCase() === name.toLowerCase()
        )) {
            return false;
        }

        const customCategories = getCustomCategories();
        customCategories.push(name);

        localStorage.setItem(
            CUSTOM_CATEGORIES_STORAGE_KEY,
            JSON.stringify(customCategories)
        );

        return true;
    }

   function populateFinishCategories(selectedCategories = ["Uncategorized"]) {
    if (!finishIconCategory) return;

    const selected = Array.isArray(selectedCategories)
        ? selectedCategories
        : [selectedCategories];

    finishIconCategory.innerHTML = "";

    getAllIconCategories().forEach(category => {
        const label = document.createElement("label");
        label.className = "finish-category-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category;
        checkbox.checked = selected.includes(category);

        const text = document.createElement("span");
        text.textContent = category;

        label.append(checkbox, text);
        finishIconCategory.appendChild(label);
    });
}

function getSelectedFinishCategories() {
    return Array.from(
        finishIconCategory?.querySelectorAll('input[type="checkbox"]:checked') || []
    ).map(checkbox => checkbox.value);
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
            } else {
                // Migrate legacy single-project save if it exists.
                const oldSave = localStorage.getItem(PROJECT_STORAGE_KEY);
                const firstProject = createProject(
                    oldSave ? JSON.parse(oldSave) : null
                );

                projectManager = {
                    activeProjectId: firstProject.id,
                    projects: [firstProject]
                };
            }

            if (!Array.isArray(projectManager.projects)) {
                projectManager.projects = [];
            }

            // Normalize category data without overwriting previously saved manual choices.
            projectManager.projects.forEach(project => {
                if (project.status !== "finished") return;

                if (!Array.isArray(project.manualCategories) || !project.manualCategories.length) {
                    if (Array.isArray(project.categories) && project.categories.length) {
                        // Before this migration, categories[] was populated by the
                        // Finish dialog, so preserve the user's multi-select choices.
                        project.manualCategories = [...new Set(project.categories.filter(Boolean))];
                    } else if ((!Array.isArray(project.autoCategories) || !project.autoCategories.length) &&
                               project.category && project.category !== "General" &&
                               project.category !== "Uncategorized") {
                        project.manualCategories = [project.category];
                    }
                }

                refreshProjectAutomaticCategories(project);
                if (project.manualCategories?.length) {
                    project.categories = [...project.manualCategories];
                    project.categorySource = "manual";
                    project.category = project.manualCategories[0];
                }
            });

            localStorage.setItem(CATEGORY_MIGRATION_KEY, "true");
            saveProjectManager();

        } catch (error) {
            console.error("Could not load projects:", error);

            projectManager = {
                activeProjectId: null,
                projects: []
            };
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
            connections = Array.isArray(projectData.connections)
                ? structuredClone(projectData.connections)
                : [];
            customMirrorAxes = Array.isArray(projectData.customMirrorAxes)
                ? structuredClone(projectData.customMirrorAxes)
                : [];
            selectedCustomAxisGroupId = null;
            selectedShape = null;
            selectedShapes = [];

            // Reconstruct shape objects and SVG elements
            projectData.shapes.forEach(data => {
                const shape = createShapeFromCopy(data, true);
                if (shape) {
                    getShapeElements(shape).forEach(el => {
                        el.style.visibility = shape.hidden ? "hidden" : "visible";
                    });
                }
            });

            renderCustomMirrorAxes();

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
            connections: structuredClone(connections),
            customMirrorAxes: structuredClone(customMirrorAxes),
            selectedCustomAxisGroupId,
            selectedShape,
            selectedShapes: [...selectedShapes]
        };
    }

    function getHistoryKey(snapshot) {
        return JSON.stringify({
            connections: snapshot.connections,
            customMirrorAxes: snapshot.customMirrorAxes || [],
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

        // Restore custom mirror axes and persistent handle connections.
        customMirrorAxes = structuredClone(snapshot.customMirrorAxes || []);
        selectedCustomAxisGroupId = snapshot.selectedCustomAxisGroupId || null;
        renderCustomMirrorAxes();
        connections = structuredClone(snapshot.connections || []);
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
        refreshConnectionHandles();
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

        updateGridZoomDetail();
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

        if (minorRect) {
            minorRect.setAttribute("width", size);
            minorRect.setAttribute("height", size);
        }

        if (majorRect) {
            majorRect.setAttribute("width", size);
            majorRect.setAttribute("height", size);
        }

        // Keep eight equal major-grid divisions on both artboard sizes.
        const majorSpacing = size / 8;

        const majorPattern = document.getElementById("major-grid");
        const majorPatternPath = document.getElementById("major-grid-path");

        if (majorPattern) {
            majorPattern.setAttribute("width", majorSpacing);
            majorPattern.setAttribute("height", majorSpacing);
        }

        if (majorPatternPath) {
            majorPatternPath.setAttribute(
                "d",
                `M ${majorSpacing} 0 L 0 0 0 ${majorSpacing}`
            );
        }

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
        if (gridModeSelect) {
            gridModeSelect.value = mode;
            gridModeDropdown?.refresh();
        }

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
            if (dotGridBg) dotGridBg.style.display = "none";
        }
        updateGridZoomDetail();
    }

    // Fine subdivisions are visual guides only.
    // They do not change snapping or drawing coordinates.
    function updateGridZoomDetail() {
        const showFineGrid = currentGridDisplayMode === "full";

        const halfGrid = document.getElementById("half-grid-rect");
        const quarterGrid = document.getElementById("quarter-grid-rect");

        if (halfGrid) {
            halfGrid.style.display =
                showFineGrid && zoomLevel >= 2 ? "block" : "none";
        }

        if (quarterGrid) {
            quarterGrid.style.display =
                showFineGrid && zoomLevel >= 3.25 ? "block" : "none";
        }

        if (dotGridBg) {
            dotGridBg.style.display = "none";
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

        const previewColor = document.body.classList.contains("light-theme")
            ? "#000000"
            : "#83B5FF";

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
        } else if (draggingTool === "bezier") {
            dropPreview = document.createElementNS(SVG_NS, "path");

            dropPreview.setAttribute(
                "d",
                `M ${Math.max(0, x - 3)} ${y + 1.5}
         C ${Math.max(0, x - 1.5)} ${Math.max(0, y - 2.5)}
           ${Math.min(artboardSize, x + 1.5)} ${Math.max(0, y - 2.5)}
           ${Math.min(artboardSize, x + 3)} ${y + 1.5}`
            );

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
        } else if (type === "bezier") {
            createBezierCurve(position.x, position.y);
        } else if (type === "ellipse-arc") {
            createEllipseArc(position.x, position.y);
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
    let isSyncingSymmetryGroup = false;

    function getShapeData(shape) {
        const data = {};

        Object.keys(shape).forEach(key => {
            if (!shapeDOMKeys.has(key)) {
                data[key] = structuredClone(shape[key]);
            }
        });

        return data;
    }

    function reflectSymmetryPoint(x, y, axis) {
        const dx = axis.x2 - axis.x1;
        const dy = axis.y2 - axis.y1;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared < 0.000001) {
            return { x, y };
        }

        const t = (
            (x - axis.x1) * dx +
            (y - axis.y1) * dy
        ) / lengthSquared;

        const projectedX = axis.x1 + t * dx;
        const projectedY = axis.y1 + t * dy;

        return {
            x: 2 * projectedX - x,
            y: 2 * projectedY - y
        };
    }

    function getActiveSymmetryAxes() {
        const axes = [];

        if (liveSymmetryV) {
            axes.push({
                type: "vertical",
                x1: artboardSize / 2,
                y1: 0,
                x2: artboardSize / 2,
                y2: artboardSize
            });
        }

        if (liveSymmetryH) {
            axes.push({
                type: "horizontal",
                x1: 0,
                y1: artboardSize / 2,
                x2: artboardSize,
                y2: artboardSize / 2
            });
        }

        customMirrorAxes.forEach(axis => {
            if (axis.active !== false) {
                axes.push({
                    type: "custom",
                    x1: axis.x1,
                    y1: axis.y1,
                    x2: axis.x2,
                    y2: axis.y2
                });
            }
        });

        return axes;
    }




    function reflectShapeData(data, axis) {
        const reflect = (x, y) =>
            reflectSymmetryPoint(x, y, axis);

        const axisAngle = Math.atan2(
            axis.y2 - axis.y1,
            axis.x2 - axis.x1
        );

        if (data.type === "line") {
            const p1 = reflect(data.x1, data.y1);
            const p2 = reflect(data.x2, data.y2);

            data.x1 = p1.x;
            data.y1 = p1.y;
            data.x2 = p2.x;
            data.y2 = p2.y;
        }

        else if (data.type === "curve") {
            const start = reflect(
                data.cx + data.radius * Math.cos(data.startAngle),
                data.cy + data.radius * Math.sin(data.startAngle)
            );

            const end = reflect(
                data.cx + data.radius * Math.cos(data.endAngle),
                data.cy + data.radius * Math.sin(data.endAngle)
            );

            const center = reflect(data.cx, data.cy);

            data.cx = center.x;
            data.cy = center.y;

            data.startAngle = Math.atan2(
                start.y - center.y,
                start.x - center.x
            );

            data.endAngle = Math.atan2(
                end.y - center.y,
                end.x - center.x
            );
            data.sweepFlag = data.sweepFlag === 0 ? 1 : 0;
        }

        else if (data.type === "ellipse-arc") {
            const center = reflect(data.cx, data.cy);

            data.cx = center.x;
            data.cy = center.y;

            data.rotation =
                2 * axisAngle - (data.rotation || 0);

            data.startAngle = -data.startAngle;
            data.endAngle = -data.endAngle;

            data.sweepFlag = data.sweepFlag === 0 ? 1 : 0;
        }

        else if (
            data.type === "circle" ||
            data.type === "ellipse"
        ) {
            const center = reflect(data.cx, data.cy);

            data.cx = center.x;
            data.cy = center.y;
        }

        else if (data.type === "rectangle") {
            const center = reflect(
                data.x + data.width / 2,
                data.y + data.height / 2
            );

            data.x = center.x - data.width / 2;
            data.y = center.y - data.height / 2;
        }

        else if (data.type === "path") {
            // Reflect the Bézier path's movement offset.
            const offsetOrigin = reflect(0, 0);
            const offsetPoint = reflect(
                data.offsetX || 0,
                data.offsetY || 0
            );

            data.offsetX = offsetPoint.x - offsetOrigin.x;
            data.offsetY = offsetPoint.y - offsetOrigin.y;

            // Normal editable paths
            data.points = (data.points || []).map(point =>
                reflect(point.x, point.y)
            );

            data.holes = (data.holes || []).map(hole => {
                const points = Array.isArray(hole)
                    ? hole
                    : hole.points;

                const reflected = (points || []).map(point =>
                    reflect(point.x, point.y)
                );

                return Array.isArray(hole)
                    ? reflected
                    : { ...hole, points: reflected };
            });

            // SVG paths, including Bézier curves
            if (Array.isArray(data.svgEditableSegments)) {

                data.svgEditableSegments.forEach(segment => {

                    const coordinatePairs = [
                        ["x", "y"],
                        ["x1", "y1"],
                        ["cx", "cy"],
                        ["cx1", "cy1"],
                        ["cx2", "cy2"]
                    ];

                    coordinatePairs.forEach(([xKey, yKey]) => {
                        if (
                            typeof segment[xKey] === "number" &&
                            typeof segment[yKey] === "number"
                        ) {
                            const point = reflect(
                                segment[xKey],
                                segment[yKey]
                            );

                            segment[xKey] = point.x;
                            segment[yKey] = point.y;
                        }
                    });

                    // SVG elliptical arc segments
                    if (segment.type === "arc") {
                        segment.rotation =
                            2 * axisAngle - (segment.rotation || 0);

                        segment.sweep = segment.sweep === 0 ? 1 : 0;
                    }
                });

                // Rebuild the SVG path from its reflected segments
                data.svgPathData = serializeSVGSegments(
                    data.svgEditableSegments
                );

                data.svgAnchors = buildSVGAnchorMap(
                    data.svgEditableSegments
                );
            }
        }

        return data;
    }





    function getSymmetryShapeCenter(data) {
        if (data.type === "line") {
            return { x: (data.x1 + data.x2) / 2, y: (data.y1 + data.y2) / 2 };
        }

        if (
            data.type === "curve" ||
            data.type === "ellipse-arc" ||
            data.type === "circle" ||
            data.type === "ellipse"
        ) {
            return { x: data.cx, y: data.cy };
        }

        if (data.type === "rectangle") {
            return {
                x: data.x + data.width / 2,
                y: data.y + data.height / 2
            };
        }

        const points = [];
        const addPoints = list => {
            (list || []).forEach(point => {
                if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
                    points.push(point);
                }
            });
        };

        addPoints(data.points);
        (data.holes || []).forEach(hole =>
            addPoints(Array.isArray(hole) ? hole : hole.points)
        );

        if (Array.isArray(data.svgEditableSegments)) {
            data.svgEditableSegments.forEach(segment => {
                [["x", "y"], ["x1", "y1"], ["cx", "cy"],
                    ["cx1", "cy1"], ["cx2", "cy2"]].forEach(([xKey, yKey]) => {
                    if (
                        Number.isFinite(segment[xKey]) &&
                        Number.isFinite(segment[yKey])
                    ) {
                        points.push({ x: segment[xKey], y: segment[yKey] });
                    }
                });
            });
        }

        if (points.length) {
            return {
                x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
                y: points.reduce((sum, point) => sum + point.y, 0) / points.length
            };
        }

        return { x: artboardSize / 2, y: artboardSize / 2 };
    }

    function getSymmetryGeometryKey(data) {
        const ignored = new Set([
            "id", "name", "color", "fill", "hidden", "locked",
            "strokeWidth", "cap", "opacity",
            "symmetryGroupId", "symmetryMember", "symmetryTransforms",
            "element", "handles"
        ]);

        const clean = value => {
            if (typeof value === "number") {
                return Number.isFinite(value)
                    ? Math.round(value * 10000) / 10000
                    : null;
            }

            if (Array.isArray(value)) return value.map(clean);

            if (value && typeof value === "object") {
                const result = {};
                Object.keys(value).sort().forEach(key => {
                    if (!ignored.has(key)) result[key] = clean(value[key]);
                });
                return result;
            }

            return value;
        };

        return JSON.stringify(clean(data));
    }

    function getConcurrentSymmetrySectors(axes) {
        if (axes.length < 2) return null;

        const first = axes[0];
        const second = axes.find(axis =>
            Math.abs(
                (first.x2 - first.x1) * (axis.y2 - axis.y1) -
                (first.y2 - first.y1) * (axis.x2 - axis.x1)
            ) > 0.000001
        );

        if (!second) return null;

        const x1 = first.x1;
        const y1 = first.y1;
        const dx1 = first.x2 - first.x1;
        const dy1 = first.y2 - first.y1;
        const x2 = second.x1;
        const y2 = second.y1;
        const dx2 = second.x2 - second.x1;
        const dy2 = second.y2 - second.y1;
        const denominator = dx1 * dy2 - dy1 * dx2;

        const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / denominator;
        const center = { x: x1 + t * dx1, y: y1 + t * dy1 };

        const tolerance = Math.max(0.05, artboardSize * 0.0005);
        const allMeet = axes.every(axis => {
            const dx = axis.x2 - axis.x1;
            const dy = axis.y2 - axis.y1;
            const length = Math.hypot(dx, dy);
            if (length < 0.000001) return false;

            const distance = Math.abs(
                dx * (center.y - axis.y1) -
                dy * (center.x - axis.x1)
            ) / length;

            return distance <= tolerance;
        });

        if (!allMeet) return null;

        const rays = [];
        axes.forEach((axis, axisIndex) => {
            const angle = Math.atan2(
                axis.y2 - axis.y1,
                axis.x2 - axis.x1
            );
            const normalize = value => {
                value %= Math.PI * 2;
                return value < 0 ? value + Math.PI * 2 : value;
            };

            rays.push({ angle: normalize(angle), axisIndex });
            rays.push({ angle: normalize(angle + Math.PI), axisIndex });
        });

        rays.sort((a, b) => a.angle - b.angle);

        // Coincident axes are one mirror boundary, not multiple boundaries.
        const uniqueRays = [];
        rays.forEach(ray => {
            const previous = uniqueRays[uniqueRays.length - 1];
            if (
                previous &&
                Math.abs(previous.angle - ray.angle) < 0.00001
            ) {
                return;
            }
            uniqueRays.push(ray);
        });

        if (uniqueRays.length < 2) return null;

        return { center, rays: uniqueRays };
    }

    function getSymmetrySectorIndex(data, sectorMap) {
        const center = getSymmetryShapeCenter(data);
        const angle = Math.atan2(
            center.y - sectorMap.center.y,
            center.x - sectorMap.center.x
        );
        const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
        const rays = sectorMap.rays;

        for (let i = 0; i < rays.length; i++) {
            const next = (i + 1) % rays.length;
            const start = rays[i].angle;
            const end = next === 0
                ? rays[next].angle + Math.PI * 2
                : rays[next].angle;
            const adjusted = normalized < start
                ? normalized + Math.PI * 2
                : normalized;

            if (adjusted >= start - 0.000001 && adjusted < end - 0.000001) {
                return i;
            }
        }

        return 0;
    }

    function applyLiveSymmetry(sourceShape) {
        if (
            isApplyingLiveSymmetry ||
            isCreatingShapeCopy ||
            isRestoringProject ||
            !sourceShape ||
            sourceShape.symmetryGroupId
        ) {
            return;
        }

        const axes = getActiveSymmetryAxes();
        if (!axes.length) return;

        const groupId = crypto.randomUUID();
        const savedAxes = structuredClone(axes);

        sourceShape.symmetryGroupId = groupId;
        sourceShape.symmetryMember = "original";
        sourceShape.symmetryTransforms = [];

        isApplyingLiveSymmetry = true;

        try {
            const originalData = getShapeData(sourceShape);
            const sectorMap = getConcurrentSymmetrySectors(savedAxes);
            const queue = [{
                data: structuredClone(originalData),
                transforms: [],
                sector: sectorMap
                    ? getSymmetrySectorIndex(originalData, sectorMap)
                    : null
            }];

            const createdKeys = new Set([
                getSymmetryGeometryKey(originalData)
            ]);
            const occupiedSectors = new Set(
                sectorMap ? [queue[0].sector] : []
            );
            const generated = [];

            // With concurrent axes, each sector has exactly two neighboring
            // boundaries. A newly created copy is queued and checks its own
            // two boundaries, so propagation naturally fills the whole fan.
            // For non-concurrent axes, use geometric de-duplication and keep
            // reflected copies inside the artboard to prevent endless growth.
            while (queue.length) {
                const current = queue.shift();
                let adjacentAxes;

                if (sectorMap) {
                    const rays = sectorMap.rays;
                    const sectorIndex = current.sector;
                    const previousRay = rays[sectorIndex];
                    const nextRay = rays[(sectorIndex + 1) % rays.length];

                    adjacentAxes = [
                        savedAxes[previousRay.axisIndex],
                        savedAxes[nextRay.axisIndex]
                    ].filter((axis, index, list) =>
                        axis && list.indexOf(axis) === index
                    );
                } else {
                    adjacentAxes = savedAxes;
                }

                adjacentAxes.forEach(axis => {
                    const reflected = structuredClone(current.data);
                    reflectShapeData(reflected, axis);

                    const center = getSymmetryShapeCenter(reflected);

                    if (
                        !sectorMap &&
                        (
                            center.x < -0.001 ||
                            center.y < -0.001 ||
                            center.x > artboardSize + 0.001 ||
                            center.y > artboardSize + 0.001
                        )
                    ) {
                        return;
                    }

                    const geometryKey = getSymmetryGeometryKey(reflected);
                    if (createdKeys.has(geometryKey)) return;

                    let nextSector = null;
                    if (sectorMap) {
                        nextSector = getSymmetrySectorIndex(reflected, sectorMap);
                        if (occupiedSectors.has(nextSector)) return;
                        occupiedSectors.add(nextSector);
                    }

                    createdKeys.add(geometryKey);

                    const transforms = [
                        ...current.transforms,
                        structuredClone(axis)
                    ];

                    generated.push({
                        data: reflected,
                        transforms
                    });

                    queue.push({
                        data: reflected,
                        transforms,
                        sector: nextSector
                    });
                });
            }

            generated.forEach((item, index) => {
                const data = item.data;

                data.name =
                    `${sourceShape.name || sourceShape.type} (Symmetry)`;
                data.symmetryGroupId = groupId;
                data.symmetryMember = `member-${index + 1}`;
                data.symmetryTransforms = item.transforms;

                createShapeFromCopy(data);
            });
        } finally {
            isApplyingLiveSymmetry = false;
        }
    }

    function updateSymmetryMember(member) {
        if (member.type === "line") {
            updateLine(member);
        } else if (member.type === "curve") {
            updateCurve(member);
        } else if (member.type === "ellipse-arc") {
            updateEllipseArc(member);
        } else if (
            member.type === "circle" ||
            member.type === "ellipse" ||
            member.type === "rectangle"
        ) {
            updateBasicShape(member);
        } else if (member.type === "path") {
            updatePathShape(member);
        }
    }


    function syncSymmetryGroup(editedShape) {
        if (
            isSyncingSymmetryGroup ||
            !editedShape ||
            !editedShape.symmetryGroupId
        ) {
            return;
        }

        const members = getSymmetryGroupMembers(editedShape);

        if (members.length <= 1) return;

        const sourceData = getShapeData(editedShape);

        isSyncingSymmetryGroup = true;

        try {
            // First convert the edited member back into
            // the original member's coordinate system.
            const originalData = structuredClone(sourceData);

            const sourceTransforms =
                editedShape.symmetryTransforms || [];

            // Reverse the transforms in reverse order.
            [...sourceTransforms].reverse().forEach(axis => {
                reflectShapeData(originalData, axis);
            });

            // Now generate every other member from the original.
            members.forEach(member => {
                if (member === editedShape) return;

                const data = structuredClone(originalData);

                const targetTransforms =
                    member.symmetryTransforms || [];

                targetTransforms.forEach(axis => {
                    reflectShapeData(data, axis);
                });

                delete data.id;
                delete data.symmetryGroupId;
                delete data.symmetryMember;
                delete data.symmetryTransforms;

                Object.assign(member, data);

                updateSymmetryMember(member);
            });
        } finally {
            isSyncingSymmetryGroup = false;
        }
    }




    function getShapeElements(shape) {
        // Mark only actual artwork elements for theme-aware preview styling
        if (shape.element) {
            shape.element.classList.add("svg-artwork");
        }

        if (shape.strokeElement) {
            shape.strokeElement.classList.add("svg-artwork");
        }
        if (shape.type === "line") {
            return [shape.hoverBg, shape.element, shape.guideBg, shape.guide, shape.hitLine].filter(Boolean);
        }
        if (shape.type === "curve") {
            return [shape.element, shape.guideBg, shape.guide, shape.hitPath, shape.horizontalGuide, shape.angleGuide].filter(Boolean);
        }
        if (shape.type === "ellipse-arc") {
            return [
                shape.element,
                shape.hitPath,
                ...(shape.helperGuides || [])
            ].filter(Boolean);
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
            sweepFlag: 1,
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


    function createEllipseArc(x, y) {
        const color = getNextColor("curve");

        const element = document.createElementNS(SVG_NS, "path");
        const hitPath = document.createElementNS(SVG_NS, "path");
        const centerHorizontalGuide = document.createElementNS(SVG_NS, "line");
        const centerVerticalGuide = document.createElementNS(SVG_NS, "line");
        const startRadialGuide = document.createElementNS(SVG_NS, "line");
        const endRadialGuide = document.createElementNS(SVG_NS, "line");
        const endpointChordGuide = document.createElementNS(SVG_NS, "line");

        const helperGuides = [
            centerHorizontalGuide,
            centerVerticalGuide,
            startRadialGuide,
            endRadialGuide,
            endpointChordGuide
        ];

        const shape = {
            type: "ellipse-arc",
            name: "Ellipse Arc",

            cx: x,
            cy: y,

            rx: 3,
            ry: 2,

            startAngle: Math.PI,
            endAngle: 0,
            rotation: 0,
            sweepFlag: 1,

            color,
            strokeWidth: 2,
            fill: "none",

            hidden: false,
            locked: false,

            element,
            helperGuides,
            hitPath,
            handles: []
        };

        helperGuides.forEach(guide => {
            guide.setAttribute("stroke", "#FBBF24");
            guide.setAttribute("stroke-width", "0.12");
            guide.setAttribute("stroke-dasharray", "0.4 0.3");
            guide.setAttribute("fill", "none");
            guide.setAttribute("pointer-events", "none");
            guide.style.display = "none";
        });
        function showEllipseArcGuides() {
            helperGuides.forEach(guide => {
                guide.style.display = "block";
            });
        }

        function hideEllipseArcGuides() {
            helperGuides.forEach(guide => {
                guide.style.display = "none";
            });
        }

        hitPath.addEventListener("pointerenter", showEllipseArcGuides);
        hitPath.addEventListener("pointerleave", hideEllipseArcGuides);

        element.setAttribute("fill", "none");
        element.setAttribute("stroke", color);
        element.setAttribute("stroke-width", "2");
        element.setAttribute("stroke-linecap", "round");
        element.setAttribute("pointer-events", "none");

        hitPath.setAttribute("fill", "none");
        hitPath.setAttribute("stroke", "transparent");
        hitPath.setAttribute("stroke-width", "3");
        hitPath.setAttribute("stroke-linecap", "round");
        hitPath.setAttribute("pointer-events", "stroke");
        hitPath.classList.add("ellipse-arc-hit-area");

        hitPath.style.cursor = "move";

        helperGuides.forEach(guide => {
            workspace.appendChild(guide);
        });
        workspace.appendChild(element);
        workspace.appendChild(hitPath);

        shapes.push(shape);

        updateEllipseArc(shape);
        selectShape(shape);

        applyLiveSymmetry(shape);

        return shape;
    }
    function getEllipseArcPoint(shape, angle) {
        const rotation = shape.rotation || 0;

        const localX = shape.rx * Math.cos(angle);
        const localY = shape.ry * Math.sin(angle);

        return {
            x: shape.cx +
                localX * Math.cos(rotation) -
                localY * Math.sin(rotation),

            y: shape.cy +
                localX * Math.sin(rotation) +
                localY * Math.cos(rotation)
        };
    }
    function updateEllipseArc(shape) {
        const start = getEllipseArcPoint(shape, shape.startAngle);
        const end = getEllipseArcPoint(shape, shape.endAngle);

        const rotationDegrees =
            (shape.rotation || 0) * 180 / Math.PI;

        // Centre horizontal guide
        shape.helperGuides[0].setAttribute("x1", 0);
        shape.helperGuides[0].setAttribute("y1", shape.cy);
        shape.helperGuides[0].setAttribute("x2", artboardSize);
        shape.helperGuides[0].setAttribute("y2", shape.cy);

        // Centre vertical guide
        shape.helperGuides[1].setAttribute("x1", shape.cx);
        shape.helperGuides[1].setAttribute("y1", 0);
        shape.helperGuides[1].setAttribute("x2", shape.cx);
        shape.helperGuides[1].setAttribute("y2", artboardSize);

        // Start radial guide
        shape.helperGuides[2].setAttribute("x1", shape.cx);
        shape.helperGuides[2].setAttribute("y1", shape.cy);
        shape.helperGuides[2].setAttribute("x2", start.x);
        shape.helperGuides[2].setAttribute("y2", start.y);

        // End radial guide
        shape.helperGuides[3].setAttribute("x1", shape.cx);
        shape.helperGuides[3].setAttribute("y1", shape.cy);
        shape.helperGuides[3].setAttribute("x2", end.x);
        shape.helperGuides[3].setAttribute("y2", end.y);

        // Chord
        shape.helperGuides[4].setAttribute("x1", start.x);
        shape.helperGuides[4].setAttribute("y1", start.y);
        shape.helperGuides[4].setAttribute("x2", end.x);
        shape.helperGuides[4].setAttribute("y2", end.y);


        const sweep = shape.sweepFlag ?? 1;

        let delta = shape.endAngle - shape.startAngle;

        if (sweep === 1) {
            while (delta < 0) delta += Math.PI * 2;
            while (delta >= Math.PI * 2) delta -= Math.PI * 2;
        } else {
            while (delta > 0) delta -= Math.PI * 2;
            while (delta <= -Math.PI * 2) delta += Math.PI * 2;
        }

        const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;


        const d =
            `M ${start.x} ${start.y} ` +
            `A ${shape.rx} ${shape.ry} ${rotationDegrees} ` +
            `${largeArc} ${sweep} ${end.x} ${end.y}`;

        shape.element.setAttribute("d", d);
        shape.hitPath.setAttribute("d", d);

        shape.element.setAttribute("stroke", shape.color);
        shape.element.setAttribute("stroke-width", shape.strokeWidth);

        if (selectedShape === shape) {
            updateEllipseArcHandles(shape);

            if (
                dragging?.shape === shape &&
                dragging.type === "ellipse-arc-handle"
            ) {
                shape.helperGuides.forEach(guide => {
                    guide.style.display = "block";
                });
            }
        }

        bringShapeGuidesToFront(shape);
        updateSVGSource();
        syncSymmetryGroup(shape);
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

            // Refresh Bézier control handles during dragging.
            if (
                selectedShape === shape &&
                !shape.hidden &&
                !shape.locked
            ) {
                updatePathHandles(shape);
            }

            updateSVGSource();
            syncSymmetryGroup(shape); syncSymmetryGroup(shape);

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
        syncSymmetryGroup(shape);
    }

    function createBezierCurve(x, y) {
        const startX = Math.max(0, x - 3);
        const startY = Math.min(artboardSize, y + 1.5);

        const control1X = Math.max(0, x - 1.5);
        const control1Y = Math.max(0, y - 2.5);

        const control2X = Math.min(artboardSize, x + 1.5);
        const control2Y = Math.max(0, y - 2.5);

        const endX = Math.min(artboardSize, x + 3);
        const endY = Math.min(artboardSize, y + 1.5);

        const d =
            `M ${startX} ${startY} ` +
            `C ${control1X} ${control1Y} ` +
            `${control2X} ${control2Y} ` +
            `${endX} ${endY}`;

        const element = document.createElementNS(SVG_NS, "path");

        const segments = parseSVGPathSegments(d);

        const shape = {
            type: "path",
            name: "Bezier Curve",

            element,

            svgPathData: d,
            svgEditableSegments: segments,
            svgAnchors: buildSVGAnchorMap(segments),

            points: [],
            holes: [],
            curved: false,

            color: getNextColor("path"),
            fill: "none",
            strokeWidth: 2,

            offsetX: 0,
            offsetY: 0,

            hidden: false,
            locked: false,

            handles: []
        };

        workspace.appendChild(element);
        shapes.push(shape);

        updatePathShape(shape);
        selectShape(shape);

        applyLiveSymmetry(shape);

        updateSVGSource();

        return shape;
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
    function updateEllipseArcHandles(shape) {
        shape.handles?.forEach(handle => handle.remove());
        shape.handles = [];

        if (selectedShape !== shape && !isShapeConnected(shape)) return;

        function makeHandle(x, y, action, color) {
            const hit = document.createElementNS(SVG_NS, "circle");

            hit.setAttribute("cx", x);
            hit.setAttribute("cy", y);
            hit.setAttribute("r", "0.85");
            hit.setAttribute("fill", "transparent");
            hit.setAttribute("pointer-events", "all");
            hit.classList.add("ellipse-arc-handle-hit");
            hit.dataset.action = action;

            const visible = document.createElementNS(SVG_NS, "circle");

            visible.setAttribute("cx", x);
            visible.setAttribute("cy", y);
            visible.setAttribute("r", "0.32");
            visible.setAttribute("fill", color);
            visible.dataset.action = action;
            visible.setAttribute("stroke", "#FFFFFF");
            visible.setAttribute("stroke-width", "0.1");
            visible.setAttribute("pointer-events", "none");

            workspace.appendChild(visible);
            workspace.appendChild(hit);

            shape.handles.push(visible, hit);
        }

        const start = getEllipseArcPoint(shape, shape.startAngle);
        const end = getEllipseArcPoint(shape, shape.endAngle);

        const rxHandle = getEllipseArcPoint(shape, 0);
        const ryHandle = getEllipseArcPoint(shape, Math.PI / 2);

        makeHandle(start.x, start.y, "start", "#60A5FA");
        makeHandle(end.x, end.y, "end", "#60A5FA");

        makeHandle(rxHandle.x, rxHandle.y, "rx", "#10B981");
        makeHandle(ryHandle.x, ryHandle.y, "ry", "#10B981");
    }
    function createHandlesForShape(shape) {
        if (!shape || shape.hidden || shape.locked) return;

        if (shape.type === "line") {
            updateHandles(shape);
        } else if (shape.type === "curve") {
            updateCurveHandles(shape);
        } else if (shape.type === "ellipse-arc") {
            updateEllipseArcHandles(shape);
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


    function getSymmetryGroupMembers(shape) {
        if (!shape) return [];

        if (!shape.symmetryGroupId) {
            return [shape];
        }

        return shapes.filter(
            item => item.symmetryGroupId === shape.symmetryGroupId
        );
    }

    function expandSymmetrySelection(selection) {
        const result = new Set();

        selection.forEach(shape => {
            getSymmetryGroupMembers(shape).forEach(member => {
                result.add(member);
            });
        });

        return [...result];
    }

    function getSelectedShapesForDeletion() {
        const selection = selectedShapes.length
            ? selectedShapes
            : selectedShape
                ? [selectedShape]
                : [];

        return expandSymmetrySelection(selection);
    }



    function selectShape(shape, additive = false) {
        if (shape && selectedCustomAxisGroupId) {
            selectedCustomAxisGroupId = null;
            renderCustomMirrorAxes();
        }
        const oldPrimary = selectedShape;

        if (
            oldPrimary &&
            oldPrimary !== shape &&
            !isShapeConnected(oldPrimary)
        ) {
            oldPrimary.handles?.forEach(handle => handle.remove());
            oldPrimary.handles = [];
        }

        const group = getSymmetryGroupMembers(shape);

        if (!additive) {
            selectedShapes = group;
            selectedShape = shape;
        } else {
            const allSelected = group.length > 0 &&
                group.every(member => selectedShapes.includes(member));

            if (allSelected) {
                selectedShapes = selectedShapes.filter(
                    member => !group.includes(member)
                );

                if (group.includes(selectedShape)) {
                    selectedShape = selectedShapes.at(-1) || null;
                }
            } else {
                group.forEach(member => {
                    if (!selectedShapes.includes(member)) {
                        selectedShapes.push(member);
                    }
                });

                selectedShape = shape;
            }
        }

        shapes.forEach(item => {
            if (item.element) {
                item.element.classList.toggle(
                    "is-selected",
                    selectedShapes.includes(item)
                );
            }
        });

        if (selectedShape && !selectedShape.hidden && !selectedShape.locked) {
            createHandlesForShape(selectedShape);
        }

        updateMeasurementPanel();
        updatePropertiesPanel();
        renderLayers();
        bringHandlesToFront();
        refreshConnectionHandles();
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
        if (
            shape.type !== "curve" ||
            (selectedShape !== shape && !isShapeConnected(shape))
        ) return;

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

        const startAngle = shape.startAngle;
        const endAngle = shape.endAngle;

        let delta = endAngle - startAngle;

        while (delta < 0) delta += Math.PI * 2;
        while (delta >= Math.PI * 2) delta -= Math.PI * 2;

        const positions = {
            start: {
                x: shape.cx + shape.radius * Math.cos(startAngle),
                y: shape.cy + shape.radius * Math.sin(startAngle)
            },

            end: {
                x: shape.cx + shape.radius * Math.cos(endAngle),
                y: shape.cy + shape.radius * Math.sin(endAngle)
            },

            "rotate-b": {
                x: shape.cx + shape.radius * Math.cos(startAngle + delta * 0.25),
                y: shape.cy + shape.radius * Math.sin(startAngle + delta * 0.25)
            },

            "rotate-a": {
                x: shape.cx + shape.radius * Math.cos(startAngle + delta * 0.75),
                y: shape.cy + shape.radius * Math.sin(startAngle + delta * 0.75)
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
        if (selectedShape !== shape && !isShapeConnected(shape)) return;

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
            visible.dataset.action = action;
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
            // A move command starts a new subpath.
            if (segment.type === "move") {
                output.push(`M ${n(segment.x)} ${n(segment.y)}`);
                return;
            }

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
                    output.push("Z");
                    break;
            }
        });

        return output.join(" ");
    }


    // Path Vertex Handles (Allows Direct Vertex Editing on Canvas)

    function updatePathHandles(shape) {
        shape.handles?.forEach(h => h.remove());
        shape.handles = [];

        if (
            shape.type !== "path" ||
            (selectedShape !== shape && !isShapeConnected(shape))
        ) return;

        // Imported SVG path: render one handle per unique anchor.
        if (Array.isArray(shape.svgEditableSegments)) {
            shape.svgAnchors ||= buildSVGAnchorMap(shape.svgEditableSegments);


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
                visible.dataset.anchorId = anchor.id;
                visible.setAttribute("stroke", "#FFFFFF");
                visible.setAttribute("stroke-width", "0.08");
                visible.setAttribute("pointer-events", "none");

                workspace.appendChild(visible);
                workspace.appendChild(hit);

                shape.handles.push(visible, hit);
            });


            // Draw Bézier control-point handles.
            shape.svgEditableSegments.forEach(segment => {
                const controls = [];

                if (
                    segment.type === "cubic" ||
                    segment.type === "smooth-cubic"
                ) {
                    controls.push(
                        { x: "cx1", y: "cy1", anchorX: "x1", anchorY: "y1" },
                        { x: "cx2", y: "cy2", anchorX: "x", anchorY: "y" }
                    );
                } else if (
                    segment.type === "quadratic" ||
                    segment.type === "smooth-quadratic"
                ) {
                    controls.push(
                        { x: "cx", y: "cy", anchorX: "x1", anchorY: "y1" }
                    );
                }

                controls.forEach(control => {
                    const cx = segment[control.x] + (shape.offsetX || 0);
                    const cy = segment[control.y] + (shape.offsetY || 0);

                    const ax = segment[control.anchorX] + (shape.offsetX || 0);
                    const ay = segment[control.anchorY] + (shape.offsetY || 0);

                    const guide = document.createElementNS(SVG_NS, "line");
                    guide.setAttribute("x1", ax);
                    guide.setAttribute("y1", ay);
                    guide.setAttribute("x2", cx);
                    guide.setAttribute("y2", cy);
                    guide.setAttribute("stroke", "#64748B");
                    guide.setAttribute("stroke-width", "0.08");
                    guide.setAttribute("pointer-events", "none");

                    const visible = document.createElementNS(SVG_NS, "circle");
                    visible.setAttribute("cx", cx);
                    visible.setAttribute("cy", cy);
                    visible.setAttribute("r", "0.22");
                    visible.setAttribute("fill", "#FBBF24");
                    visible.setAttribute("stroke", "#FFFFFF");
                    visible.setAttribute("stroke-width", "0.07");
                    visible.setAttribute("pointer-events", "none");

                    const hit = document.createElementNS(SVG_NS, "circle");
                    hit.setAttribute("cx", cx);
                    hit.setAttribute("cy", cy);
                    hit.setAttribute("r", "0.75");
                    hit.setAttribute("fill", "transparent");
                    hit.setAttribute("pointer-events", "all");
                    hit.classList.add("svg-control-hit-area");

                    hit.dataset.segmentId = segment.id;
                    hit.dataset.controlX = control.x;
                    hit.dataset.controlY = control.y;

                    workspace.appendChild(guide);
                    workspace.appendChild(visible);
                    workspace.appendChild(hit);

                    shape.handles.push(guide, visible, hit);
                });
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
            visible.dataset.vertexIndex = vertexIndex;
            visible.dataset.holeIndex = holeIndex;
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
        syncSymmetryGroup(shape);
    }


    function snapAngle(angle) {
        const step = Math.PI / 18; // 10 degrees; retained for ellipse arcs
        return Math.round(angle / step) * step;
    }

    function snapCurveHandleAngle(angle) {
        const step = Math.PI / 90; // 2 degrees
        return Math.round(angle / step) * step;
    }

    function bringShapeGuidesToFront(shape) {
        if (!shape) return;

        let guides = [];

        if (shape.type === "curve") {
            guides = [
                shape.circumferenceGuide,
                shape.horizontalGuide,
                shape.verticalGuide,
                shape.angleGuide,
                shape.startRadialGuide,
                shape.endRadialGuide
            ];
        } else if (
            shape.type === "circle" ||
            shape.type === "ellipse" ||
            shape.type === "rectangle"
        ) {
            guides = [
                shape.horizontalGuide,
                shape.verticalGuide
            ];
        } else if (shape.type === "ellipse-arc") {
            guides = shape.helperGuides || [];
        }

        guides.forEach(guide => {
            if (guide) workspace.appendChild(guide);
        });
    }
    function updateCurve(shape) {
        const startAngle = shape.startAngle;
        const endAngle = shape.endAngle;

        const startX = shape.cx + shape.radius * Math.cos(startAngle);
        const startY = shape.cy + shape.radius * Math.sin(startAngle);

        const endX = shape.cx + shape.radius * Math.cos(endAngle);
        const endY = shape.cy + shape.radius * Math.sin(endAngle);

        const sweep = shape.sweepFlag ?? 1;

        let delta = endAngle - startAngle;

        if (sweep === 1) {
            while (delta < 0) delta += Math.PI * 2;
            while (delta >= Math.PI * 2) delta -= Math.PI * 2;
        } else {
            while (delta > 0) delta -= Math.PI * 2;
            while (delta <= -Math.PI * 2) delta += Math.PI * 2;
        }

        const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;

        const curvePath =
            `M ${startX} ${startY} A ${shape.radius} ${shape.radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`;

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
                ? startAngle
                : endAngle;

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
        const radiusAngle = (startAngle + endAngle) / 2;

        const radiusEndX = shape.cx + shape.radius * Math.cos(radiusAngle);
        const radiusEndY = shape.cy + shape.radius * Math.sin(radiusAngle);


        if (selectedShape === shape) {
            moveCurveHandles(shape);
        }

        bringShapeGuidesToFront(shape);
        updateSVGSource();
        syncSymmetryGroup(shape);
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
        bringShapeGuidesToFront(shape);
        updateSVGSource();
        syncSymmetryGroup(shape);
    }

    // ========================================================================
    // 12. SNAPPING & ALIGNMENT GUIDES
    // ========================================================================
    function getShapeEndpoints(shape) {
        if (!shape || shape.hidden || shape.locked) return [];

        const handles = [];

        function add(x, y, end) {
            if (Number.isFinite(x) && Number.isFinite(y)) {
                handles.push({ x, y, shape, end });
            }
        }

        // LINE
        if (shape.type === "line") {
            add(shape.x1, shape.y1, "start");
            add(shape.x2, shape.y2, "end");
        }

        // CIRCULAR CURVE
        else if (shape.type === "curve") {
            const delta = ((shape.endAngle - shape.startAngle) + Math.PI * 2)
                % (Math.PI * 2);

            add(
                shape.cx + shape.radius * Math.cos(shape.startAngle),
                shape.cy + shape.radius * Math.sin(shape.startAngle),
                "start"
            );

            add(
                shape.cx + shape.radius * Math.cos(shape.endAngle),
                shape.cy + shape.radius * Math.sin(shape.endAngle),
                "end"
            );

            // Rotation handles
            add(
                shape.cx + shape.radius * Math.cos(shape.startAngle + delta * 0.75),
                shape.cy + shape.radius * Math.sin(shape.startAngle + delta * 0.75),
                "rotate-a"
            );

            add(
                shape.cx + shape.radius * Math.cos(shape.startAngle + delta * 0.25),
                shape.cy + shape.radius * Math.sin(shape.startAngle + delta * 0.25),
                "rotate-b"
            );

            // Radius handle
            add(shape.cx, shape.cy, "radius");
        }

        // CIRCLE
        else if (shape.type === "circle") {
            add(shape.cx + shape.radius, shape.cy, "radius");
        }

        // ELLIPSE
        else if (shape.type === "ellipse") {
            add(shape.cx + shape.rx, shape.cy, "rx");
            add(shape.cx, shape.cy + shape.ry, "ry");
        }

        // ELLIPSE ARC
        else if (shape.type === "ellipse-arc") {
            add(
                shape.cx + shape.rx * Math.cos(shape.startAngle),
                shape.cy + shape.ry * Math.sin(shape.startAngle),
                "start"
            );

            add(
                shape.cx + shape.rx * Math.cos(shape.endAngle),
                shape.cy + shape.ry * Math.sin(shape.endAngle),
                "end"
            );

            add(shape.cx, shape.cy - shape.ry, "rx");
            add(shape.cx, shape.cy + shape.ry, "ry");
        }

        // RECTANGLE
        else if (shape.type === "rectangle") {
            const x = shape.x;
            const y = shape.y;
            const w = shape.width;
            const h = shape.height;

            add(x, y, "nw");
            add(x + w / 2, y, "n");
            add(x + w, y, "ne");

            add(x + (shape.cornerRadius || 0), y, "corner-radius");

            add(x + w, y + h / 2, "e");
            add(x + w, y + h, "se");
            add(x + w / 2, y + h, "s");
            add(x, y + h, "sw");
            add(x, y + h / 2, "w");
        }

        // NORMAL PATH + IMPORTED SVG PATH
        else if (shape.type === "path") {
            // Normal editable path vertices
            (shape.points || []).forEach((point, index) => {
                add(point.x, point.y, `v_${index}`);
            });

            // Hole vertices
            (shape.holes || []).forEach((hole, holeIndex) => {
                const points = Array.isArray(hole) ? hole : hole.points;

                (points || []).forEach((point, pointIndex) => {
                    add(point.x, point.y, `h_${holeIndex}_${pointIndex}`);
                });
            });

            // Imported SVG editable anchors
            (shape.svgAnchors || []).forEach(anchor => {
                add(anchor.x, anchor.y, `svg_${anchor.id}`);
            });
        }

        return handles;
    }

    // =====================================
    // SNAP TARGET HANDLE COLOUR
    // =====================================

    let activeSnapTargetVisual = null;

    // =====================================
    // PERSISTENT HANDLE CONNECTIONS
    // =====================================

    function ensureShapeId(shape) {
        if (!shape.id) {
            shape.id = crypto.randomUUID();
        }

        return shape.id;
    }

    function isShapeConnected(shape) {
        if (!shape?.id) return false;

        return connections.some(connection =>
            connection.a.shapeId === shape.id ||
            connection.b.shapeId === shape.id
        );
    }

    function isHandleConnected(ref) {
        return connections.some(connection =>
            (
                connection.a.shapeId === ref.shapeId &&
                connection.a.handle === ref.handle
            ) ||
            (
                connection.b.shapeId === ref.shapeId &&
                connection.b.handle === ref.handle
            )
        );
    }

    function removeConnectionForHandle(ref) {
        const previousLength = connections.length;

        connections = connections.filter(connection =>
            !(
                connection.a.shapeId === ref.shapeId &&
                connection.a.handle === ref.handle
            ) &&
            !(
                connection.b.shapeId === ref.shapeId &&
                connection.b.handle === ref.handle
            )
        );

        if (connections.length !== previousLength) {
            refreshConnectionHandles();
        }
    }

    function prepareHandleDrag(shape, handle) {
        const ref = {
            shapeId: ensureShapeId(shape),
            handle
        };

        // Moving a connected handle starts by disconnecting it.
        // It can connect to another handle when released.
        removeConnectionForHandle(ref);

        if (dragging) {
            dragging.sourceHandle = ref;
        }
    }

    function addHandleConnection(refA, refB) {
        if (!refA || !refB) return;

        // A handle cannot connect to itself.
        if (
            refA.shapeId === refB.shapeId &&
            refA.handle === refB.handle
        ) {
            return;
        }

        // One-to-one rule:
        // Remove any previous connection belonging to either handle.
        removeConnectionForHandle(refA);
        removeConnectionForHandle(refB);

        connections.push({
            a: { ...refA },
            b: { ...refB }
        });

        refreshConnectionHandles();
    }

    function refreshConnectionHandles() {
        // Keep actual SVG handles available for connected shapes,
        // even when those shapes are no longer selected.
        shapes.forEach(shape => {
            if (!isShapeConnected(shape)) {
                if (shape !== selectedShape) {
                    shape.handles?.forEach(handle => handle.remove());
                    shape.handles = [];
                }

                return;
            }

            if (!shape.hidden && !shape.locked && !shape.handles?.length) {
                createHandlesForShape(shape);
            }
        });

        // Restore each visible handle's original colour first.
        shapes.forEach(shape => {
            shape.handles?.forEach(handle => {
                if (
                    handle.tagName?.toLowerCase() === "circle" &&
                    handle.hasAttribute("stroke") &&
                    handle.dataset.originalFill !== undefined
                ) {
                    handle.setAttribute("fill", handle.dataset.originalFill);
                }
            });
        });

        // Then colour both ends of every connection red.
        connections.forEach(connection => {
            const pairs = [connection.a, connection.b];

            pairs.forEach(ref => {
                const shape = shapes.find(item => item.id === ref.shapeId);
                if (!shape || shape.hidden || shape.locked) return;

                const visibleHandle = findVisibleSnapHandle({
                    shape,
                    end: ref.handle
                });

                if (!visibleHandle) return;

                if (visibleHandle.dataset.originalFill === undefined) {
                    visibleHandle.dataset.originalFill =
                        visibleHandle.getAttribute("fill") || "#10131a";
                }

                visibleHandle.setAttribute("fill", "#EF4444");
            });
        });

        bringHandlesToFront();
    }// =====================================
    // PERSISTENT HANDLE CONNECTIONS
    // =====================================

    function ensureShapeId(shape) {
        if (!shape.id) {
            shape.id = crypto.randomUUID();
        }

        return shape.id;
    }

    function isShapeConnected(shape) {
        if (!shape?.id) return false;

        return connections.some(connection =>
            connection.a.shapeId === shape.id ||
            connection.b.shapeId === shape.id
        );
    }

    function isHandleConnected(ref) {
        return connections.some(connection =>
            (
                connection.a.shapeId === ref.shapeId &&
                connection.a.handle === ref.handle
            ) ||
            (
                connection.b.shapeId === ref.shapeId &&
                connection.b.handle === ref.handle
            )
        );
    }

    function removeConnectionForHandle(ref) {
        const previousLength = connections.length;

        connections = connections.filter(connection =>
            !(
                connection.a.shapeId === ref.shapeId &&
                connection.a.handle === ref.handle
            ) &&
            !(
                connection.b.shapeId === ref.shapeId &&
                connection.b.handle === ref.handle
            )
        );

        if (connections.length !== previousLength) {
            refreshConnectionHandles();
        }
    }

    function prepareHandleDrag(shape, handle) {
        const ref = {
            shapeId: ensureShapeId(shape),
            handle
        };

        // Moving a connected handle starts by disconnecting it.
        // It can connect to another handle when released.
        removeConnectionForHandle(ref);

        if (dragging) {
            dragging.sourceHandle = ref;
        }
    }

    function addHandleConnection(refA, refB) {
        if (!refA || !refB) return;

        // A handle cannot connect to itself.
        if (
            refA.shapeId === refB.shapeId &&
            refA.handle === refB.handle
        ) {
            return;
        }

        // One-to-one rule:
        // Remove any previous connection belonging to either handle.
        removeConnectionForHandle(refA);
        removeConnectionForHandle(refB);

        connections.push({
            a: { ...refA },
            b: { ...refB }
        });

        refreshConnectionHandles();
    }

    function refreshConnectionHandles() {
        // Keep actual SVG handles available for connected shapes,
        // even when those shapes are no longer selected.
        shapes.forEach(shape => {
            if (!isShapeConnected(shape)) {
                if (shape !== selectedShape) {
                    shape.handles?.forEach(handle => handle.remove());
                    shape.handles = [];
                }

                return;
            }

            if (!shape.hidden && !shape.locked && !shape.handles?.length) {
                createHandlesForShape(shape);
            }
        });

        // Restore each visible handle's original colour first.
        shapes.forEach(shape => {
            shape.handles?.forEach(handle => {
                if (
                    handle.tagName?.toLowerCase() === "circle" &&
                    handle.hasAttribute("stroke") &&
                    handle.dataset.originalFill !== undefined
                ) {
                    handle.setAttribute("fill", handle.dataset.originalFill);
                }
            });
        });

        // Then colour both ends of every connection red.
        connections.forEach(connection => {
            const pairs = [connection.a, connection.b];

            pairs.forEach(ref => {
                const shape = shapes.find(item => item.id === ref.shapeId);
                if (!shape || shape.hidden || shape.locked) return;

                const visibleHandle = findVisibleSnapHandle({
                    shape,
                    end: ref.handle
                });

                if (!visibleHandle) return;

                if (visibleHandle.dataset.originalFill === undefined) {
                    visibleHandle.dataset.originalFill =
                        visibleHandle.getAttribute("fill") || "#10131a";
                }

                visibleHandle.setAttribute("fill", "#EF4444");
            });
        });

        bringHandlesToFront();
    }
    function findVisibleSnapHandle(target) {
        const { shape, end } = target;

        return shape.handles?.find(handle => {
            if (
                handle.tagName?.toLowerCase() !== "circle" ||
                !handle.hasAttribute("stroke")
            ) {
                return false;
            }

            if (
                handle.dataset.end === end ||
                handle.dataset.action === end
            ) {
                return true;
            }

            if (end.startsWith("v_")) {
                return handle.dataset.vertexIndex === end.slice(2) &&
                    handle.dataset.holeIndex === "-1";
            }

            if (end.startsWith("h_")) {
                const [, holeIndex, vertexIndex] = end.split("_");

                return handle.dataset.vertexIndex === vertexIndex &&
                    handle.dataset.holeIndex === holeIndex;
            }

            if (end.startsWith("svg_")) {
                return handle.dataset.anchorId === end.slice(4);
            }

            return false;
        });
    }

    function showSnapTarget(target) {
        if (
            activeSnapTargetVisual?.shape === target.shape &&
            activeSnapTargetVisual?.end === target.end
        ) {
            return;
        }

        hideSnapTarget();

        const visibleHandle = findVisibleSnapHandle(target);

        if (visibleHandle) {
            const originalFill = visibleHandle.getAttribute("fill");

            visibleHandle.setAttribute("fill", "#EF4444");

            activeSnapTargetVisual = {
                shape: target.shape,
                end: target.end,
                element: visibleHandle,
                originalFill,
                isTemporary: false
            };

            return;
        }

        // Render the target's actual handle when its shape is unselected.
        const handle = document.createElementNS(SVG_NS, "circle");

        let radius = 0.32;

        if (target.shape.type === "path") {
            radius = 0.26;
        }

        if (
            target.shape.type === "path" &&
            target.end.startsWith("svg_")
        ) {
            radius = 0.28;
        }

        if (
            target.shape.type === "curve" &&
            target.end === "radius"
        ) {
            radius = 0.36;
        }

        handle.setAttribute("cx", target.x);
        handle.setAttribute("cy", target.y);
        handle.setAttribute("r", radius);
        handle.setAttribute("fill", "#EF4444");
        handle.setAttribute("stroke", "#FFFFFF");
        handle.setAttribute("stroke-width", "0.1");
        handle.setAttribute("pointer-events", "none");

        workspace.appendChild(handle);

        activeSnapTargetVisual = {
            shape: target.shape,
            end: target.end,
            element: handle,
            isTemporary: true
        };
    }

    function hideSnapTarget() {
        if (!activeSnapTargetVisual) return;

        const visual = activeSnapTargetVisual;

        if (visual.isTemporary) {
            visual.element.remove();
        } else {
            visual.element.setAttribute(
                "fill",
                visual.originalFill
            );
        }

        activeSnapTargetVisual = null;
    }

    function getSnappedPoint(x, y, currentShape, shiftKey = false) {
        if (!snapEnabled || shiftKey) {
            hideSnapTarget();
            if (endpointSnapIndicator) endpointSnapIndicator.style.display = "none";
            return { x, y };
        }

        const snapDistance = 0.35;
        const releaseDistance = 0.45;

        if (dragging?.snappedTo) {
            const target = getShapeEndpoints(dragging.snappedTo.shape).find(pt => pt.end === dragging.snappedTo.end);
            if (target && Math.hypot(x - target.x, y - target.y) <= releaseDistance) {
                showSnapTarget(target);
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
            if (
                shape === currentShape ||
                (currentShape.symmetryGroupId && shape.symmetryGroupId === currentShape.symmetryGroupId) ||
                shape.hidden || shape.locked
            ) continue;
            for (const pt of getShapeEndpoints(shape)) {
                const dist = Math.hypot(x - pt.x, y - pt.y);
                if (dist <= closestDist) {
                    closestDist = dist;
                    closest = pt;
                }
            }
        }

        if (closest) {
            showSnapTarget(closest);
            dragging.snappedTo = { shape: closest.shape, end: closest.end };
            if (endpointSnapIndicator) {
                endpointSnapIndicator.setAttribute("cx", closest.x);
                endpointSnapIndicator.setAttribute("cy", closest.y);
                endpointSnapIndicator.style.display = "block";
            }
            return { x: closest.x, y: closest.y };
        }

        hideSnapTarget();

        if (endpointSnapIndicator) {
            endpointSnapIndicator.style.display = "none";
        }

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
        if (shape.type === "ellipse-arc") {
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
            const { cx, cy, radius, startAngle, endAngle } = shape;

            let delta = endAngle - startAngle;

            while (delta < 0) delta += Math.PI * 2;
            while (delta >= Math.PI * 2) delta -= Math.PI * 2;

            const angles = [startAngle, endAngle];

            // Check whether an angle lies along the visible arc.
            const isOnArc = angle => {
                let difference = angle - startAngle;

                while (difference < 0) difference += Math.PI * 2;
                while (difference >= Math.PI * 2) difference -= Math.PI * 2;

                return difference <= delta;
            };

            // Include the four possible extreme points.
            [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(angle => {
                if (isOnArc(angle)) {
                    angles.push(angle);
                }
            });

            const points = angles.map(angle => ({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            }));

            const xs = points.map(point => point.x);
            const ys = points.map(point => point.y);

            return {
                left: Math.min(...xs),
                right: Math.max(...xs),
                top: Math.min(...ys),
                bottom: Math.max(...ys)
            };
        }
        if (shape.type === "path") {

            // Imported SVG paths, including Bézier curves.
            if (
                typeof shape.svgPathData === "string" &&
                shape.element?.getBBox
            ) {
                try {
                    const bounds = shape.element.getBBox();

                    const offsetX = shape.offsetX || 0;
                    const offsetY = shape.offsetY || 0;

                    return {
                        left: bounds.x + offsetX,
                        right: bounds.x + bounds.width + offsetX,
                        top: bounds.y + offsetY,
                        bottom: bounds.y + bounds.height + offsetY
                    };
                } catch (error) {
                    // Fall through to regular path bounds.
                }
            }

            // Regular paths.
            if (shape.points?.length) {
                const xs = shape.points.map(p => p.x);
                const ys = shape.points.map(p => p.y);

                return {
                    left: Math.min(...xs),
                    right: Math.max(...xs),
                    top: Math.min(...ys),
                    bottom: Math.max(...ys)
                };
            }
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

    function getCustomAxisGroupMembers(groupId) {
        return customMirrorAxes.filter(axis => (axis.groupId || axis.id) === groupId);
    }

    function selectCustomAxis(axis) {
        selectedCustomAxisGroupId = axis.groupId || axis.id;
        selectedShape = null;
        selectedShapes = [];
        shapes.forEach(shape => shape.element?.classList.remove("is-selected"));
        renderCustomMirrorAxes();
    }

    // Gently magnetise custom axes to the canvas' horizontal/vertical grid directions.
    // The axis remains freely rotatable outside this small angular capture range.
    function snapCustomAxisAngle(angle) {
        const quarterTurn = Math.PI / 2;
        const nearest = Math.round(angle / quarterTurn) * quarterTurn;
        const difference = Math.atan2(Math.sin(angle - nearest), Math.cos(angle - nearest));
        const snapRange = 5 * Math.PI / 180;
        return Math.abs(difference) <= snapRange ? nearest : angle;
    }

    function updateUniformAxisGroup(groupId, center, angle, halfLength) {
        const members = getCustomAxisGroupMembers(groupId);
        const count = members.length;
        members.forEach((axis, index) => {
            const a = angle + index * Math.PI / count;
            const dx = Math.cos(a) * halfLength, dy = Math.sin(a) * halfLength;
            axis.x1 = center.x - dx; axis.y1 = center.y - dy;
            axis.x2 = center.x + dx; axis.y2 = center.y + dy;
        });
    }

    function copyCustomAxisGroup() {
        if (!selectedCustomAxisGroupId) return false;
        copiedCustomAxes = getCustomAxisGroupMembers(selectedCustomAxisGroupId).map(axis => structuredClone(axis));
        if (!copiedCustomAxes.length) return false;
        showToast(`Copied ${copiedCustomAxes.length} custom axis(es)`, "info");
        return true;
    }

    function pasteCustomAxisGroup() {
        if (!copiedCustomAxes.length) return false;
        beginHistoryAction();
        const groupId = `axis-group-${crypto.randomUUID()}`;
        customMirrorAxes.push(...copiedCustomAxes.map(axis => ({
            ...structuredClone(axis), id: `axis-${crypto.randomUUID()}`, groupId,
            x1: axis.x1 + COPY_OFFSET, y1: axis.y1 + COPY_OFFSET,
            x2: axis.x2 + COPY_OFFSET, y2: axis.y2 + COPY_OFFSET
        })));
        selectedCustomAxisGroupId = groupId;
        renderCustomMirrorAxes();
        commitHistoryAction();
        showToast("Pasted custom axis group", "success");
        return true;
    }

    function duplicateCustomAxisGroup() {
        if (!copyCustomAxisGroup()) return;
        pasteCustomAxisGroup();
    }

    function deleteSelectedCustomAxisGroup() {
        if (!selectedCustomAxisGroupId) return false;
        const previousLength = customMirrorAxes.length;
        beginHistoryAction();
        customMirrorAxes = customMirrorAxes.filter(axis =>
            (axis.groupId || axis.id) !== selectedCustomAxisGroupId
        );
        selectedCustomAxisGroupId = null;
        renderCustomMirrorAxes();
        commitHistoryAction();
        if (customMirrorAxes.length !== previousLength) showToast("Deleted custom axis", "success");
        return customMirrorAxes.length !== previousLength;
    }

    function translateCustomAxisGroup(groupId, dx, dy, originals) {
        customMirrorAxes = customMirrorAxes.map(axis => {
            if ((axis.groupId || axis.id) !== groupId) return axis;
            const original = originals.find(item => item.id === axis.id);
            return { ...axis, x1: original.x1 + dx, y1: original.y1 + dy,
                x2: original.x2 + dx, y2: original.y2 + dy };
        });
    }

    function renderCustomMirrorAxes() {
        if (!customMirrorAxesGroup) return;
        customMirrorAxesGroup.innerHTML = "";
        customMirrorAxes.forEach(axis => {
            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", axis.x1); line.setAttribute("y1", axis.y1);
            line.setAttribute("x2", axis.x2); line.setAttribute("y2", axis.y2);
            line.setAttribute("stroke", (axis.groupId || axis.id) === selectedCustomAxisGroupId ? "#F97316" : "#EC4899");
            line.setAttribute("stroke-width", (axis.groupId || axis.id) === selectedCustomAxisGroupId ? "0.48" : "0.35");
            line.setAttribute("stroke-dasharray", "0.8 0.5");
            line.setAttribute("opacity", "0.95");
            line.setAttribute("pointer-events", "stroke");
            line.classList.add("custom-axis-line");
            line.dataset.axisId = axis.id;
            customMirrorAxesGroup.appendChild(line);
        });

        if (!selectedCustomAxisGroupId) return;
        const members = getCustomAxisGroupMembers(selectedCustomAxisGroupId);
        const handleAxes = members.some(axis => axis.uniform) ? members.slice(0, 1) : members;
        handleAxes.forEach(axis => {
            const addHandle = (x, y, action) => {
                const hit = document.createElementNS(SVG_NS, "circle");
                hit.setAttribute("cx", x); hit.setAttribute("cy", y);
                hit.setAttribute("r", "0.95"); hit.setAttribute("fill", "transparent");
                hit.setAttribute("pointer-events", "all");
                hit.classList.add("custom-axis-handle");
                hit.dataset.axisId = axis.id; hit.dataset.axisAction = action;
                customMirrorAxesGroup.appendChild(hit);
                const visible = document.createElementNS(SVG_NS, "circle");
                visible.setAttribute("cx", x); visible.setAttribute("cy", y);
                visible.setAttribute("r", "0.32");
                visible.setAttribute("fill", action === "center" ? "#10B981" : "#F97316");
                visible.setAttribute("pointer-events", "none");
                customMirrorAxesGroup.appendChild(visible);
            };
            addHandle(axis.x1, axis.y1, "start");
            addHandle(axis.x2, axis.y2, "end");
            addHandle((axis.x1 + axis.x2) / 2, (axis.y1 + axis.y2) / 2, "center");
        });
    }

    // ========================================================================
    // 13. WORKSPACE MOUSE/POINTER DRAG & CANVAS INTERACTIONS
    // ========================================================================
    workspace.addEventListener("pointerdown", event => {
        // Close context menu on any click
        hideContextMenu();

        const pos = getSVGPosition(event);

        // Place a free axis with two endpoints, or a uniform fan using centre + direction.
        if (isPlacingMirrorAxis) {
            if (event.button !== 0) return;
            const point = { x: Math.round(pos.x * 2) / 2, y: Math.round(pos.y * 2) / 2 };
            if (!mirrorAxisPlacementPoints.length) {
                beginHistoryAction();
                mirrorAxisPlacementPoints.push(point);
                showToast(mirrorAxisModeSelect?.value === "uniform"
                    ? "Click the centre, then set the direction and visible length."
                    : "First endpoint placed. Click the second endpoint.", "info");
            } else {
                const start = mirrorAxisPlacementPoints[0];
                const dx = point.x - start.x, dy = point.y - start.y;
                const halfLength = Math.hypot(dx, dy);
                if (halfLength < 0.25) {
                    showToast("Choose a point farther from the first point.", "warning");
                    return;
                }
                const groupId = `axis-group-${crypto.randomUUID()}`;
                if (mirrorAxisModeSelect?.value === "uniform") {
                    const count = Math.max(2, Math.min(24, Math.round(Number(mirrorAxisCountInput?.value) || 3)));
                    const baseAngle = Math.atan2(dy, dx);
                    for (let index = 0; index < count; index++) {
                        const angle = baseAngle + index * Math.PI / count;
                        const vx = Math.cos(angle) * halfLength, vy = Math.sin(angle) * halfLength;
                        customMirrorAxes.push({ id: `axis-${crypto.randomUUID()}`, groupId, uniform: true,
                            x1: start.x - vx, y1: start.y - vy, x2: start.x + vx, y2: start.y + vy, active: true });
                    }
                    showToast(`Created ${count} equally spaced axes (${(180 / count).toFixed(2)}° apart)`, "success");
                } else {
                    customMirrorAxes.push({ id: `axis-${crypto.randomUUID()}`, groupId, uniform: false,
                        x1: start.x, y1: start.y, x2: point.x, y2: point.y, active: true });
                    showToast("Custom mirror axis set!", "success");
                }
                selectedCustomAxisGroupId = groupId;
                mirrorAxisPlacementPoints = [];
                isPlacingMirrorAxis = false;
                customMirrorToolBtn?.classList.remove("active");
                renderCustomMirrorAxes();
                commitHistoryAction();
            }
            return;
        }

        const axisHandle = event.target.closest?.(".custom-axis-handle");
        const axisLine = event.target.closest?.(".custom-axis-line");
        if (axisHandle || axisLine) {
            const target = axisHandle || axisLine;
            const axis = customMirrorAxes.find(item => item.id === target.dataset.axisId);
            if (!axis) return;
            selectCustomAxis(axis);
            if (axisHandle) {
                beginHistoryAction();
                workspace.setPointerCapture?.(event.pointerId);
                customAxisDrag = { groupId: axis.groupId || axis.id, axisId: axis.id,
                    action: axisHandle.dataset.axisAction, start: pos,
                    original: structuredClone(getCustomAxisGroupMembers(axis.groupId || axis.id)) };
                event.preventDefault();
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
        const ellipseArcHit = event.target.closest(".ellipse-arc-handle-hit");
        const hitArea = event.target.closest(".edit-hit-area");
        const basicHit = event.target.closest(".basic-hit-area");
        const vertexHit = event.target.closest(".path-vertex-hit-area");
        const svgAnchorHit = event.target.closest(".svg-anchor-hit-area");
        const svgControlHit = event.target.closest(".svg-control-hit-area");




        // Imported SVG control-point dragging
        if (svgControlHit) {
            const shape = shapes.find(s =>
                s.type === "path" && s.handles?.includes(svgControlHit)
            );

            if (!shape) return;

            selectShape(shape);

            const segment = shape.svgEditableSegments.find(
                item => item.id === svgControlHit.dataset.segmentId
            );

            if (!segment) return;

            dragging = {
                shape,
                type: "svg-control",
                segmentId: segment.id,
                controlX: svgControlHit.dataset.controlX,
                controlY: svgControlHit.dataset.controlY,
                startX: pos.x,
                startY: pos.y,
                originalSegments: cloneSVGSegments(shape.svgEditableSegments)
            };

            return;
        }

        // Imported SVG anchor dragging with endpoint snapping
        if (svgAnchorHit) {
            const shape = shapes.find(s =>
                s.type === "path" && s.handles?.includes(svgAnchorHit)
            );

            if (!shape) return;

            const anchorId = svgAnchorHit.dataset.anchorId;

            const anchor = shape.svgAnchors?.find(
                item => item.id === anchorId
            );

            if (!anchor) return;

            selectShape(shape);

            dragging = {
                shape,
                type: "svg-anchor",
                anchorId,

                startX: pos.x,
                startY: pos.y,

                anchorStartX: anchor.x,
                anchorStartY: anchor.y,

                originalSegments: cloneSVGSegments(
                    shape.svgEditableSegments
                )
            };

            // Register this endpoint with the snapping system.
            prepareHandleDrag(shape, `svg_${anchorId}`);

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

            prepareHandleDrag(
                shape,
                hIdx === -1
                    ? `v_${vIdx}`
                    : `h_${hIdx}_${vIdx}`
            );
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
            prepareHandleDrag(shape, basicHit.dataset.action);
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
            prepareHandleDrag(shape, action);
            // Show all curve helper guides
            shape.circumferenceGuide.style.display = "block";
            shape.horizontalGuide.style.display = "block";
            shape.verticalGuide.style.display = "block";
            shape.startRadialGuide.style.display = "block";
            shape.endRadialGuide.style.display = "block";
            shape.angleGuide.style.display = "block";

            return;
        }

        // Ellipse Arc Handle
        if (ellipseArcHit) {
            const shape = shapes.find(s =>
                s.type === "ellipse-arc" &&
                s.handles?.includes(ellipseArcHit)
            );

            if (!shape) return;

            const action = ellipseArcHit.dataset.action;

            selectShape(shape);

            dragging = {
                shape,
                type: "ellipse-arc-handle",
                action,
                snappedTo: null
            };

            prepareHandleDrag(shape, action);

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
            prepareHandleDrag(shape, hitArea.dataset.end);
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
            if (item.type === "ellipse-arc") {
                return item.hitPath === event.target || item.element === event.target;
            }
            return false;
        });

        if (clickedShape) {

            // Preserve the existing multi-selection when dragging
            // a shape that is already selected.
            if (
                !selectedShapes.includes(clickedShape) ||
                event.shiftKey
            ) {
                selectShape(clickedShape, event.shiftKey);
            }

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
        if (customAxisDrag) {
            const dx = position.x - customAxisDrag.start.x, dy = position.y - customAxisDrag.start.y;
            const primary = customAxisDrag.original.find(axis => axis.id === customAxisDrag.axisId) || customAxisDrag.original[0];
            if (primary) {
                if (primary.uniform && customAxisDrag.action !== "center") {
                    const center = { x: (primary.x1 + primary.x2) / 2, y: (primary.y1 + primary.y2) / 2 };
                    const target = customAxisDrag.action === "start"
                        ? { x: primary.x1 + dx, y: primary.y1 + dy }
                        : { x: primary.x2 + dx, y: primary.y2 + dy };
                    const targetAngle = snapCustomAxisAngle(
                        Math.atan2(target.y - center.y, target.x - center.x)
                    );
                    updateUniformAxisGroup(customAxisDrag.groupId, center,
                        targetAngle,
                        Math.max(0.25, Math.hypot(target.x - center.x, target.y - center.y)));
                } else if (customAxisDrag.action === "center") {
                    // Centre handles magnetically snap to grid intersections (integer X/Y).
                    const originalCenter = {
                        x: (primary.x1 + primary.x2) / 2,
                        y: (primary.y1 + primary.y2) / 2
                    };
                    const snappedCenter = {
                        x: Math.round(originalCenter.x + dx),
                        y: Math.round(originalCenter.y + dy)
                    };
                    translateCustomAxisGroup(
                        customAxisDrag.groupId,
                        snappedCenter.x - originalCenter.x,
                        snappedCenter.y - originalCenter.y,
                        customAxisDrag.original
                    );
                } else {
                    const axis = customMirrorAxes.find(item => item.id === customAxisDrag.axisId);
                    if (axis && customAxisDrag.action === "start") {
                        const fixed = { x: primary.x2, y: primary.y2 };
                        const moving = { x: primary.x1 + dx, y: primary.y1 + dy };
                        const length = Math.hypot(moving.x - fixed.x, moving.y - fixed.y);
                        const angle = snapCustomAxisAngle(Math.atan2(moving.y - fixed.y, moving.x - fixed.x));
                        axis.x1 = fixed.x + Math.cos(angle) * length;
                        axis.y1 = fixed.y + Math.sin(angle) * length;
                    } else if (axis) {
                        const fixed = { x: primary.x1, y: primary.y1 };
                        const moving = { x: primary.x2 + dx, y: primary.y2 + dy };
                        const length = Math.hypot(moving.x - fixed.x, moving.y - fixed.y);
                        const angle = snapCustomAxisAngle(Math.atan2(moving.y - fixed.y, moving.x - fixed.x));
                        axis.x2 = fixed.x + Math.cos(angle) * length;
                        axis.y2 = fixed.y + Math.sin(angle) * length;
                    }
                }
                renderCustomMirrorAxes();
            }
            return;
        }

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


        // Move an SVG anchor with endpoint snapping.
        if (dragging.type === "svg-anchor") {

            const snapped = getSnappedPoint(
                dragging.anchorStartX +
                (position.x - dragging.startX),
                dragging.anchorStartY +
                (position.y - dragging.startY),
                shape,
                event.shiftKey
            );

            const dx = snapped.x - dragging.anchorStartX;
            const dy = snapped.y - dragging.anchorStartY;

            shape.svgEditableSegments = cloneSVGSegments(
                dragging.originalSegments
            );

            moveSVGAnchor(
                shape,
                dragging.anchorId,
                dx,
                dy
            );

            shape.svgAnchors = buildSVGAnchorMap(
                shape.svgEditableSegments
            );

            shape.svgPathData = serializeSVGSegments(
                shape.svgEditableSegments
            );

            updatePathShape(shape);
            return;
        }

        // Move an individual Bézier control point.
        if (dragging.type === "svg-control") {
            const dx = position.x - dragging.startX;
            const dy = position.y - dragging.startY;

            shape.svgEditableSegments = cloneSVGSegments(
                dragging.originalSegments
            );

            const segment = shape.svgEditableSegments.find(
                item => item.id === dragging.segmentId
            );

            if (!segment) return;

            segment[dragging.controlX] += dx;
            segment[dragging.controlY] += dy;

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
                const snapped = getSnappedPoint(
                    position.x,
                    position.y,
                    shape,
                    event.shiftKey
                );

                targetPoint.x = Math.round(snapped.x * 10) / 10;
                targetPoint.y = Math.round(snapped.y * 10) / 10;

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
            // Yellow rotation handles use the raw pointer position for continuous rotation.
            const snappedPosition = (
                action === "rotate-a" || action === "rotate-b"
            ) ? position : getSnappedPoint(
                position.x,
                position.y,
                shape,
                event.shiftKey
            );

            // BLUE A: Change start angle
            if (action === "start") {

                const angle = Math.atan2(
                    snappedPosition.y - shape.cy,
                    snappedPosition.x - shape.cx
                );

                shape.startAngle = snapCurveHandleAngle(angle);
            }


            // BLUE B: Change end angle
            else if (action === "end") {

                const angle = Math.atan2(
                    position.y - shape.cy,
                    position.x - shape.cx
                );

                shape.endAngle = snapCurveHandleAngle(angle);
            }


            // YELLOW: Rotate around fixed endpoint
            else if (
                action === "rotate-a" ||
                action === "rotate-b"
            ) {

                const currentAngle = Math.atan2(
                    snappedPosition.y - dragging.pivot.y,
                    snappedPosition.x - dragging.pivot.x
                );

                let rotation =
                    currentAngle - dragging.initialCursorAngle;

                // Normalize rotation
                rotation = Math.atan2(
                    Math.sin(rotation),
                    Math.cos(rotation)
                );

                // Rotation remains continuous; do not quantise it to 10-degree steps.
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

                const movement = dragging.startY - snappedPosition.y;
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

        // Ellipse Arc Handle Movement
        if (dragging.type === "ellipse-arc-handle") {
            const action = dragging.action;

            const snappedPosition = getSnappedPoint(
                position.x,
                position.y,
                shape,
                event.shiftKey
            );

            const rotation = shape.rotation || 0;

            const dx = snappedPosition.x - shape.cx;
            const dy = snappedPosition.y - shape.cy;

            // Convert pointer position into ellipse-local coordinates
            const localX =
                dx * Math.cos(rotation) +
                dy * Math.sin(rotation);

            const localY =
                -dx * Math.sin(rotation) +
                dy * Math.cos(rotation);

            if (action === "start" || action === "end") {
                const angle = Math.atan2(
                    localY / shape.ry,
                    localX / shape.rx
                );

                if (action === "start") {
                    shape.startAngle = snapAngle(angle);
                } else {
                    shape.endAngle = snapAngle(angle);
                }

            } else if (action === "rx") {
                shape.rx = Math.max(0.2, Math.abs(localX));

            } else if (action === "ry") {
                shape.ry = Math.max(0.2, Math.abs(localY));
            }

            updateEllipseArc(shape);
            return;
        }
        // Basic Shape Handle Resize (Circle / Rect)
        if (dragging.type === "basic-handle") {
            const snappedPosition = getSnappedPoint(
                position.x,
                position.y,
                shape,
                event.shiftKey
            );
            if (shape.type === "circle") {
                const dist = Math.hypot(
                    snappedPosition.x - shape.cx,
                    snappedPosition.y - shape.cy
                );

                shape.radius = Math.max(0.2, Math.min(artboardSize, dist));
                updateBasicShape(shape);

            } else if (shape.type === "ellipse") {
                if (dragging.action === "rx") {
                    shape.rx = Math.max(
                        0.2,
                        Math.abs(snappedPosition.x - shape.cx)
                    );

                } else if (dragging.action === "ry") {
                    shape.ry = Math.max(
                        0.2,
                        Math.abs(snappedPosition.y - shape.cy)
                    );
                }

                updateBasicShape(shape);

                updateBasicShape(shape);
            } else if (shape.type === "rectangle") {
                const dx = snappedPosition.x - dragging.startX;
                const dy = snappedPosition.y - dragging.startY;
                const action = dragging.action;
                if (dragging.action === "corner-radius") {
                    shape.cornerRadius = Math.max(
                        0,
                        Math.min(
                            Math.min(shape.width, shape.height) / 2,
                            snappedPosition.x - shape.x
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

            let dx = position.x - dragging.previousX;
            let dy = position.y - dragging.previousY;

            dragging.previousX = position.x;
            dragging.previousY = position.y;


            // Move each symmetry group through only one representative.
            // syncSymmetryGroup() will update the other members.
            const selectedTargets = selectedShapes.length
                ? selectedShapes
                : [shape];

            const targets = [];
            const seenSymmetryGroups = new Set();

            selectedTargets.forEach(item => {
                if (item.symmetryGroupId) {
                    if (seenSymmetryGroups.has(item.symmetryGroupId)) {
                        return;
                    }

                    seenSymmetryGroups.add(item.symmetryGroupId);

                    // Prefer the shape actually being dragged.
                    const representative =
                        shape.symmetryGroupId === item.symmetryGroupId
                            ? shape
                            : item;

                    targets.push(representative);
                } else {
                    targets.push(item);
                }
            });

            const movingShapes = new Set(
                selectedTargets
            );


            let closestSource = null;
            let closestTarget = null;
            let closestDist = Infinity;

            // Shift or Snap OFF temporarily disables snapping.
            if (snapEnabled && !event.shiftKey) {
                // Keep the previous snap briefly while the pointer moves away.
                if (dragging.sourceHandle && dragging.snappedTo) {
                    const sourceShape = shapes.find(
                        item => item.id === dragging.sourceHandle.shapeId
                    );

                    const source = getShapeEndpoints(sourceShape).find(
                        item => item.end === dragging.sourceHandle.handle
                    );

                    const target = getShapeEndpoints(dragging.snappedTo.shape).find(
                        item => item.end === dragging.snappedTo.end
                    );

                    if (source && target) {
                        const distance = Math.hypot(
                            position.x - dragging.snapPointerX,
                            position.y - dragging.snapPointerY
                        );

                        if (distance <= 0.8) {
                            closestSource = source;
                            closestTarget = target;
                        } else {
                            dragging.releasedSnap = {
                                sourceShapeId: dragging.sourceHandle.shapeId,
                                sourceHandle: dragging.sourceHandle.handle,
                                targetShapeId: ensureShapeId(dragging.snappedTo.shape),
                                targetHandle: dragging.snappedTo.end
                            };

                            dragging.sourceHandle = null;
                            dragging.snappedTo = null;
                        }
                    }
                }

                // Find the nearest pair of handles.
                if (!closestTarget) {
                    let bestDistance = 0.55;

                    for (const movingShape of targets) {
                        for (const source of getShapeEndpoints(movingShape)) {
                            for (const stationaryShape of shapes) {
                                if (
                                    movingShapes.has(stationaryShape) ||
                                    (movingShape.symmetryGroupId &&
                                        stationaryShape.symmetryGroupId === movingShape.symmetryGroupId)
                                ) continue;

                                for (const target of getShapeEndpoints(stationaryShape)) {

                                    // Prevent immediately reconnecting to the handle just released.
                                    if (
                                        dragging.releasedSnap &&
                                        ensureShapeId(source.shape) === dragging.releasedSnap.sourceShapeId &&
                                        source.end === dragging.releasedSnap.sourceHandle &&
                                        ensureShapeId(target.shape) === dragging.releasedSnap.targetShapeId &&
                                        target.end === dragging.releasedSnap.targetHandle
                                    ) {
                                        const separation = Math.hypot(
                                            source.x + dx - target.x,
                                            source.y + dy - target.y
                                        );

                                        if (separation <= 0.9) continue;

                                        dragging.releasedSnap = null;
                                    }

                                    const distance = Math.hypot(
                                        source.x + dx - target.x,
                                        source.y + dy - target.y
                                    );

                                    if (distance < bestDistance) {
                                        bestDistance = distance;
                                        closestSource = source;
                                        closestTarget = target;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (closestSource && closestTarget) {
                // Correct the movement so both handles meet exactly.
                dx += closestTarget.x - (closestSource.x + dx);
                dy += closestTarget.y - (closestSource.y + dy);

                dragging.sourceHandle = {
                    shapeId: ensureShapeId(closestSource.shape),
                    handle: closestSource.end
                };

                if (!dragging.snappedTo) {
                    dragging.snapPointerX = position.x;
                    dragging.snapPointerY = position.y;
                }
                dragging.snappedTo = {
                    shape: closestTarget.shape,
                    end: closestTarget.end
                };

                showSnapTarget(closestTarget);

                if (endpointSnapIndicator) {
                    endpointSnapIndicator.setAttribute("cx", closestTarget.x);
                    endpointSnapIndicator.setAttribute("cy", closestTarget.y);
                    endpointSnapIndicator.style.display = "block";
                }
            } else {
                dragging.snapPointerX = null;
                dragging.snapPointerY = null;
                hideSnapTarget();

                if (endpointSnapIndicator) {
                    endpointSnapIndicator.style.display = "none";
                }
            }

            // Keep lines inside the artboard without changing their length or direction.
            let minAllowedDX = -Infinity;
            let maxAllowedDX = Infinity;
            let minAllowedDY = -Infinity;
            let maxAllowedDY = Infinity;

            targets.forEach(item => {
                if (item.type !== "line") return;

                const minX = Math.min(item.x1, item.x2);
                const maxX = Math.max(item.x1, item.x2);
                const minY = Math.min(item.y1, item.y2);
                const maxY = Math.max(item.y1, item.y2);

                minAllowedDX = Math.max(minAllowedDX, -minX);
                maxAllowedDX = Math.min(maxAllowedDX, artboardSize - maxX);
                minAllowedDY = Math.max(minAllowedDY, -minY);
                maxAllowedDY = Math.min(maxAllowedDY, artboardSize - maxY);
            });

            const originalDX = dx;
            const originalDY = dy;

            dx = Math.max(minAllowedDX, Math.min(maxAllowedDX, dx));
            dy = Math.max(minAllowedDY, Math.min(maxAllowedDY, dy));

            // If the boundary prevented a snap, don't save a false connection.
            if (dx !== originalDX || dy !== originalDY) {
                dragging.sourceHandle = null;
                dragging.snappedTo = null;
                dragging.snapPointerX = null;
                dragging.snapPointerY = null;
                hideSnapTarget();
            }

            targets.forEach(item => {
                if (item.type === "line") {
                    item.x1 += dx;
                    item.y1 += dy;
                    item.x2 += dx;
                    item.y2 += dy;
                    updateLine(item);
                } else if (item.type === "curve") {
                    item.cx = Math.max(0, Math.min(artboardSize, item.cx + dx));
                    item.cy = Math.max(0, Math.min(artboardSize, item.cy + dy));
                    updateCurve(item);
                } else if (item.type === "ellipse-arc") {
                    item.cx = Math.max(0, Math.min(artboardSize, item.cx + dx));
                    item.cy = Math.max(0, Math.min(artboardSize, item.cy + dy));
                    updateEllipseArc(item);
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
        if (customAxisDrag) {
            if (workspace.hasPointerCapture?.(event?.pointerId)) workspace.releasePointerCapture(event.pointerId);
            customAxisDrag = null;
            renderCustomMirrorAxes();
            commitHistoryAction();
            return;
        }
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

        if (!dragging) {
            hideSnapTarget();
            return;
        }

        // Keep a reference before clearing the active drag.
        const completedDrag = dragging;

        // Remove the temporary snap preview.
        hideSnapTarget();

        // If the dragged handle was released on another handle,
        // create a persistent connection between the two.
        if (completedDrag.sourceHandle && completedDrag.snappedTo) {
            const targetRef = {
                shapeId: ensureShapeId(completedDrag.snappedTo.shape),
                handle: completedDrag.snappedTo.end
            };

            addHandleConnection(
                completedDrag.sourceHandle,
                targetRef
            );
        }

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

        refreshConnectionHandles();

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
            const shape = shapes[idx];

            if (shape) {
                const targets = getSymmetryGroupMembers(shape);

                beginHistoryAction();

                targets.forEach(member => removeShape(member));

                shapes = shapes.filter(
                    member => !targets.includes(member)
                );

                selectShape(null);
                renderLayers();
                updateSVGSource();
                commitHistoryAction();

                showToast("Deleted shape group", "info");
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
                    <input type="color" data-style="stroke-color" value="${shape.color || "#ffffff"}">
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
            html += createMeasurementInput("Length", len, "length");
        } else if (shape.type === "curve") {
            html += createMeasurementInput("Center X", shape.cx, "cx");
            html += createMeasurementInput("Center Y", shape.cy, "cy");
            html += createMeasurementInput("Radius", shape.radius, "radius");
            html += createMeasurementInput("Start (°)", shape.startAngle * (180 / Math.PI), "startDeg");
            html += createMeasurementInput("End (°)", shape.endAngle * (180 / Math.PI), "endDeg");
        } else if (shape.type === "ellipse-arc") {
            html += createMeasurementInput("Center X", shape.cx, "cx");
            html += createMeasurementInput("Center Y", shape.cy, "cy");
            html += createMeasurementInput("Radius X", shape.rx, "rx");
            html += createMeasurementInput("Radius Y", shape.ry, "ry");

            html += createMeasurementInput(
                "Start (°)",
                shape.startAngle * (180 / Math.PI),
                "startDeg"
            );

            html += createMeasurementInput(
                "End (°)",
                shape.endAngle * (180 / Math.PI),
                "endDeg"
            );
        } else if (shape.type === "circle") {
            html += createMeasurementInput("Center X", shape.cx, "cx");
            html += createMeasurementInput("Center Y", shape.cy, "cy");
            html += createMeasurementInput("Radius", shape.radius, "radius");
            html += createMeasurementInput("Diameter", shape.radius * 2, "diameter");
        } else if (shape.type === "ellipse") {
            html += createMeasurementInput("Center X", shape.cx, "cx");
            html += createMeasurementInput("Center Y", shape.cy, "cy");
            html += createMeasurementInput("Radius X", shape.rx, "rx");
            html += createMeasurementInput("Radius Y", shape.ry, "ry");
            html += createMeasurementInput("Width", shape.rx * 2, "ellipse-width");
            html += createMeasurementInput("Height", shape.ry * 2, "ellipse-height");
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

    measurementFields?.addEventListener("input", event => {
        const input = event.target;
        const key = input.dataset.measurement;
        const val = Number(input.value);
        if (input.value.trim() === "") return;

        if (!key || !Number.isFinite(val) || !selectedShape ||
            selectedShape.locked || selectedShape.hidden) return;

        beginHistoryAction();
        const shape = selectedShape;

        if (shape.type === "line") {
            if (key === "x1") shape.x1 = val;
            if (key === "y1") shape.y1 = val;
            if (key === "x2") shape.x2 = val;
            if (key === "y2") shape.y2 = val;

            if (key === "length") {
                const dx = shape.x2 - shape.x1;
                const dy = shape.y2 - shape.y1;
                const oldLength = Math.hypot(dx, dy);
                const newLength = Math.max(0, val);

                const midX = (shape.x1 + shape.x2) / 2;
                const midY = (shape.y1 + shape.y2) / 2;

                if (oldLength > 0.0001) {
                    const scale = newLength / oldLength;

                    const halfDX = (dx * scale) / 2;
                    const halfDY = (dy * scale) / 2;

                    shape.x1 = midX - halfDX;
                    shape.y1 = midY - halfDY;
                    shape.x2 = midX + halfDX;
                    shape.y2 = midY + halfDY;
                } else {
                    // A zero-length line expands horizontally.
                    shape.x1 = midX - newLength / 2;
                    shape.x2 = midX + newLength / 2;
                }
            }

            updateLine(shape);
        } else if (shape.type === "curve") {
            if (key === "cx") shape.cx = val;
            if (key === "cy") shape.cy = val;
            if (key === "radius") shape.radius = Math.max(0.2, val);
            if (key === "startDeg") shape.startAngle = val * (Math.PI / 180);
            if (key === "endDeg") shape.endAngle = val * (Math.PI / 180);
            updateCurve(shape);
        } else if (shape.type === "ellipse-arc") {

            if (key === "cx") shape.cx = val;
            if (key === "cy") shape.cy = val;

            if (key === "rx") shape.rx = Math.max(0.2, val);
            if (key === "ry") shape.ry = Math.max(0.2, val);

            if (key === "startDeg") {
                shape.startAngle = val * (Math.PI / 180);
            }

            if (key === "endDeg") {
                shape.endAngle = val * (Math.PI / 180);
            }

            updateEllipseArc(shape);

        } else if (shape.type === "circle") {
            if (key === "cx") shape.cx = val;
            if (key === "cy") shape.cy = val;

            if (key === "radius") {
                shape.radius = Math.max(0.2, val);
            }

            if (key === "diameter") {
                shape.radius = Math.max(0.2, val / 2);
            }

            updateBasicShape(shape);

        } else if (shape.type === "ellipse") {
            if (key === "cx") shape.cx = val;
            if (key === "cy") shape.cy = val;

            if (key === "rx") shape.rx = Math.max(0.2, val);
            if (key === "ry") shape.ry = Math.max(0.2, val);

            if (key === "ellipse-width") {
                shape.rx = Math.max(0.2, val / 2);
            }

            if (key === "ellipse-height") {
                shape.ry = Math.max(0.2, val / 2);
            }

            updateBasicShape(shape);

        } else if (shape.type === "rectangle") {
            if (key === "x") shape.x = val;
            if (key === "y") shape.y = val;
            if (key === "width") shape.width = Math.max(0.2, val);
            if (key === "height") shape.height = Math.max(0.2, val);
            updateBasicShape(shape);
        }

    });

    measurementFields?.addEventListener("change", () => {
        commitHistoryAction();
        updateMeasurementPanel();
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
                    // Reflect the arc around its own vertical centre line (x = cx).
                    // Keep the circular centre and radius unchanged.
                    // Swap the reflected endpoints so the arc size and direction remain correct.
                    const oldStartAngle = shape.startAngle;
                    const oldEndAngle = shape.endAngle;

                    shape.startAngle = Math.PI - oldEndAngle;
                    shape.endAngle = Math.PI - oldStartAngle;

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
                    // Reflect the arc around its own horizontal centre line (y = cy).
                    // Keep the circular centre and radius unchanged.
                    // Swap the reflected endpoints so the arc size and direction remain correct.
                    const oldStartAngle = shape.startAngle;
                    const oldEndAngle = shape.endAngle;

                    shape.startAngle = -oldEndAngle;
                    shape.endAngle = -oldStartAngle;

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
            showToast("No custom mirror axis set.", "warning");
            return;
        }

        const axis = customMirrorAxes[customMirrorAxes.length - 1];

        const targets = selectedShapes.length
            ? selectedShapes
            : (selectedShape ? [selectedShape] : []);

        if (!targets.length) return;

        beginHistoryAction();

        targets.forEach(shape => {
            const data = getShapeData(shape);

            reflectShapeData(data, axis);

            Object.assign(shape, data);

            updateSymmetryMember(shape);
        });

        if (selectedShape) {
            createHandlesForShape(selectedShape);
        }

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

    function createShapeFromCopy(data, preserveId = false) {
        let shape;

        // Rebuilding or duplicating an existing shape must not create a new
        // live-symmetry group. Its symmetry members are already in the data.
        const wasCreatingShapeCopy = isCreatingShapeCopy;
        isCreatingShapeCopy = true;

        try {
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
            } else if (data.type === "ellipse-arc") {
                createEllipseArc(data.cx, data.cy);
                shape = shapes[shapes.length - 1];
                Object.assign(shape, data);
                updateEllipseArc(shape);
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

            if (shape) {
                shape.id = preserveId && data.id
                    ? data.id
                    : crypto.randomUUID();
            }
        } finally {
            isCreatingShapeCopy = wasCreatingShapeCopy;
        }

        return shape;
    }

    mirrorAxisModeSelect?.addEventListener("change", () => {
        if (mirrorAxisCountInput) mirrorAxisCountInput.disabled = mirrorAxisModeSelect.value !== "uniform";
    });
    if (mirrorAxisCountInput) mirrorAxisCountInput.disabled = mirrorAxisModeSelect?.value !== "uniform";

    transformToolbar?.addEventListener("click", event => {
        const btn = event.target.closest(".tool-action-btn");
        if (!btn) return;
        const action = btn.dataset.action;

        if (action.startsWith("align-")) alignSelectedShapes(action);
        else if (action === "flip-h") flipSelectedShapes("h");
        else if (action === "flip-v") flipSelectedShapes("v");
        else if (action === "custom-mirror-axis") {
            isPlacingMirrorAxis = !isPlacingMirrorAxis;
            mirrorAxisPlacementPoints = [];

            btn.classList.toggle("active", isPlacingMirrorAxis);

            if (isPlacingMirrorAxis) {
                showToast(mirrorAxisModeSelect?.value === "uniform"
                    ? "Click a centre point, then a direction/length point."
                    : "Click two endpoints to place a custom mirror axis", "info");
            } else {
                if (historyBeforeAction) commitHistoryAction();
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
    clearCustomAxisBtn?.addEventListener("click", () => {
        customMirrorAxes = [];
        mirrorAxisPlacementPoints = [];
        isPlacingMirrorAxis = false;

        customMirrorToolBtn?.classList.remove("active");

        renderCustomMirrorAxes();

        showToast("Custom mirror axis removed", "success");
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
        const targets = getSelectedShapesForDeletion();

        if (!targets.length) return;

        beginHistoryAction();

        targets.forEach(shape => removeShape(shape));

        shapes = shapes.filter(shape => !targets.includes(shape));

        selectShape(null);
        renderLayers();
        updateSVGSource();
        commitHistoryAction();

        showToast("Deleted shape group(s)", "info");
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


    function generateSVGFromShapes(
        sourceShapes,
        colorMode = "original",
        overrideColor = null
    ) {
        const artwork = [];

        sourceShapes.forEach(shape => {
            if (shape.hidden) return;

            let strokeColor = shape.color;

            if (colorMode === "white") {
                strokeColor = "#FFFFFF";
            } else if (colorMode === "black") {
                strokeColor = "#000000";
            } else if (colorMode === "accent") {
                strokeColor = document.body.getAttribute("data-accent") || "#ff0077";
            }

            // Apply gallery preview color only when requested
            if (overrideColor) {
                strokeColor = overrideColor;
            }

            // Keep filled shapes consistent with the export color
            let fillColor = shape.fill || "none";

            if (fillColor !== "none" && (colorMode !== "original" || overrideColor)) {
                fillColor = strokeColor;
            }

            if (shape.type === "line") {

                artwork.push(
                    `    <line x1="${formatSVGNumber(shape.x1)}" y1="${formatSVGNumber(shape.y1)}" x2="${formatSVGNumber(shape.x2)}" y2="${formatSVGNumber(shape.y2)}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.width)}" stroke-linecap="${shape.cap || "round"}"/>`
                );

            } else if (shape.type === "curve") {

                const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
                const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);
                const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
                const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);

                const sweep = shape.sweepFlag ?? 1;

                let delta = shape.endAngle - shape.startAngle;

                if (sweep === 1) {
                    while (delta < 0) delta += Math.PI * 2;
                    while (delta >= Math.PI * 2) delta -= Math.PI * 2;
                } else {
                    while (delta > 0) delta -= Math.PI * 2;
                    while (delta <= -Math.PI * 2) delta += Math.PI * 2;
                }

                const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;

                const pathD = `M ${formatSVGNumber(startX)} ${formatSVGNumber(startY)} A ${formatSVGNumber(shape.radius)} ${formatSVGNumber(shape.radius)} 0 ${largeArc} ${sweep} ${formatSVGNumber(endX)} ${formatSVGNumber(endY)}`;

                artwork.push(
                    `    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round"/>`
                );

            } else if (shape.type === "ellipse-arc") {

                const start = getEllipseArcPoint(shape, shape.startAngle);
                const end = getEllipseArcPoint(shape, shape.endAngle);

                let delta = shape.endAngle - shape.startAngle;

                while (delta < 0) delta += Math.PI * 2;
                while (delta >= Math.PI * 2) delta -= Math.PI * 2;

                const largeArc = delta > Math.PI ? 1 : 0;

                const rotationDegrees =
                    (shape.rotation || 0) * 180 / Math.PI;

                const sweep = shape.sweepFlag ?? 1;

                const pathD =
                    `M ${formatSVGNumber(start.x)} ${formatSVGNumber(start.y)} ` +
                    `A ${formatSVGNumber(shape.rx)} ${formatSVGNumber(shape.ry)} ` +
                    `${formatSVGNumber(rotationDegrees)} ${largeArc} ${sweep} ` +
                    `${formatSVGNumber(end.x)} ${formatSVGNumber(end.y)}`;

                artwork.push(
                    `    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round"/>`
                );

            } else if (shape.type === "path") {

                // Imported SVG path: preserve its original Bézier geometry
                if (typeof shape.svgPathData === "string") {

                    const transform =
                        shape.offsetX || shape.offsetY
                            ? ` transform="translate(${formatSVGNumber(shape.offsetX || 0)} ${formatSVGNumber(shape.offsetY || 0)})"`
                            : "";

                    artwork.push(
                        `    <path d="${shape.svgPathData}"${transform} fill="${fillColor}" fill-rule="evenodd" stroke="${strokeColor || "none"}" stroke-width="${formatSVGNumber(shape.strokeWidth || 2)}" stroke-linecap="round" stroke-linejoin="round"/>`
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
                                `    <path d="${compoundPathData}" fill="${fillColor}" fill-rule="evenodd" stroke="none"/>`
                            );
                        }

                        if (shape.strokeWidth && strokeColor && strokeColor !== "none") {
                            artwork.push(
                                `    <path d="${compoundPathData}" fill="none" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`
                            );
                        }

                    } else {

                        artwork.push(
                            `    <path d="${outerPathData}" fill="${fillColor}" fill-rule="evenodd" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}" stroke-linecap="round" stroke-linejoin="round"/>`
                        );

                    }
                }

            } else if (shape.type === "circle") {

                artwork.push(
                    `    <circle cx="${formatSVGNumber(shape.cx)}" cy="${formatSVGNumber(shape.cy)}" r="${formatSVGNumber(shape.radius)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`
                );

            } else if (shape.type === "ellipse") {

                artwork.push(
                    `    <ellipse cx="${formatSVGNumber(shape.cx)}" cy="${formatSVGNumber(shape.cy)}" rx="${formatSVGNumber(shape.rx)}" ry="${formatSVGNumber(shape.ry)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`
                );

            } else if (shape.type === "rectangle") {

                artwork.push(
                    `    <rect x="${formatSVGNumber(shape.x)}" y="${formatSVGNumber(shape.y)}" width="${formatSVGNumber(shape.width)}" height="${formatSVGNumber(shape.height)}" rx="${formatSVGNumber(shape.cornerRadius || 0)}" ry="${formatSVGNumber(shape.cornerRadius || 0)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${formatSVGNumber(shape.strokeWidth)}"/>`
                );

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

        // Tokenize SVG commands and numbers.
        // Arc flags are read individually, even when written together as "01".
        const tokens = [];

        const numberRegex =
            /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/;

        const parameterCounts = {
            M: 2,
            L: 2,
            H: 1,
            V: 1,
            C: 6,
            S: 4,
            Q: 4,
            T: 2,
            A: 7
        };

        let position = 0;
        let activeCommand = null;
        let parameterIndex = 0;

        while (position < d.length) {
            const char = d[position];

            // Ignore SVG separators.
            if (/[\s,]/.test(char)) {
                position++;
                continue;
            }

            // Read an SVG command.
            if (/[a-zA-Z]/.test(char)) {
                activeCommand = char;
                parameterIndex = 0;

                tokens.push(char);
                position++;

                continue;
            }

            if (!activeCommand) {
                throw new Error("SVG path must begin with a command.");
            }

            const commandType = activeCommand.toUpperCase();

            // Arc flags are single characters.
            // This correctly separates adjacent flags such as "01".
            if (
                commandType === "A" &&
                (parameterIndex === 3 || parameterIndex === 4)
            ) {
                if (char !== "0" && char !== "1") {
                    throw new Error("Invalid SVG arc flag.");
                }

                tokens.push(char);
                position++;
            } else {
                const remaining = d.slice(position);
                const numberMatch = numberRegex.exec(remaining);

                if (!numberMatch) {
                    throw new Error(
                        `Invalid SVG path data near: "${remaining.slice(0, 10)}"`
                    );
                }

                tokens.push(numberMatch[0]);
                position += numberMatch[0].length;
            }

            parameterIndex++;

            const parameterCount = parameterCounts[commandType];

            if (parameterCount && parameterIndex >= parameterCount) {
                parameterIndex = 0;

                // Additional coordinate pairs after M become L.
                if (commandType === "M") {
                    activeCommand =
                        activeCommand === "m" ? "l" : "L";
                }
            }

            // Close-path commands do not accept parameters.
            if (commandType === "Z") {
                activeCommand = null;
                parameterIndex = 0;
            }
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

    function getInheritedSVGAttribute(element, attribute, fallback) {
        let current = element;

        while (current && current.nodeType === 1) {
            if (current.hasAttribute(attribute)) {
                return current.getAttribute(attribute);
            }

            current = current.parentElement;
        }

        return fallback;
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
            let stroke = getInheritedSVGAttribute(el, "stroke", "#FFFFFF");
            let fill = getInheritedSVGAttribute(el, "fill", "none");

            const strokeWidth = Math.max(
                0.1,
                Math.min(
                    5,
                    Number(getInheritedSVGAttribute(el, "stroke-width", "2")) || 2
                )
            );

            // Resolve currentColor to a visible editor color.
            if (stroke === "currentColor") {
                stroke = getInheritedSVGAttribute(el, "color", "#FFFFFF");

                if (stroke === "currentColor") stroke = "#FFFFFF";
            }

            if (fill === "currentColor") {
                fill = getInheritedSVGAttribute(el, "color", "#FFFFFF");

                if (fill === "currentColor") fill = "#FFFFFF";
            }

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
                    const segments = parseSVGPathSegments(d);


                    // Recognize paths made entirely from connected arc segments.
                    const arcSegments = segments.filter(segment => segment.type === "arc");

                    const isArcGroup =
                        arcSegments.length >= 2 &&
                        segments.every(segment => {
                            if (segment.type === "move") return true;

                            if (segment.type === "arc") {
                                return segment.rotation === 0;
                            }

                            // Allow Z only when it closes at the existing endpoint.
                            if (segment.type === "close") {
                                const dx = segment.x - segment.x1;
                                const dy = segment.y - segment.y1;

                                return Math.hypot(dx, dy) < 0.0001;
                            }

                            return false;
                        });



                    const lineSegments = segments.filter(segment => segment.type === "line");

                    const isLineGroup =
                        fill === "none" &&
                        lineSegments.length >= 1 &&
                        segments.every(segment =>
                            segment.type === "move" || segment.type === "line"
                        );
                    // Recognize paths containing both straight lines and circular arcs.
                    // Recognize paths containing combinations of lines,
                    // circular/elliptical arcs, and Bézier curves.
                    const isMixedEditablePath =
                        fill === "none" &&
                        segments.some(segment => segment.type === "arc") &&
                        segments.some(segment =>
                            segment.type === "line" ||
                            segment.type === "cubic" ||
                            segment.type === "smooth-cubic" ||
                            segment.type === "quadratic" ||
                            segment.type === "smooth-quadratic"
                        ) &&
                        segments.every(segment =>
                            segment.type === "move" ||
                            segment.type === "line" ||
                            segment.type === "arc" ||
                            segment.type === "close" ||
                            segment.type === "cubic" ||
                            segment.type === "smooth-cubic" ||
                            segment.type === "quadratic" ||
                            segment.type === "smooth-quadratic"
                        );
                    fill === "none" &&
                        segments.some(segment => segment.type === "line") &&
                        segments.some(segment => segment.type === "arc") &&
                        segments.every(segment => {
                            if (
                                segment.type === "move" ||
                                segment.type === "line"
                            ) {
                                return true;
                            }

                            if (segment.type === "arc") {
                                return segment.rotation === 0;
                            }

                            // A closing segment can also be represented as a line.
                            return segment.type === "close";
                        });

                    if (isLineGroup) {

                        lineSegments.forEach(segment => {
                            parsed.push({
                                type: "line",
                                x1: segment.x1,
                                y1: segment.y1,
                                x2: segment.x,
                                y2: segment.y,
                                color: stroke,
                                width: strokeWidth,
                                strokeWidth
                            });
                        });

                    } else if (isMixedEditablePath) {

                        parsed.push({
                            type: "importedMixedPath",
                            segments: segments.filter(segment =>
                                segment.type === "line" ||
                                segment.type === "arc" ||
                                segment.type === "close" ||
                                segment.type === "cubic" ||
                                segment.type === "smooth-cubic" ||
                                segment.type === "quadratic" ||
                                segment.type === "smooth-quadratic"
                            ),
                            color: stroke,
                            strokeWidth
                        });

                    } else if (isArcGroup) {

                        parsed.push({
                            type: "importedArcGroup",
                            arcs: arcSegments,
                            originalPathData: d,
                            color: stroke,
                            fill,
                            strokeWidth
                        });

                    } else if (
                        segments.length === 2 &&
                        segments[0].type === "move" &&
                        segments[1].type === "arc" &&
                        segments[1].rotation === 0
                    ) {
                        const arc = segments[1];

                        if (Math.abs(arc.rx - arc.ry) < 0.0001) {
                            parsed.push({
                                type: "importedArc",
                                startX: arc.x1,
                                startY: arc.y1,
                                radius: arc.rx,
                                phi: arc.rotation,
                                largeArc: arc.largeArc,
                                sweep: arc.sweep,
                                endX: arc.x,
                                endY: arc.y,
                                color: stroke,
                                strokeWidth
                            });
                        } else {
                            parsed.push({
                                type: "importedEllipseArc",
                                startX: arc.x1,
                                startY: arc.y1,
                                rx: arc.rx,
                                ry: arc.ry,
                                phi: arc.rotation,
                                largeArc: arc.largeArc,
                                sweep: arc.sweep,
                                endX: arc.x,
                                endY: arc.y,
                                color: stroke,
                                strokeWidth
                            });
                        }
                    } else {
                        parsed.push({
                            type: "path",
                            svgPathData: d,
                            svgEditableSegments: segments,
                            svgAnchors: buildSVGAnchorMap(segments),
                            points: [],
                            holes: [],
                            curved: false,
                            color: stroke,
                            fill,
                            strokeWidth
                        });
                    }
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

            if (data.type === "importedMixedPath") {

                let firstImportedShape = null;

                data.segments.forEach(segment => {

                    if (
                        segment.type === "line" ||
                        segment.type === "close"
                    ) {
                        const distance = Math.hypot(
                            segment.x - segment.x1,
                            segment.y - segment.y1
                        );

                        if (distance < 0.0001) return;

                        createLine(segment.x1, segment.y1);

                        const shape = shapes[shapes.length - 1];

                        shape.x1 = segment.x1;
                        shape.y1 = segment.y1;
                        shape.x2 = segment.x;
                        shape.y2 = segment.y;

                        shape.color = data.color;
                        shape.width = data.strokeWidth;
                        shape.strokeWidth = data.strokeWidth;
                        shape.importedSVGSegment = true;

                        shape.element.setAttribute(
                            "stroke-width",
                            data.strokeWidth
                        );

                        updateLine(shape);

                        if (!firstImportedShape) {
                            firstImportedShape = shape;
                        }

                        ensureShapeId(shape);

                    } else if (segment.type === "arc") {

                        const arc = arcEndpointToCenter(
                            segment.x1,
                            segment.y1,
                            segment.rx,
                            segment.ry,
                            segment.rotation || 0,
                            segment.largeArc,
                            segment.sweep,
                            segment.x,
                            segment.y
                        );

                        const isCircular =
                            Math.abs(arc.rx - arc.ry) < 0.0001;

                        if (isCircular) {
                            createCurve(arc.cx, arc.cy);
                        } else {
                            createEllipseArc(arc.cx, arc.cy);
                        }

                        const shape = shapes[shapes.length - 1];
                        const reverse = Number(segment.sweep) === 0;

                        shape.color = data.color;
                        shape.strokeWidth = data.strokeWidth;
                        shape.importedSVGSegment = true;

                        shape.strokeWidth = data.strokeWidth;

                        if (isCircular) {
                            shape.radius = arc.rx;
                            shape.startAngle = reverse
                                ? arc.endAngle
                                : arc.startAngle;
                            shape.endAngle = reverse
                                ? arc.startAngle
                                : arc.endAngle;

                            updateCurve(shape);


                        } else {
                            shape.rx = arc.rx;
                            shape.ry = arc.ry;
                            shape.startAngle = reverse
                                ? arc.endAngle
                                : arc.startAngle;
                            shape.endAngle = reverse
                                ? arc.startAngle
                                : arc.endAngle;

                            updateEllipseArc(shape);
                        }

                        if (!firstImportedShape) {
                            firstImportedShape = shape;
                        }

                        ensureShapeId(shape);

                    } else if (
                        segment.type === "cubic" ||
                        segment.type === "smooth-cubic" ||
                        segment.type === "quadratic" ||
                        segment.type === "smooth-quadratic"
                    ) {

                        let bezierPathData =
                            `M ${segment.x1} ${segment.y1} `;

                        if (
                            segment.type === "cubic" ||
                            segment.type === "smooth-cubic"
                        ) {
                            bezierPathData +=
                                `C ${segment.cx1} ${segment.cy1} ` +
                                `${segment.cx2} ${segment.cy2} ` +
                                `${segment.x} ${segment.y}`;
                        } else {
                            bezierPathData +=
                                `Q ${segment.cx} ${segment.cy} ` +
                                `${segment.x} ${segment.y}`;
                        }

                        const independentSegments =
                            parseSVGPathSegments(bezierPathData);

                        const bezierShape = createShapeFromCopy({
                            type: "path",
                            name: "Bezier Curve",

                            svgPathData: bezierPathData,
                            svgEditableSegments: independentSegments,
                            svgAnchors: buildSVGAnchorMap(
                                independentSegments
                            ),

                            points: [],
                            holes: [],
                            curved: false,

                            color: data.color,
                            fill: "none",
                            strokeWidth: data.strokeWidth,

                            offsetX: 0,
                            offsetY: 0,

                            hidden: false,
                            locked: false
                        });

                        bezierShape.importedSVGSegment = true;

                        if (!firstImportedShape) {
                            firstImportedShape = bezierShape;
                        }

                        ensureShapeId(bezierShape);
                    }


                });

                if (firstImportedShape) {
                    selectShape(firstImportedShape);
                }


            } else if (data.type === "importedArcGroup") {

                // Preserve the original fill separately when the SVG has one.
                if (data.fill && data.fill !== "none") {
                    createShapeFromCopy({
                        type: "path",
                        name: "SVG Compound Fill",
                        svgPathData: data.originalPathData,
                        points: [],
                        holes: [],
                        color: "none",
                        fill: data.fill,
                        strokeWidth: 0.1,
                        hidden: false,
                        locked: true,
                        importedFillOnly: true
                    });

                    const fillShape = shapes[shapes.length - 1];
                    fillShape.element.style.pointerEvents = "none";
                }

                let firstImportedCurve = null;

                data.arcs.forEach(arcData => {
                    const arc = arcEndpointToCenter(
                        arcData.x1,
                        arcData.y1,
                        arcData.rx,
                        arcData.ry,
                        arcData.rotation || 0,
                        arcData.largeArc,
                        arcData.sweep,
                        arcData.x,
                        arcData.y
                    );

                    const isCircular =
                        Math.abs(arc.rx - arc.ry) < 0.0001;

                    if (isCircular) {
                        createCurve(arc.cx, arc.cy);
                    } else {
                        createEllipseArc(arc.cx, arc.cy);
                    }

                    const shape = shapes[shapes.length - 1];
                    const reverse = Number(arcData.sweep) === 0;

                    shape.color = data.color;
                    shape.strokeWidth = data.strokeWidth;
                    shape.importedSVGSegment = true;

                    if (isCircular) {
                        shape.radius = arc.rx;

                        shape.startAngle = reverse
                            ? arc.endAngle
                            : arc.startAngle;

                        shape.endAngle = reverse
                            ? arc.startAngle
                            : arc.endAngle;

                        updateCurve(shape);
                    } else {
                        shape.rx = arc.rx;
                        shape.ry = arc.ry;

                        shape.startAngle = reverse
                            ? arc.endAngle
                            : arc.startAngle;

                        shape.endAngle = reverse
                            ? arc.startAngle
                            : arc.endAngle;

                        updateEllipseArc(shape);
                    }

                    if (!firstImportedCurve) {
                        firstImportedCurve = shape;
                    }

                    ensureShapeId(shape);
                });

                if (firstImportedCurve) {
                    selectShape(firstImportedCurve);
                }

            } else if (data.type === "importedArc") {

                const arc = arcEndpointToCenter(
                    data.startX,
                    data.startY,
                    data.radius,
                    data.radius,
                    data.phi || 0,
                    data.largeArc,
                    data.sweep,
                    data.endX,
                    data.endY
                );

                createCurve(arc.cx, arc.cy);

                const shape = shapes[shapes.length - 1];
                const reverse = Number(data.sweep) === 0;

                shape.radius = arc.rx;
                shape.startAngle = reverse ? arc.endAngle : arc.startAngle;
                shape.endAngle = reverse ? arc.startAngle : arc.endAngle;
                shape.color = data.color;
                shape.strokeWidth = data.strokeWidth;

                updateCurve(shape);

            } else if (data.type === "importedEllipseArc") {

                const arc = arcEndpointToCenter(
                    data.startX,
                    data.startY,
                    data.rx,
                    data.ry,
                    data.phi || 0,
                    data.largeArc,
                    data.sweep,
                    data.endX,
                    data.endY
                );

                createEllipseArc(arc.cx, arc.cy);

                const shape = shapes[shapes.length - 1];
                const reverse = Number(data.sweep) === 0;

                shape.rx = arc.rx;
                shape.ry = arc.ry;
                shape.startAngle = reverse ? arc.endAngle : arc.startAngle;
                shape.endAngle = reverse ? arc.startAngle : arc.endAngle;
                shape.color = data.color;
                shape.strokeWidth = data.strokeWidth;

                updateEllipseArc(shape);

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
    let exportFromHome = false;

    topbarExportBtn?.addEventListener("click", () => {

        const activeProject = projectManager.projects.find(
            p => p.id === projectManager.activeProjectId
        );

        // Use the homepage preview project if its drawer is open.
        // Otherwise, use the editor's active project.
        exportFromHome = Boolean(selectedHomeProject);
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

        const galleryColor = globalIconColor?.value ||
            (document.body.classList.contains("light-theme") ? "#000000" : "#ffffff");

        const svgString = generateSVGFromShapes(
            activeProject.data.shapes,
            activeExportColor,
            exportFromHome && activeExportColor === "original"
                ? galleryColor
                : null
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
    // Curated, icon-specific vocabulary. Keep terms precise: broad name-based
    // guessing creates noisy results (for example, every arrow matching "back").
    const CURATED_ICON_SEARCH_TERMS = {
        settings: ["setting", "preferences", "configuration", "configure", "options", "controls", "customize", "customization", "adjustments", "tune", "gear", "cog", "setup"],
        "settings-2": ["setting", "preferences", "configuration", "options", "controls", "customize", "adjustments", "gear", "cog"],
        "settings-3": ["setting", "preferences", "configuration", "options", "controls", "customize", "adjustments", "gear", "cog"],
        cog: ["gear", "settings", "preferences", "configuration", "mechanism", "machinery"],
        "sliders-horizontal": ["filters", "filter", "adjustments", "tune", "controls", "preferences", "configuration", "settings", "equalizer"],
        "sliders-vertical": ["filters", "filter", "adjustments", "tune", "controls", "preferences", "configuration", "settings", "equalizer"],
        search: ["find", "lookup", "look up", "discover", "magnifier", "magnifying glass", "inspect", "query", "searching"],
        smile: ["smiley", "happy", "happiness", "grin", "smol"],
        "search-check": ["find", "lookup", "verified search", "search result", "inspect"],
        "search-x": ["clear search", "remove search", "cancel search", "no results"],
        home: ["house", "homepage", "home page", "main page", "start page", "dashboard", "residence"],
        house: ["home", "homepage", "residence", "dwelling", "property"],
        bell: ["notification", "alert", "reminder", "announcement", "updates", "ringer"],
        "bell-ring": ["notification", "alert", "reminder", "ringing bell", "announcement", "alarm"],
        "bell-dot": ["notification", "unread alert", "new update", "reminder", "badge"],
        trash: ["delete", "remove", "discard", "bin", "garbage", "waste", "recycle bin"],
        "trash-2": ["delete", "remove", "discard", "bin", "garbage", "waste", "recycle bin"],
        menu: ["navigation", "hamburger", "hamburger menu", "sidebar", "navigation menu", "options"],
        "menu-square": ["navigation", "hamburger menu", "sidebar", "options"],
        eye: ["view", "visibility", "visible", "preview", "show", "display", "watch"],
        "eye-off": ["hide", "hidden", "invisible", "conceal", "visibility off", "hide preview"],
        lock: ["locked", "secure", "security", "privacy", "protection", "restricted"],
        unlock: ["unlocked", "open lock", "access", "release", "not locked"],
        "lock-open": ["unlocked", "open lock", "access", "release", "not locked"],
        download: ["save", "export", "retrieve", "receive", "get file", "download file"],
        upload: ["import", "send", "transfer", "attach", "submit", "add file", "upload file"],
        share: ["sharing", "distribute", "forward", "send", "social", "share link"],
        "share-2": ["sharing", "distribute", "forward", "send", "social", "share link"],
        clock: ["time", "watch", "duration", "hour", "minute", "timepiece"],
        timer: ["countdown", "stopwatch", "duration", "time limit", "time tracking"],
        stopwatch: ["timer", "countdown", "elapsed time", "duration", "stop watch"],
        calendar: ["date", "schedule", "event", "planner", "appointment", "day", "month"],
        "calendar-days": ["date", "schedule", "events", "planner", "appointments", "month view"],
        "calendar-check": ["scheduled", "appointment", "event confirmed", "date complete"],
        user: ["person", "profile", "account", "avatar", "member", "individual", "contact"],
        "user-round": ["person", "profile", "account", "avatar", "member", "individual", "contact"],
        users: ["people", "group", "team", "members", "community", "multiple users"],
        "user-plus": ["add user", "new user", "invite", "create account", "add member"],
        "user-round-plus": ["add user", "new user", "invite", "create account", "add member"],
        "user-minus": ["remove user", "delete member", "remove account"],
        "user-check": ["verified user", "approved account", "confirmed member"],
        "badge-check": ["verified", "verification", "verified badge", "check badge", "approval", "approved", "certification", "certified", "authentic", "authenticity", "trusted", "trust", "official", "identity verified", "credential", "seal", "emblem", "insignia", "rosette", "award", "achievement", "recognition", "checkmark", "tick", "confirmed", "validated", "accepted", "correct", "valid", "completed", "success", "status", "blue check"],
        mail: ["email", "e-mail", "message", "envelope", "inbox", "correspondence"],
        "mail-open": ["open email", "read message", "opened envelope", "inbox"],
        "mail-check": ["email sent", "message delivered", "verified email"],
        send: ["submit", "dispatch", "deliver", "forward", "paper plane", "outgoing message"],
        "message-circle": ["chat", "conversation", "speech bubble", "talk", "messaging"],
        "message-square": ["chat", "conversation", "speech bubble", "comment", "messaging"],
        messages: ["chat", "conversation", "discussion", "multiple messages", "messaging"],
        phone: ["call", "telephone", "dial", "contact", "voice call"],
        "phone-call": ["calling", "telephone call", "ringing phone", "voice call"],
        camera: ["photo", "photography", "picture", "snapshot", "capture image"],
        image: ["photo", "picture", "photograph", "graphic", "visual", "media"],
        images: ["photos", "pictures", "gallery", "album", "photographs"],
        gallery: ["photos", "images", "pictures", "album", "media library"],
        file: ["document", "paper", "attachment", "file item"],
        "file-text": ["document", "text file", "notes", "paper", "written file"],
        folder: ["directory", "files", "documents", "file storage"],
        "folder-open": ["open directory", "browse files", "file browser", "documents"],
        copy: ["duplicate", "clone", "replicate", "copy item", "clipboard"],
        clipboard: ["copy", "paste", "notes", "board", "clipboard"],
        "clipboard-copy": ["copy", "duplicate", "clipboard", "copy to clipboard"],
        pencil: ["edit", "modify", "write", "draw", "annotate"],
        pen: ["write", "draw", "signature", "edit", "ink"],
        "pen-line": ["write", "edit", "annotate", "draw line"],
        edit: ["modify", "change", "update", "pencil", "revise"],
        "edit-2": ["modify", "change", "update", "pencil", "revise"],
        "plus": ["add", "create", "new", "insert", "increase"],
        minus: ["remove", "subtract", "decrease", "reduce", "less"],
        x: ["close", "cancel", "dismiss", "clear", "remove"],
        check: ["confirm", "done", "complete", "approve", "tick", "success"],
        "check-circle": ["success", "completed", "verified", "approved", "confirm"],
        "circle-check": ["success", "completed", "verified", "approved", "confirm"],
        "alert-circle": ["warning", "caution", "attention", "error", "important"],
        info: ["information", "details", "help", "about", "description"],
        "help-circle": ["help", "support", "question", "faq", "assistance"],
        filter: ["refine", "narrow results", "filtering", "funnel", "search filter"],
        "list-filter": ["filter", "refine", "narrow results", "sort list"],
        "arrow-up-down": ["sort", "reorder", "ascending descending", "swap order"],
        "refresh-cw": ["refresh", "reload", "sync", "update", "repeat"],
        "rotate-cw": ["rotate", "turn", "clockwise", "spin", "orientation"],
        undo: ["reverse action", "step back", "revert", "go back"],
        redo: ["redo", "repeat action", "restore action", "step forward"],
        "external-link": ["open in new tab", "open externally", "outbound link", "launch"],
        link: ["url", "hyperlink", "connect", "web address"],
        unlink: ["remove link", "disconnect", "unlink", "break connection"],
        star: ["favorite", "favourite", "rating", "bookmark", "featured"],
        heart: ["like", "love", "favorite", "favourite", "reaction"],
        bookmark: ["save", "saved item", "reading list", "favorite", "mark"],
        tag: ["label", "keyword", "category", "classification", "hashtag"],
        "map-pin": ["location", "place", "marker", "address", "destination", "gps"],
        map: ["navigation", "directions", "geography", "location", "street map"],
        globe: ["world", "earth", "internet", "web", "global", "planet"],
        wifi: ["wireless", "internet", "network", "connection", "signal"],
        bluetooth: ["wireless", "device pairing", "connectivity", "short range connection"],
        battery: ["power level", "charge", "energy", "battery status"],
        power: ["on off", "shutdown", "start", "stop", "power button"],
        sun: ["light", "day", "sunny", "brightness", "light mode"],
        moon: ["night", "dark mode", "dark theme", "lunar", "night mode"],
        "cloud-rain": ["rain", "rainy", "precipitation", "weather", "shower"],
        thermometer: ["temperature", "heat", "cold", "degrees", "weather"],
        play: ["start", "begin", "run", "play media", "resume"],
        pause: ["stop temporarily", "hold", "suspend", "pause media"],
        volume: ["sound", "audio", "loudness", "speaker level"],
        "volume-2": ["sound", "audio", "loud", "speaker", "volume control"],
        mic: ["microphone", "record voice", "audio input", "speech"],
        headphones: ["headset", "audio", "listen", "music", "earphones"],
        music: ["song", "audio", "soundtrack", "track", "melody"],
        video: ["movie", "film", "recording", "video clip", "media"],
        maximize: ["fullscreen", "expand", "enlarge", "zoom in"],
        minimize: ["collapse", "shrink", "reduce", "zoom out"],
        grid: ["layout", "tiles", "matrix", "rows and columns", "grid view"],
        "layout-grid": ["grid view", "tiles", "dashboard", "arrangement", "layout"],
        layers: ["stack", "overlapping", "layer panel", "z order", "arrangement"],
        "panel-left": ["sidebar", "left panel", "navigation drawer", "layout"],
        "panel-right": ["right sidebar", "properties panel", "inspector", "layout"],
        code: ["programming", "developer", "source code", "markup", "software"],
        terminal: ["command line", "console", "shell", "cli", "prompt"],
        database: ["data", "storage", "records", "sql", "data store"],
        shield: ["protection", "security", "safety", "defense", "privacy"],
        "shield-check": ["verified", "secure", "protected", "safety check", "trusted"],
        key: ["password", "access", "credential", "unlock", "authentication"],
        wallet: ["money", "cash", "payment", "purse", "finance"],
        "credit-card": ["payment", "bank card", "debit card", "purchase", "checkout"],
        "shopping-cart": ["cart", "basket", "checkout", "buy", "purchase", "ecommerce"],
        "shopping-bag": ["bag", "purchase", "store", "retail", "shopping"],
        package: ["box", "parcel", "shipment", "delivery", "product"],
        truck: ["delivery", "shipping", "transport", "freight", "vehicle"],
        car: ["vehicle", "automobile", "driving", "transport"],
        plane: ["airplane", "aircraft", "flight", "travel", "aviation"],
        coffee: ["cafe", "caffeine", "cup", "drink", "beverage"],
        utensils: ["cutlery", "fork", "knife", "spoon", "dining", "restaurant"],
        book: ["reading", "publication", "literature", "volume", "textbook"],
        "book-open": ["read", "reading", "open book", "literature", "study"],
        "graduation-cap": ["education", "graduate", "school", "university", "learning"],
        lightbulb: ["idea", "inspiration", "tip", "suggestion", "innovation"],
        zap: ["lightning", "electricity", "energy", "power", "fast"],
        wrench: ["repair", "maintenance", "tool", "spanner", "fix"],
        hammer: ["repair", "construction", "build", "tool", "carpentry"],
        bug: ["error", "debug", "insect", "issue", "software bug"],
        "git-branch": ["version control", "branching", "source control", "git"],
        "git-commit": ["version control", "save point", "revision", "git"],
        "chart-bar": ["bar graph", "statistics", "analytics", "data visualization", "report"],
        "chart-line": ["line graph", "trend", "analytics", "statistics", "data visualization"],
        "chart-pie": ["pie chart", "proportion", "percentage", "analytics", "statistics"],
        activity: ["pulse", "health", "monitoring", "metrics", "trend"],
        fingerprint: ["identity", "biometric", "authentication", "touch id", "verification"],
        "qr-code": ["scan code", "quick response code", "barcode alternative", "matrix code"],
        scan: ["scanner", "scanning", "capture", "read code", "document scan"],
        "scan-search": ["visual search", "find image", "search image", "inspect"],
        printer: ["print", "printing", "paper output", "hard copy"],
        monitor: ["display", "screen", "desktop", "computer monitor"],
        laptop: ["notebook computer", "portable computer", "pc", "computer"],
        smartphone: ["mobile", "cell phone", "phone", "handset", "device"],
        tablet: ["ipad", "touchscreen device", "mobile device", "slate"],
        mouse: ["computer mouse", "pointer device", "input device"],
        keyboard: ["typing", "keys", "input device", "keypad"],
        cursor: ["pointer", "caret", "text cursor", "mouse pointer"],
        "mouse-pointer": ["cursor", "pointer", "click", "selection"],
        move: ["drag", "reposition", "relocate", "translate", "movement"],
        crosshair: ["target", "aim", "precision", "center point", "reticle"],
        target: ["aim", "goal", "bullseye", "focus", "objective"],
        compass: ["direction", "navigation", "orientation", "bearing"],
        navigation: ["directions", "route", "compass", "wayfinding", "location"],
        route: ["path", "directions", "navigation", "journey", "trip"],
        flag: ["marker", "milestone", "report", "bookmark", "destination"],
        pin: ["location", "marker", "map pin", "place"],
        "map-pinned": ["location", "map marker", "saved place", "destination"],
        save: ["save file", "store", "preserve", "keep", "disk", "floppy disk"],
        "save-all": ["save files", "save everything", "store all", "preserve changes"],
        "cloud-upload": ["upload", "backup", "sync to cloud", "online storage"],
        "cloud-download": ["download", "restore", "retrieve from cloud", "online storage"],
        "wifi-off": ["no internet", "offline", "disconnected", "wireless disabled"],
        "battery-charging": ["charging", "power", "battery level", "energy"],
        "volume-x": ["mute", "muted", "no sound", "silence", "audio off"],
        "volume-off": ["mute", "muted", "no sound", "silence", "audio off"],
        "mic-off": ["microphone muted", "mute microphone", "no audio input", "voice off"],
        "play-circle": ["start playback", "play media", "resume", "video play"],
        "pause-circle": ["pause playback", "hold media", "suspend playback"],
        "calendar-clock": ["schedule", "date and time", "appointment time", "event time"],
        "calendar-plus": ["add event", "new appointment", "create schedule", "add date"],
        "file-plus": ["new document", "create file", "add file", "new file"],
        "file-down": ["download document", "save file", "export file"],
        "file-up": ["upload document", "import file", "send file"],
        "file-search": ["find document", "search files", "inspect file"],
        "folder-plus": ["new folder", "create directory", "add folder"],
        "folder-search": ["find folder", "search directory", "browse files"],
        "circle-plus": ["add", "create", "new item", "insert"],
        "circle-minus": ["remove", "delete", "subtract", "decrease"],
        "circle-x": ["close", "cancel", "dismiss", "remove", "error"],
        "x-circle": ["close", "cancel", "dismiss", "remove", "error"],
        "triangle-alert": ["warning", "caution", "danger", "attention"],
        "alert-triangle": ["warning", "caution", "danger", "attention"],
        "shield-alert": ["security warning", "threat", "risk", "protection alert"],
        "key-round": ["password", "access key", "credential", "authentication"],
        banknote: ["cash", "money", "currency", "bill", "payment"],
        coins: ["money", "cash", "currency", "finance", "change"],
        receipt: ["invoice", "bill", "transaction", "purchase record", "proof of payment"],
        "shopping-basket": ["basket", "cart", "checkout", "groceries", "purchase"],
        "package-check": ["delivered", "order complete", "shipment received", "verified package"],
        "package-open": ["unpack", "open box", "unboxing", "delivery"],
        locate: ["find my location", "gps", "position", "locate me"],
        "sunrise": ["morning", "dawn", "daybreak"],
        sunset: ["evening", "dusk", "nightfall"],
        "cloud-sun": ["partly cloudy", "sun and clouds", "weather forecast"],
        "cloud-snow": ["snowfall", "snowing", "winter weather"],
        "cloud-lightning": ["thunderstorm", "storm", "lightning", "weather"],
        wind: ["breeze", "windy", "airflow", "weather"],
        snowflake: ["snow", "ice", "winter", "freezing", "cold weather"],
        headset: ["headphones", "support", "customer service", "audio"],
        radio: ["broadcast", "wireless audio", "tuner", "music"],
        tv: ["television", "screen", "display", "broadcast"],
        film: ["movie", "cinema", "video", "motion picture"],
        sidebar: ["side panel", "navigation drawer", "left panel", "right panel"],
        "layout-dashboard": ["dashboard", "widgets", "panels", "overview", "workspace"],
        network: ["connection", "nodes", "topology", "internet", "infrastructure"],
        server: ["hosting", "backend", "computer", "infrastructure", "data center"],
        cpu: ["processor", "chip", "hardware", "computing"],
        "hard-drive": ["storage", "disk", "drive", "memory", "computer hardware"],
        braces: ["code", "programming", "syntax", "developer", "curly brackets"],
        "file-code": ["source file", "programming file", "code document", "script"],
        "square-kanban": ["kanban board", "task board", "project management", "workflow"],
        "list-check": ["checklist", "tasks", "to do", "completed items"],
        "list-todo": ["to do list", "tasks", "checklist", "task manager"],
        "arrow-left-right": ["swap", "exchange", "horizontal direction", "transfer"],
        "refresh-ccw": ["reload", "refresh", "sync", "rotate back", "update"]
    };

    const RELATED_ICON_SEARCH_TERMS = {
        add:["create","new","plus","insert","append"], alert:["warning","caution","attention","notice"],
        archive:["storage","backup","old files"], arrow:["direction","navigate","navigation"],
        audio:["sound","music","volume","listen","speaker"], bag:["shopping bag","purchase","retail"],
        bank:["banking","finance","money","payment"], book:["reading","read","library","publication","pages"],
        calendar:["date","schedule","planner","appointment","event"], camera:["photograph","photography","snapshot","capture","picture"],
        chart:["graph","analytics","statistics","data visualization","report"], check:["done","complete","completed","success","approved","confirm"],
        cog:["gear","settings","setting","preferences","configuration","options","tune"],
        circle:["round","circular","ellipse","shape"], clipboard:["copy","paste","notes","board"],
        clock:["time","watch","duration","schedule"], close:["exit","dismiss","cancel","remove","clear"],
        cloud:["online storage","internet","sync","weather"], code:["programming","developer","software","source code","script"],
        comment:["chat","feedback","reply","discussion","message"], copy:["duplicate","clone","replicate","clipboard"],
        credit:["card","payment","billing","checkout","finance"], database:["data","storage","records","server","backend"],
        delete:["remove","erase","discard","trash","bin"], download:["export","save file","retrieve"],
        edit:["modify","change","update","pencil","write"], email:["mail","envelope","inbox","message","correspondence"],
        eye:["view","visibility","preview","show","visible"], file:["document","attachment","paper","record"],
        filter:["sort","refine","adjust","narrow results"], folder:["directory","files","collection","organize"],
        gear:["settings","preferences","configuration","options","tune"], globe:["world","earth","international","website","language"],
        heart:["love","favorite","like","health","wellness"], home:["house","homepage","main page","residence","dashboard"],
        image:["photo","picture","photograph","graphic","visual"], info:["information","details","about","help","description"],
        key:["password","access","authentication","security","credential"], link:["url","hyperlink","connection","attach"],
        lock:["secure","security","private","protected","locked"], location:["place","map","address","position","geolocation"],
        mail:["email","envelope","inbox","message"], map:["location","navigation","directions","place","geography"],
        menu:["navigation","hamburger menu","sidebar","options"], message:["chat","conversation","comment","text","communication"],
        mic:["microphone","recording","voice","audio","speech"], minus:["subtract","decrease","remove","negative","less"],
        moon:["night","dark mode","sleep","lunar"], music:["audio","song","sound","track","playlist"],
        pencil:["edit","write","draw","modify"], phone:["telephone","call","contact","mobile","communication"],
        play:["start","begin","run","media","video"], plus:["add","create","new","increase","positive"],
        printer:["print","paper","document","hard copy"], refresh:["reload","retry","sync","update","rotate"],
        save:["store","download","disk","preserve"], search:["find","lookup","look up","discover","magnifier","magnifying glass"],
        send:["submit","dispatch","deliver","forward","outgoing message"],
        settings:["preferences","configuration","options","controls","customize","gear","cog"],
        share:["send","forward","distribute","social","share link"], shield:["protection","security","safe","defense","privacy"],
        shopping:["cart","basket","store","purchase","checkout","retail"], star:["favorite","rating","bookmark","featured","important"],
        sun:["day","light","brightness","weather","light mode"], tag:["label","category","keyword","classification"],
        text:["typography","writing","font","word","content"], trash:["delete","remove","discard","bin","garbage","waste","rubbish"],
        unlock:["open lock","access","unlocked","release"], upload:["import","attach","send file","transfer","submit"],
        user:["person","profile","account","avatar","member","individual","contact"],
        video:["movie","film","recording","media","playback"], wallet:["money","cash","payment","finance","purse"],
        wifi:["wireless","internet","network","connection","signal"]
    };

    function getCuratedIconSearchTerms(iconName) {
        const normalized = String(iconName || "").trim().toLowerCase().replace(/\s+/g, "-");
        const baseName = normalized.replace(/-(?:fill|filled|round|rounded|dashed|dotted|vertical|horizontal)$/, "");
        return [...new Set([
            ...(CURATED_ICON_SEARCH_TERMS[normalized] || []),
            ...(CURATED_ICON_SEARCH_TERMS[baseName] || [])
        ])];
    }

    // Common irregular forms plus conservative English singular/plural handling.
    const ICON_SEARCH_IRREGULAR_FORMS = Object.freeze({
        people: ["person"], person: ["people", "persons"], persons: ["person", "people"],
        bus: ["buses"], buses: ["bus"], class: ["classes"], classes: ["class"],
        glass: ["glasses"], glasses: ["glass"], dress: ["dresses"], dresses: ["dress"],
        address: ["addresses"], addresses: ["address"], process: ["processes"], processes: ["process"],
        men: ["man"], man: ["men"], women: ["woman"], woman: ["women"],
        children: ["child"], child: ["children"], mice: ["mouse"], mouse: ["mice"],
        geese: ["goose"], goose: ["geese"], teeth: ["tooth"], tooth: ["teeth"],
        feet: ["foot"], foot: ["feet"], leaves: ["leaf"], leaf: ["leaves"],
        knives: ["knife"], knife: ["knives"], wolves: ["wolf"], wolf: ["wolves"],
        shelves: ["shelf"], shelf: ["shelves"], lives: ["life"], life: ["lives"],
        wives: ["wife"], wife: ["wives"], indices: ["index"], index: ["indices"],
        matrices: ["matrix"], matrix: ["matrices"], vertices: ["vertex"], vertex: ["vertices"],
        analyses: ["analysis"], analysis: ["analyses"], bases: ["basis"], basis: ["bases"],
        crises: ["crisis"], crisis: ["crises"], theses: ["thesis"], thesis: ["theses"],
        diagnoses: ["diagnosis"], diagnosis: ["diagnoses"], statuses: ["status"], status: ["statuses"],
        series: ["series"], species: ["species"], news: ["news"]
    });

    function getIconSearchWordVariants(value) {
        const word = normalizeIconSearchText(value);
        if (!word || word.includes(" ")) return word ? [word] : [];
        const irregular = ICON_SEARCH_IRREGULAR_FORMS[word];
        const variants = new Set([word, ...(irregular || [])]);
        if (irregular) return [...variants];

        if (word.length >= 3) {
            const looksPlural = word.endsWith("ies") ||
                /(ches|shes|xes|zes|sses)$/.test(word) ||
                (word.endsWith("s") && !/(ss|us|is)$/.test(word));

            if (word.endsWith("ies")) variants.add(word.slice(0, -3) + "y");
            else if (/(ches|shes|xes|zes|sses)$/.test(word)) variants.add(word.slice(0, -2));
            else if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) variants.add(word.slice(0, -1));

            if (!looksPlural) {
                if (/[^aeiou]y$/.test(word)) variants.add(word.slice(0, -1) + "ies");
                else if (/(ch|sh|x|z)$/.test(word)) variants.add(word + "es");
                else if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) variants.add(word + "es");
                else if (!/(s|ss|us|is)$/.test(word)) variants.add(word + "s");
            }
        }
        return [...variants];
    }

    function expandIconSearchTermVariants(values, relatedTerms) {
        const expanded = [...values];
        for (const value of values) {
            const normalized = normalizeIconSearchText(value);
            if (!normalized) continue;
            for (const word of normalized.split(" ")) {
                const variants = getIconSearchWordVariants(word);
                expanded.push(...variants);
                for (const variant of variants) {
                    if (relatedTerms[variant]) expanded.push(...relatedTerms[variant]);
                }
                if (relatedTerms[word]) expanded.push(...relatedTerms[word]);
            }
        }
        return [...new Set(expanded.map(value => normalizeIconSearchText(value))
            .filter(value => value && value.length > 1))];
    }

    function getExpandedIconSearchTerms(iconName, record = null) {
        const normalized = String(iconName || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
        const baseName = normalized.replace(/-(?:fill|filled|round|rounded|dashed|dotted|vertical|horizontal)$/, "");
        const lucide = record?.lucide || {};
        const ai = record?.ai || {};
        const aliases = (lucide.aliases || []).map(alias => typeof alias === "string" ? alias : alias?.name);
        // Reuse the same controlled query aliases in the drawer and search index,
        // so equivalent names (e.g. setting, settings, cog, and gear) are visible
        // as metadata instead of being hidden inside query-time matching only.
        const queryAliases = [normalized, baseName]
            .flatMap(name => ICON_SEARCH_QUERY_ALIASES[name] || []);
        const source = [
            normalized, normalized.replace(/-/g, " "), baseName, baseName.replace(/-/g, " "),
            ...(lucide.tags || []), ...(lucide.useCases || []), ...aliases,
            ...queryAliases, ...(ai.searchTerms || []), ...getCuratedIconSearchTerms(normalized)
        ];
        return expandIconSearchTermVariants(source, RELATED_ICON_SEARCH_TERMS);
    }

    function getProjectSearchTerms(project) {
        const name = (project.name || "").trim().toLowerCase();
        const categories = getProjectCategories(project);
        const metadataRecord = iconMetadataCache
            ? getIconMetadataRecord(iconMetadataCache, project.name)
            : null;
        const iconName = normalizeHomeSearchIconName(project.name);
        const variantBaseName = iconName.replace(/-(?:fill|filled|round|rounded|dashed|dotted|vertical|horizontal)$/, "");
        const inheritedRecord = variantBaseName !== iconName
            ? getIconMetadataRecord(iconMetadataCache, variantBaseName)
            : null;
        const savedReview = homeSearchReviewByName.get(iconName);
        const inheritedReview = variantBaseName !== iconName
            ? homeSearchReviewByName.get(variantBaseName)
            : null;
        const metadataEdits = savedReview?.metadataEdits || {};
        const inheritedEdits = inheritedReview?.metadataEdits || {};
        const metadataTerms = [
            ...(metadataRecord?.lucide?.tags || []),
            ...(metadataRecord?.ai?.searchTerms || []),
            ...(inheritedRecord?.lucide?.tags || []),
            ...(inheritedRecord?.ai?.searchTerms || []),
            ...(Array.isArray(metadataEdits.tags) ? metadataEdits.tags : []),
            ...(Array.isArray(metadataEdits.searchTerms) ? metadataEdits.searchTerms : []),
            ...(Array.isArray(metadataEdits.useCases) ? metadataEdits.useCases : []),
            ...(Array.isArray(inheritedEdits.tags) ? inheritedEdits.tags : []),
            ...(Array.isArray(inheritedEdits.searchTerms) ? inheritedEdits.searchTerms : []),
            ...(Array.isArray(inheritedEdits.useCases) ? inheritedEdits.useCases : []),
            // Curated visual descriptions and user-edited descriptions are useful
            // search evidence, but skip generic generated "Icon named ..." text.
            ...[
                metadataRecord?.ai?.description,
                inheritedRecord?.ai?.description,
                metadataEdits.description,
                inheritedEdits.description
            ].filter(value => typeof value === "string" && value.trim() &&
                !/^icon named\b/i.test(value.trim())),
            ...getExpandedIconSearchTerms(iconName, metadataRecord || inheritedRecord)
        ];
        const allTerms = [...new Set([
            name,
            ...categories,
            ...(Array.isArray(project.searchTerms) ? project.searchTerms : []),
            ...metadataTerms
        ].map(value => normalizeIconSearchText(value)).filter(Boolean))];

        const termSet = new Set(allTerms);
        const pluralToSingular = Object.freeze({
            people: "person", persons: "person", buses: "bus", classes: "class",
            glasses: "glass", dresses: "dress", addresses: "address", processes: "process",
            men: "man", women: "woman", children: "child", mice: "mouse",
            geese: "goose", teeth: "tooth", feet: "foot", leaves: "leaf",
            knives: "knife", wolves: "wolf", shelves: "shelf", lives: "life",
            wives: "wife", indices: "index", matrices: "matrix", vertices: "vertex",
            analyses: "analysis", bases: "basis", crises: "crisis", theses: "thesis",
            diagnoses: "diagnosis", statuses: "status"
        });

        return allTerms.filter(term => {
            if (term.includes(" ")) return true;
            const singular = pluralToSingular[term] || (
                term.endsWith("ies") ? term.slice(0, -3) + "y" :
                /(ches|shes|xes|zes|sses)$/.test(term) ? term.slice(0, -2) :
                term.length > 3 && term.endsWith("s") && !/(ss|us|is)$/.test(term)
                    ? term.slice(0, -1)
                    : null
            );
            return !singular || singular === term || !termSet.has(singular);
        });
    }

    // ---------------------------------------------------------------------------
    // STRICT, WEIGHTED ICON SEARCH
    // Curated query aliases avoid generic "options" matches for cog/settings.
    // ---------------------------------------------------------------------------
    const ICON_SEARCH_QUERY_ALIASES = Object.freeze({
        cog: ["gear", "settings", "setting", "preferences", "preference", "configuration", "configure", "tune", "adjustment", "controls"],
        gear: ["cog", "settings", "setting", "preferences", "preference", "configuration", "configure", "tune", "adjustment", "controls"],
        settings: ["cog", "gear", "setting", "preferences", "preference", "configuration", "configure", "tune", "adjustment", "controls"],
        setting: ["cog", "gear", "settings", "preferences", "preference", "configuration", "configure", "tune", "adjustment", "controls"],
        preferences: ["settings", "setting", "cog", "gear", "configuration", "tune"],
        preference: ["settings", "setting", "cog", "gear", "configuration", "tune"],
        configuration: ["settings", "setting", "preferences", "cog", "gear", "controls"],
        configure: ["settings", "setting", "preferences", "cog", "gear"],
        tune: ["settings", "setting", "cog", "gear", "adjustment"],
        menu: ["hamburger", "navigation", "drawer", "nav"],
        hamburger: ["menu", "navigation", "drawer"],
        ellipsis: ["more", "overflow", "dots", "three dots", "kebab"],
        ellipses: ["ellipse", "more", "overflow", "dots", "three dots", "kebab"]
    });

    function normalizeIconSearchText(value) {
        return String(value ?? "")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getIconSearchCandidates(token) {
        const normalized = normalizeIconSearchText(token);
        const variants = getIconSearchWordVariants(normalized);
        const overrideKey = variants.find(value =>
            Object.prototype.hasOwnProperty.call(ICON_SEARCH_QUERY_ALIASES, value)
        );
        const aliases = overrideKey
            ? (ICON_SEARCH_QUERY_ALIASES[overrideKey] || [])
            : variants.flatMap(value => RELATED_ICON_SEARCH_TERMS[value] || []);
        return [...new Set([
            ...variants,
            ...aliases.flatMap(alias => getIconSearchWordVariants(alias))
        ].map(normalizeIconSearchText).filter(Boolean))];
    }

    function iconSearchPhraseMatches(haystack, phrase) {
        const normalizedHaystack = normalizeIconSearchText(haystack);
        const normalizedPhrase = normalizeIconSearchText(phrase);
        if (!normalizedHaystack || !normalizedPhrase) return false;
        return (` ${normalizedHaystack} `).includes(` ${normalizedPhrase} `);
    }

    // Keyboard-aware edit distance catches several small typing mistakes
    // without treating unrelated words as matches (e.g. "sitting" vs "setting").
    function areAdjacentKeyboardKeysForIconSearch(a, b) {
        const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
        const positions = new Map();
        rows.forEach((row, rowIndex) => {
            [...row].forEach((key, columnIndex) => {
                const offset = rowIndex === 1 ? 0.25 : rowIndex === 2 ? 0.75 : 0;
                positions.set(key, { row: rowIndex, column: columnIndex + offset });
            });
        });
        const first = positions.get(a);
        const second = positions.get(b);
        return !!first && !!second &&
            Math.abs(first.row - second.row) <= 1 &&
            Math.abs(first.column - second.column) <= 1.15;
    }

    function isSafeIconSearchTypo(queryWord, indexedWord) {
        const a = normalizeIconSearchText(queryWord);
        const b = normalizeIconSearchText(indexedWord);
        if (!a || !b || a === b) return false;
        const shortest = Math.min(a.length, b.length);
        if (shortest < 5 || Math.abs(a.length - b.length) > 3) return false;

        // Allow at most 2 edits for 5-6 letter words and 3 for words of 7+.
        const maxEdits = shortest >= 7 ? 3 : 2;
        const previousPrevious = Array.from({ length: b.length + 1 }, (_, i) => i);
        let previous = previousPrevious.slice();

        for (let i = 1; i <= a.length; i++) {
            const current = new Array(b.length + 1);
            current[0] = i;
            let rowMinimum = current[0];

            for (let j = 1; j <= b.length; j++) {
                const same = a[i - 1] === b[j - 1];
                const substitutionCost = same
                    ? 0
                    : (areAdjacentKeyboardKeysForIconSearch(a[i - 1], b[j - 1]) ? 1 : 99);
                let cost = Math.min(
                    previous[j] + 1,             // missing character
                    current[j - 1] + 1,          // extra character
                    previous[j - 1] + substitutionCost
                );

                // Adjacent transposition (e.g. "smiel" -> "smile").
                if (i > 1 && j > 1 &&
                    a[i - 1] === b[j - 2] &&
                    a[i - 2] === b[j - 1]) {
                    cost = Math.min(cost, previousPrevious[j - 2] + 1);
                }
                current[j] = cost;
                rowMinimum = Math.min(rowMinimum, cost);
            }

            if (rowMinimum > maxEdits) return false;
            previousPrevious.splice(0, previousPrevious.length, ...previous);
            previous = current;
        }

        return previous[b.length] <= maxEdits;
    }

    // Match a partial query token against the beginning of any indexed word.
    // This deliberately avoids substring matches (e.g. "og" does not match "cog").
    function iconSearchPrefixMatches(text, prefix) {
        const normalizedPrefix = normalizeIconSearchText(prefix);
        if (!normalizedPrefix) return false;
        const words = normalizeIconSearchText(text).split(" ").filter(Boolean);
        return words.some(word => word.startsWith(normalizedPrefix));
    }

    // Cache normalized search data per icon so each keystroke does not rebuild it.
    const homeSearchProfileCache = new Map();

    function getHomeSearchProfile(project) {
        const iconName = normalizeHomeSearchIconName(project.name);
        const categoriesRaw = getProjectCategories(project);
        const searchTermsRaw = Array.isArray(project.searchTerms) ? project.searchTerms : [];
        const cacheKey = `${iconName}|${JSON.stringify([categoriesRaw, searchTermsRaw])}`;
        const cached = homeSearchProfileCache.get(cacheKey);
        if (cached) return cached;

        const name = normalizeIconSearchText(project.name);
        const nameTokens = name.split(" ").filter(Boolean);
        const terms = getProjectSearchTerms(project).map(normalizeIconSearchText).filter(Boolean);
        const categories = categoriesRaw.map(normalizeIconSearchText).filter(Boolean);
        const termWords = [...new Set(terms.flatMap(term => term.split(" ").filter(Boolean)))];
        const profile = {
            name,
            namePadded: ` ${name} `,
            nameTokens,
            termSet: new Set(terms),
            termPadded: terms.map(term => ` ${term} `),
            termWords,
            indexedWords: termWords.filter(word => word.length >= 5),
            categoryPadded: categories.map(category => ` ${category} `),
            categoryWords: [...new Set(categories.flatMap(category => category.split(" ").filter(Boolean)))]
        };
        homeSearchProfileCache.set(cacheKey, profile);
        return profile;
    }

    function createHomeSearchContext(rawQuery) {
        const query = normalizeIconSearchText(rawQuery);
        const tokens = [...new Set(query.split(" ").filter(Boolean))];
        return { query, tokens, candidates: tokens.map(token => getIconSearchCandidates(token)) };
    }

    function scoreHomeProjectSearch(project, context) {
        const { query, tokens, candidates } = context;
        if (!query || !tokens.length) return 0;
        const profile = getHomeSearchProfile(project);
        const { name, namePadded, nameTokens, termSet, termPadded, termWords, indexedWords, categoryPadded, categoryWords } = profile;
        let totalScore = 0;

        for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
            const token = tokens[tokenIndex];
            let bestScore = 0;

            for (const candidate of candidates[tokenIndex]) {
                if (!candidate) continue;
                if (name === candidate) bestScore = Math.max(bestScore, 120);
                else if (namePadded.includes(` ${candidate} `)) bestScore = Math.max(bestScore, 96);

                if (termSet.has(candidate)) bestScore = Math.max(bestScore, 76);
                else if (termPadded.some(term => term.includes(` ${candidate} `))) bestScore = Math.max(bestScore, 66);
                if (categoryPadded.some(category => category.includes(` ${candidate} `))) bestScore = Math.max(bestScore, 28);

                if (nameTokens.some(word => word.startsWith(token))) bestScore = Math.max(bestScore, 58);
                if (termWords.some(word => word.startsWith(token))) bestScore = Math.max(bestScore, 44);
                if (categoryWords.some(word => word.startsWith(token))) bestScore = Math.max(bestScore, 22);
            }

            if (bestScore < 44) {
                if (nameTokens.some(word => isSafeIconSearchTypo(token, word))) {
                    bestScore = Math.max(bestScore, 42);
                } else if (indexedWords.some(word => isSafeIconSearchTypo(token, word))) {
                    bestScore = Math.max(bestScore, 38);
                }
            }

            if (bestScore === 0) return 0;
            totalScore += bestScore;
        }

        if (namePadded.includes(` ${query} `)) totalScore += 30;
        return Math.round(totalScore / tokens.length);
    }

    let homeSearchRenderToken = 0;
    let homeSearchReviewsLoaded = false;
    let homeSearchReviewLoadPromise = null;

    async function renderHomeProjects() {
        const renderToken = ++homeSearchRenderToken;
        if (!homeProjectGrid) return;
        homeProjectGrid.innerHTML = "";
        const isCategoryRows =
            galleryViewCategory === "categories" && !selectedCategoryFilter;

        homeProjectGrid.classList.toggle(
            "categories-layout",
            isCategoryRows && !homeSearchInput?.value.trim()
        );

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
        allFinished.forEach(project => {
            getProjectCategories(project).forEach(category => {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
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

            if (sortedCategories.includes(previous)) {
                homeCategorySelect.value = previous;
            }
        }
        homeCategoryDropdown?.refresh();

        const activeCategory = homeCategorySelect?.value || "all";
        if (selectedCategoryFilter) {
            finished = finished.filter(project => getProjectCategories(project).includes(selectedCategoryFilter));
        } else if (activeCategory !== "all") {
            finished = finished.filter(project => getProjectCategories(project).includes(activeCategory));
        }

        // Saved-project search is the default. Full Lucide search is optional.
        const query = homeSearchInput?.value.trim() || "";
        let searchResults = [];
        if (clearSearchBtn) clearSearchBtn.style.display = query ? "block" : "none";

        if (query) {
            try {
                const searchContext = createHomeSearchContext(query);
                const allSavedProjects = projectManager.projects.filter(
                    project => project.status === "finished"
                );
                const matchesActiveCategory = project => {
                    const categories = getProjectCategories(project);
                    if (selectedCategoryFilter) return categories.includes(selectedCategoryFilter);
                    if (activeCategory !== "all") return categories.includes(activeCategory);
                    return true;
                };

                const searchCandidates = [];
                // Search within the currently selected gallery tab (All, Recent,
                // or Favorites), while still using all saved names to avoid duplicates
                // in the optional Lucide-library results.
                finished.forEach(project => {
                    if (matchesActiveCategory(project)) {
                        searchCandidates.push({ type: "project", name: project.name, project });
                    }
                });

                if (searchAllLucideIcons) {
                    const metadata = await loadIconMetadata();
                    if (!homeSearchReviewsLoaded) {
                        if (!homeSearchReviewLoadPromise) {
                            homeSearchReviewLoadPromise = getAllAIReviewRecords()
                                .then(reviewRecords => {
                                    reviewRecords.forEach(record => {
                                        const key = normalizeHomeSearchIconName(record?.name);
                                        if (key) homeSearchReviewByName.set(key, record);
                                    });
                                    homeSearchProfileCache.clear();
                                    homeSearchReviewsLoaded = true;
                                })
                                .catch(reviewError => {
                                    homeSearchReviewLoadPromise = null;
                                    console.warn("Could not load local icon review metadata:", reviewError);
                                });
                        }
                        await homeSearchReviewLoadPromise;
                    }
                    if (renderToken !== homeSearchRenderToken) return;

                    const savedNames = new Set(
                        allSavedProjects.map(project => normalizeHomeSearchIconName(project.name))
                    );
                    Object.keys(metadata).forEach(iconName => {
                        if (savedNames.has(normalizeHomeSearchIconName(iconName))) return;
                        const review = homeSearchReviewByName.get(normalizeHomeSearchIconName(iconName));
                        const libraryProject = {
                            name: iconName,
                            manualCategories: Array.isArray(review?.manualCategories)
                                ? review.manualCategories : null,
                            autoCategories: []
                        };
                        if (matchesActiveCategory(libraryProject)) {
                            searchCandidates.push({ type: "library", name: iconName, project: libraryProject });
                        }
                    });
                }

                const SEARCH_WORK_BATCH_SIZE = 64;
                for (let offset = 0; offset < searchCandidates.length; offset += SEARCH_WORK_BATCH_SIZE) {
                    if (renderToken !== homeSearchRenderToken) return;
                    const batchEnd = Math.min(offset + SEARCH_WORK_BATCH_SIZE, searchCandidates.length);
                    for (let index = offset; index < batchEnd; index++) {
                        const candidate = searchCandidates[index];
                        const score = scoreHomeProjectSearch(candidate.project, searchContext);
                        if (score > 0) searchResults.push({ ...candidate, score });
                    }
                    if (batchEnd < searchCandidates.length) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
                if (renderToken !== homeSearchRenderToken) return;

                const sortVal = homeSortSelect?.value || "newest";
                searchResults.sort((a, b) => {
                    const relevanceDifference = b.score - a.score;
                    if (relevanceDifference !== 0) return relevanceDifference;
                    const nameA = (a.project.name || "").toLowerCase();
                    const nameB = (b.project.name || "").toLowerCase();
                    if (sortVal === "az") return nameA.localeCompare(nameB);
                    if (sortVal === "za") return nameB.localeCompare(nameA);
                    const dateA = Date.parse(a.project.savedAt) || 0;
                    const dateB = Date.parse(b.project.savedAt) || 0;
                    return sortVal === "oldest" ? dateA - dateB : dateB - dateA;
                });
            } catch (error) {
                console.error("Could not search the selected icon scope:", error);
                if (renderToken !== homeSearchRenderToken) return;
                homeProjectGrid.innerHTML = searchAllLucideIcons
                    ? "<p class='home-no-results'>The icon library could not be loaded. Please try again.</p>"
                    : "<p class='home-no-results'>Could not search your saved icons. Please try again.</p>";
                updateProjectCounters();
                return;
            }
        }
        // Sorting for the normal saved-project gallery (search results are ranked above).
        const sortVal = homeSortSelect?.value || "newest";
        if (!query) {
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
        }

        // View Mode Class
        homeProjectGrid.classList.toggle("list-view", homeViewMode === "list");

        if ((query && searchResults.length === 0) || (!query && finished.length === 0)) {
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
                cat.textContent = `${getProjectCategories(project).join(", ")} • ${new Date(project.savedAt).toLocaleDateString()}`;

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

            // Keep the tooltip below its icon. Only shift it right when its
            // centered position would intrude into the fixed gallery sidebar.
            card.addEventListener("mouseenter", () => {
                tooltip.style.setProperty("--tooltip-shift-x", "0px");

                const sidebar = document.querySelector(".home-sidebar");
                if (!sidebar) return;

                const sidebarRight = sidebar.getBoundingClientRect().right;
                const cardRect = card.getBoundingClientRect();
                const tooltipWidth = tooltip.offsetWidth;
                const centeredLeft = cardRect.left + cardRect.width / 2 - tooltipWidth / 2;
                const minimumLeft = sidebarRight + 8;

                if (centeredLeft < minimumLeft) {
                    const maximumRight = window.innerWidth - 8;
                    const shift = Math.min(
                        minimumLeft - centeredLeft,
                        Math.max(0, maximumRight - (centeredLeft + tooltipWidth))
                    );
                    tooltip.style.setProperty("--tooltip-shift-x", `${shift}px`);
                }
            });

            card.addEventListener("mouseleave", () => {
                tooltip.style.removeProperty("--tooltip-shift-x");
            });

            card.addEventListener("click", () => showProjectPreview(project));
            card.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    showProjectPreview(project);
                }
            });

            return card;
        }

        function createHomeLibrarySearchCard(iconName, project) {
            const card = document.createElement("div");
            card.className = "home-project-card library-search-card";
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.title = `Open ${iconName} in the Icon Library`;

            const preview = document.createElement("div");
            preview.className = "home-project-preview library-search-preview";
            preview.textContent = "✦";
            preview.setAttribute("aria-hidden", "true");

            const name = document.createElement("span");
            name.className = "home-project-name";
            name.textContent = iconName;

            const source = document.createElement("span");
            source.className = "home-project-category";
            source.textContent = "Lucide library";
            source.style.cssText = "display:block;font-size:10px;opacity:.72;margin-top:3px;";

            const categories = document.createElement("span");
            categories.className = "home-project-category";
            categories.textContent = getProjectCategories(project).join(", ");

            card.append(preview, name, source, categories);
            card.addEventListener("click", () => {
                iconLibrarySelectedName = iconName;
                const librarySearch = document.getElementById("icon-library-search");
                const libraryCategory = document.getElementById("icon-library-category");
                if (librarySearch) librarySearch.value = iconName;
                if (libraryCategory) libraryCategory.value = "all";
                switchHomeView("icon-library");
            });
            card.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    card.click();
                }
            });

            return card;
        }



        if (query && searchAllLucideIcons) {
            const SEARCH_CARD_BATCH_SIZE = 48;
            let nextSearchResultIndex = 0;
            const appendNextSearchBatch = () => {
                homeProjectGrid.querySelector(".home-search-load-more")?.remove();
                const fragment = document.createDocumentFragment();
                const batchEnd = Math.min(nextSearchResultIndex + SEARCH_CARD_BATCH_SIZE, searchResults.length);
                for (; nextSearchResultIndex < batchEnd; nextSearchResultIndex++) {
                    const result = searchResults[nextSearchResultIndex];
                    fragment.appendChild(result.type === "project"
                        ? createHomeProjectCard(result.project)
                        : createHomeLibrarySearchCard(result.name, result.project));
                }
                homeProjectGrid.appendChild(fragment);
                if (nextSearchResultIndex < searchResults.length) {
                    const moreButton = document.createElement("button");
                    moreButton.type = "button";
                    moreButton.className = "home-search-load-more";
                    moreButton.textContent = "Show more results (" +
                        (searchResults.length - nextSearchResultIndex) + " remaining)";
                    moreButton.addEventListener("click", appendNextSearchBatch);
                    homeProjectGrid.appendChild(moreButton);
                }
            };
            appendNextSearchBatch();
        } else if (query) {
            // Saved-icon search always renders every match; no Show more button.
            const fragment = document.createDocumentFragment();
            searchResults.forEach(result => fragment.appendChild(createHomeProjectCard(result.project)));
            homeProjectGrid.appendChild(fragment);
        } else if (galleryViewCategory === "categories" && !selectedCategoryFilter) {
            const grouped = {};

            finished.forEach(project => {
                getProjectCategories(project).forEach(category => {
                    if (!grouped[category]) grouped[category] = [];
                    grouped[category].push(project);
                });
            });

            Object.keys(grouped).sort((a, b) => a.localeCompare(b))
                .forEach(catName => {
                    const groupContainer = document.createElement("div");
                    groupContainer.className = "gallery-category-group";
                    groupContainer.dataset.category = catName;

                    const header = document.createElement("div");
                    header.className = "gallery-category-header";
                    header.innerHTML = `
                <span class="cat-header-title">${catName}</span>
                <span class="cat-header-count">
                    ${grouped[catName].length}
                    ${grouped[catName].length === 1 ? "icon" : "icons"}
                </span>
            `;

                    const cardsGrid = document.createElement("div");
                    cardsGrid.className = "gallery-category-cards";

                    grouped[catName].forEach(p => {
                        cardsGrid.appendChild(createHomeProjectCard(p));
                    });

                    groupContainer.append(header, cardsGrid);
                    homeProjectGrid.appendChild(groupContainer);
                });
        } else {
            finished.forEach(project => {
                homeProjectGrid.appendChild(createHomeProjectCard(project));
            });
        }



        updateGlobalCustomizationState(false);
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
        const categoryBackButton = document.getElementById("category-gallery-back-button");
        if (categoryBackButton) categoryBackButton.hidden = true;
        renderHomeProjects();
    });

    viewModeCategoriesBtn?.addEventListener("click", () => {
        viewModeCategoriesBtn.classList.add("active");
        viewModeAllBtn?.classList.remove("active");
        galleryViewCategory = "categories";
        const categoryBackButton = document.getElementById("category-gallery-back-button");
        if (categoryBackButton) categoryBackButton.hidden = true;
        renderHomeProjects();
    });

    // Return from a category jump to the normal, ungrouped gallery view.
    document.getElementById("category-gallery-back-button")?.addEventListener("click", () => {
        const categoryBackButton = document.getElementById("category-gallery-back-button");
        if (categoryBackButton) categoryBackButton.hidden = true;

        // Restore the same view used by the All sorting mode.
        galleryViewCategory = "all";
        selectedCategoryFilter = null;
        viewModeAllBtn?.classList.add("active");
        viewModeCategoriesBtn?.classList.remove("active");

        renderHomeProjects();

        // Return to the beginning of the normal gallery.
        homeProjectGrid?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
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

    function updateHomeSearchScopeToggle() {
        if (!homeSearchScopeToggle) return;
        homeSearchScopeToggle.classList.toggle("active", searchAllLucideIcons);
        homeSearchScopeToggle.setAttribute("aria-pressed", String(searchAllLucideIcons));
        homeSearchScopeToggle.textContent = searchAllLucideIcons ? "All icons: On" : "All icons";
        homeSearchScopeToggle.title = searchAllLucideIcons
            ? "Search saved icons and the complete Lucide library"
            : "Enable searching the complete Lucide library";
    }

    updateHomeSearchScopeToggle();
    homeSearchScopeToggle?.addEventListener("click", () => {
        searchAllLucideIcons = !searchAllLucideIcons;
        updateHomeSearchScopeToggle();
        clearTimeout(homeSearchDebounceTimer);
        homeSearchDebounceTimer = null;
        renderHomeProjects();
    });

    let homeSearchDebounceTimer = null;
    homeSearchInput?.addEventListener("input", () => {
        clearTimeout(homeSearchDebounceTimer);
        homeSearchDebounceTimer = setTimeout(() => {
            homeSearchDebounceTimer = null;
            renderHomeProjects();
        }, 130);
    });
    homeSortSelect?.addEventListener("change", renderHomeProjects);
    homeCategorySelect?.addEventListener("change", renderHomeProjects);

    clearSearchBtn?.addEventListener("click", () => {
        clearTimeout(homeSearchDebounceTimer);
        homeSearchDebounceTimer = null;
        if (homeSearchInput) homeSearchInput.value = "";
        renderHomeProjects();
    });

    // Preview Drawer Helpers
    function getPreviewSVG(project, strokeW = null) {
        if (!project?.thumbnail) return "";

        const color = globalIconColor?.value ||
            (document.body.classList.contains("light-theme")
                ? "#000000"
                : "#FFFFFF");

        const stroke = strokeW ?? (Number(globalStrokeWidth?.value) || 2);

        let svg = project.thumbnail;

        svg = svg.replace(
            /(stroke|fill)="(?!none)[^"]*"/g,
            (match, attribute) => `${attribute}="${color}"`
        );

        svg = svg.replace(
            /stroke-width="[^"]*"/g,
            `stroke-width="${stroke}"`
        );

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function renderProjectCategoryBadges(project) {
        if (!projectCategoryBadge) return;

        projectCategoryBadge.replaceChildren();

        const categories = getProjectCategories(project);
        const visibleCategories = categories.length ? categories : ["Uncategorized"];

        const expanded = projectCategoryBadge.dataset.expanded === "true";
        const canExpand = visibleCategories.length > 9;

        const categoriesToShow = expanded || !canExpand
            ? visibleCategories
            : visibleCategories.slice(0, 9);

        categoriesToShow.forEach(category => {
            const badge = document.createElement("button");
            badge.type = "button";
            badge.className = "project-category";
            badge.textContent = category;
            badge.title = `Show the gallery's "${category}" category`;

            badge.addEventListener("click", () => {
                galleryViewCategory = "categories";
                selectedCategoryFilter = null;

                if (viewModeCategoriesBtn) viewModeCategoriesBtn.classList.add("active");
                viewModeAllBtn?.classList.remove("active");

                if (homeCategorySelect) {
                    homeCategorySelect.value = "all";
                    homeCategoryDropdown?.refresh();
                }

                renderHomeProjects();
                closeProjectPreview();

                const categoryBackButton = document.getElementById("category-gallery-back-button");
                if (categoryBackButton) categoryBackButton.hidden = false;

                const targetGroup = Array.from(
                    homeProjectGrid?.querySelectorAll(".gallery-category-group") || []
                ).find(group => group.dataset.category === category);

                targetGroup?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });

            projectCategoryBadge.appendChild(badge);
        });

        if (canExpand) {
            const more = document.createElement("button");
            more.type = "button";
            more.className = "project-search-more";
            more.textContent = expanded
                ? "Show less"
                : `+${visibleCategories.length - 9} more`;

            more.addEventListener("click", () => {
                projectCategoryBadge.dataset.expanded = expanded ? "false" : "true";
                renderProjectCategoryBadges(project);
            });

            projectCategoryBadge.appendChild(more);
        }
    }
    function ensureProjectCategoryEditor() {
        const button = document.getElementById("project-edit-categories");
        const panel = document.getElementById("project-category-editor");
        if (!button || !panel) return null;

        if (button.dataset.bound === "true") return { button, panel };
        button.dataset.bound = "true";

        const closePanel = () => { panel.hidden = true; };
        button.addEventListener("click", () => {
            if (!panel.hidden) {
                closePanel();
                return;
            }
            const project = selectedHomeProject;
            if (!project) return;

            panel.replaceChildren();
            const heading = document.createElement("strong");
            heading.textContent = "Choose all categories that apply";
            heading.style.display = "block";
            heading.style.marginBottom = "9px";
            panel.appendChild(heading);

            const selected = new Set(
                Array.isArray(project.manualCategories) && project.manualCategories.length
                    ? project.manualCategories
                    : getProjectCategories(project).filter(category => category !== "Uncategorized")
            );


            const addCategoryRow = document.createElement("div");
            addCategoryRow.style.cssText = "display:flex;gap:6px;margin:8px 0 10px;";
            const newCategoryInput = document.createElement("input");
            newCategoryInput.type = "text";
            newCategoryInput.placeholder = "New category name";
            newCategoryInput.setAttribute("aria-label", "New category name");
            newCategoryInput.style.cssText = "min-width:0;flex:1;padding:6px 8px;border:1px solid var(--border-default);border-radius:6px;background:var(--bg-input);color:var(--text-primary);";
            const addCategoryButton = document.createElement("button");
            addCategoryButton.type = "button";
            addCategoryButton.textContent = "Add";
            addCategoryButton.className = "project-utility-button";
            addCategoryRow.append(newCategoryInput, addCategoryButton);
            panel.appendChild(addCategoryRow);

            const choices = document.createElement("div");
            panel.appendChild(choices);

            const renderCategoryChoices = selectedValues => {
                choices.replaceChildren();
                getAllIconCategories().forEach(category => {
                const label = document.createElement("label");
                label.style.cssText = "display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = category;
                checkbox.checked = selectedValues.includes(category);
                const text = document.createElement("span");
                text.textContent = category;
                label.append(checkbox, text);
                choices.appendChild(label);
                });
            };
            renderCategoryChoices([...selected]);

            addCategoryButton.addEventListener("click", () => {
                const name = newCategoryInput.value.trim();
                if (!name) {
                    newCategoryInput.focus();
                    return;
                }
                if (!saveCustomCategory(name)) {
                    showToast("That category is empty or already exists.", "error");
                    return;
                }
                const currentlySelected = [...choices.querySelectorAll('input[type="checkbox"]:checked')]
                    .map(input => input.value);
                currentlySelected.push(name);
                newCategoryInput.value = "";
                renderCategoryChoices(currentlySelected);
                showToast("Custom category added.", "success");
            });

            const actions = document.createElement("div");
            actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;";
            const save = document.createElement("button");
            save.type = "button";
            save.textContent = "Save categories";
            save.addEventListener("click", () => {
                const chosen = [...panel.querySelectorAll('input[type="checkbox"]:checked')]
                    .map(input => input.value);
                if (!setProjectManualCategories(project, chosen)) {
                    showToast("Select at least one category, or choose Use automatic.", "error");
                    return;
                }
                saveProjectManager();
                closePanel();
                renderProjectCategoryBadges(project);
                renderHomeProjects();
                renderManagementTable();
                showToast("Manual categories saved.", "success");
            });

            const automatic = document.createElement("button");
            automatic.type = "button";
            automatic.textContent = "Use automatic";
            automatic.addEventListener("click", () => {
                project.manualCategories = null;
                refreshProjectAutomaticCategories(project);
                saveProjectManager();
                closePanel();
                renderProjectCategoryBadges(project);
                renderHomeProjects();
                renderManagementTable();
                showToast("Automatic categories restored.", "success");
            });

            const cancel = document.createElement("button");
            cancel.type = "button";
            cancel.textContent = "Cancel";
            cancel.addEventListener("click", closePanel);
            actions.append(save, automatic, cancel);
            panel.appendChild(actions);
            panel.hidden = false;
        });

        document.addEventListener("pointerdown", event => {
            if (!panel.hidden && !panel.contains(event.target) && !button.contains(event.target)) closePanel();
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && !panel.hidden) closePanel();
        });
        return { button, panel };
    }

    ensureProjectCategoryEditor();

    // ====================================================================
    // AI + OFFICIAL LUCIDE METADATA IN THE ICON DETAILS DRAWER
    // Batch review data is shared through IndexedDB on the same local origin.
    // Nothing is applied to a project until the user explicitly clicks Apply.
    // ====================================================================
    let iconMetadataCache = null;
    let iconMetadataLoadPromise = null;
    let aiReviewDatabasePromise = null;
    let homeSearchReviewByName = new Map();

    function normalizeHomeSearchIconName(value) {
        return String(value || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
    }

    function loadIconMetadata() {
        if (iconMetadataCache) return Promise.resolve(iconMetadataCache);
        if (!iconMetadataLoadPromise) {
            iconMetadataLoadPromise = fetch("./icon-metadata.json")
                .then(response => {
                    if (!response.ok) throw new Error("Metadata file could not be loaded.");
                    return response.json();
                })
                .then(data => {
                    iconMetadataCache = data;
                    return data;
                })
                .catch(error => {
                    iconMetadataLoadPromise = null;
                    throw error;
                });
        }
        return iconMetadataLoadPromise;
    }

    function openAIReviewDatabase() {
        if (aiReviewDatabasePromise) return aiReviewDatabasePromise;
        aiReviewDatabasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open("icon-maker-ai-categorization", 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains("results")) {
                    request.result.createObjectStore("results", { keyPath: "name" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return aiReviewDatabasePromise;
    }

    async function getAIReviewRecord(iconName) {
        const db = await openAIReviewDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction("results", "readonly")
                .objectStore("results").get(iconName);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function getAllAIReviewRecords() {
        const db = await openAIReviewDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction("results", "readonly")
                .objectStore("results").getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async function saveAIReviewRecord(record) {
        const db = await openAIReviewDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("results", "readwrite");
            transaction.objectStore("results").put(record);
            transaction.oncomplete = () => {
                const key = normalizeHomeSearchIconName(record?.name);
                if (key) homeSearchReviewByName.set(key, record);
                homeSearchProfileCache.clear();
                renderHomeProjects();
                resolve(true);
            };
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error("Save was cancelled."));
        });
    }

    // Load official metadata and local manual edits for homepage search on startup.
    Promise.all([
        loadIconMetadata().catch(error => {
            console.warn("Could not load official icon metadata for homepage search:", error);
            return null;
        }),
        getAllAIReviewRecords().catch(error => {
            console.warn("Could not load saved metadata edits for homepage search:", error);
            return [];
        })
    ]).then(([metadata, reviews]) => {
        if (metadata) iconMetadataCache = metadata;
        homeSearchReviewByName = new Map(
            reviews.map(record => [
                normalizeHomeSearchIconName(record?.name),
                record
            ]).filter(([name]) => name)
        );
        homeSearchProfileCache.clear();
        renderHomeProjects();
    });

    function createMetadataEditor(panel, iconName, record, baseRecord) {
        const section = document.createElement("details");
        section.style.cssText = "margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color,#64748b);";
        const summary = document.createElement("summary");
        summary.textContent = "Edit metadata";
        summary.style.cssText = "cursor:pointer;font-weight:600;font-size:13px;";
        section.appendChild(summary);

        const fields = [
            { key: "description", label: "Description", multiline: true },
            { key: "tags", label: "Tags (comma separated)", multiline: true },
            { key: "searchTerms", label: "Search terms (comma separated)", multiline: true },
            { key: "useCases", label: "Use cases (comma separated)", multiline: true },
            { key: "contributors", label: "Contributors (comma separated)", multiline: false }
        ];
        const controls = {};
        fields.forEach(field => {
            const label = document.createElement("label");
            label.textContent = field.label;
            label.style.cssText = "display:block;margin-top:9px;font-size:12px;font-weight:600;";
            const input = document.createElement(field.multiline ? "textarea" : "input");
            input.value = field.key === "description"
                ? (record?.metadataEdits?.description ?? baseRecord?.ai?.description ?? "")
                : (record?.metadataEdits?.[field.key] ?? (
                    field.key === "tags" ? (baseRecord?.lucide?.tags || []).join(", ") :
                    field.key === "searchTerms" ? getExpandedIconSearchTerms(iconName, baseRecord).join(", ") :
                    field.key === "useCases" ? (baseRecord?.lucide?.useCases || []).join(", ") :
                    (baseRecord?.lucide?.contributors || []).join(", ")
                ));
            input.style.cssText = "display:block;box-sizing:border-box;width:100%;margin-top:4px;padding:7px;border:1px solid var(--border-color,#64748b);border-radius:7px;background:transparent;color:inherit;font:inherit;font-size:12px;";
            if (field.multiline) input.rows = field.key === "description" ? 3 : 2;
            controls[field.key] = input;
            label.appendChild(input);
            section.appendChild(label);
        });

        const save = document.createElement("button");
        save.type = "button";
        save.textContent = "Save metadata edits";
        save.style.cssText = "margin-top:10px;padding:7px 10px;border:1px solid var(--border-color,#64748b);border-radius:7px;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:12px;";
        save.addEventListener("click", async () => {
            save.disabled = true;
            try {
                const latest = await getAIReviewRecord(iconName);
                const next = latest || {
                    name: iconName,
                    officialCategories: [],
                    aiSuggestions: [],
                    analyzedAt: null,
                    reviewedAt: null,
                    manualCategories: null
                };
                const split = value => [...new Set(value.split(",").map(item => item.trim()).filter(Boolean))];
                next.metadataEdits = {
                    description: controls.description.value.trim(),
                    tags: split(controls.tags.value),
                    searchTerms: split(controls.searchTerms.value),
                    useCases: split(controls.useCases.value),
                    contributors: split(controls.contributors.value),
                    updatedAt: new Date().toISOString()
                };
                await saveAIReviewRecord(next);
                showToast("Metadata edits saved in this browser.", "success");
            } catch (error) {
                showToast("Could not save metadata: " + error.message, "error");
            } finally {
                save.disabled = false;
            }
        });
        section.appendChild(save);
        panel.appendChild(section);
    }

    function getIconMetadataRecord(metadata, iconName) {
        if (!metadata || !iconName) return null;
        const normalized = iconName.trim().toLowerCase().replace(/\s+/g, "-");
        return metadata[normalized] || metadata[normalized.replace(/_/g, "-")] || null;
    }

    function renderMetadataList(parent, headingText, values) {
        if (!Array.isArray(values) || !values.length) return;
        const heading = document.createElement("strong");
        heading.textContent = headingText;
        heading.style.cssText = "display:block;margin:10px 0 6px;";
        const list = document.createElement("div");
        list.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;";
        values.forEach(value => {
            const chip = document.createElement("span");
            chip.textContent = String(value);
            chip.style.cssText = "font-size:11px;padding:4px 8px;border:1px solid var(--border-color,#64748b);border-radius:20px;opacity:.9;";
            list.appendChild(chip);
        });
        parent.append(heading, list);
    }

    let iconLibraryRenderToken = 0;
    let iconLibrarySelectedName = "";

    async function renderIconLibraryView() {
        const token = ++iconLibraryRenderToken;
        const results = document.getElementById("icon-library-results");
        const details = document.getElementById("icon-library-details");
        const search = document.getElementById("icon-library-search");
        const category = document.getElementById("icon-library-category");
        if (!results || !details || !search || !category) return;

        results.innerHTML = "<p class='home-empty'>Loading icon metadata…</p>";
        try {
            const metadata = await loadIconMetadata();
            const savedReviews = await getAllAIReviewRecords();
            const reviewByName = new Map(savedReviews.map(item => [item.name, item]));
            if (token !== iconLibraryRenderToken) return;
            const names = Object.keys(metadata).sort((a, b) => a.localeCompare(b));
            const countBadge = document.getElementById("icon-library-count");
            if (countBadge) countBadge.textContent = names.length.toLocaleString();
            const categories = [...new Set(names.flatMap(name => metadata[name]?.lucide?.categories || []))].sort();
            const currentCategory = category.value;
            category.replaceChildren(new Option("All official categories", "all"));
            categories.forEach(value => category.add(new Option(value, value)));
            category.value = categories.includes(currentCategory) ? currentCategory : "all";

            const renderList = () => {
                const query = search.value.trim();
                const searchContext = query ? createHomeSearchContext(query) : null;
                const selectedCategory = category.value;
                const matches = names.map(name => {
                    const record = metadata[name] || {};
                    const lucide = record.lucide || {};
                    const review = reviewByName.get(name);
                    const searchProject = {
                        name,
                        manualCategories: Array.isArray(review?.manualCategories)
                            ? review.manualCategories : null,
                        autoCategories: []
                    };
                    return {
                        name,
                        score: searchContext ? scoreHomeProjectSearch(searchProject, searchContext) : 0,
                        matchesCategory: selectedCategory === "all" ||
                            (lucide.categories || []).includes(selectedCategory)
                    };
                }).filter(item =>
                    (!searchContext || item.score > 0) && item.matchesCategory
                ).sort((a, b) => {
                    if (searchContext && b.score !== a.score) return b.score - a.score;
                    return a.name.localeCompare(b.name);
                });
                results.replaceChildren();
                const count = document.createElement("p");
                count.className = "muted";
                count.textContent = matches.length + " of " + names.length + " icons";
                results.appendChild(count);
                matches.forEach(({ name }) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.textContent = name;
                    button.style.cssText = "display:block;width:100%;text-align:left;padding:9px 10px;margin:2px 0;border:0;border-radius:7px;background:" +
                        (name === iconLibrarySelectedName ? "var(--accent-light)" : "transparent") +
                        ";color:var(--text-primary);cursor:pointer;font:inherit;font-size:12px;";
                    button.addEventListener("click", () => {
                        iconLibrarySelectedName = name;
                        renderList();
                        renderIconLibraryDetails(name, metadata[name]);
                    });
                    results.appendChild(button);
                });
                if (!matches.length) {
                    const empty = document.createElement("p");
                    empty.className = "home-empty";
                    empty.textContent = "No icons match this search.";
                    results.appendChild(empty);
                }
            };
            if (!search.dataset.libraryBound) {
                let librarySearchDebounceTimer = null;
                search.addEventListener("input", () => {
                    clearTimeout(librarySearchDebounceTimer);
                    librarySearchDebounceTimer = setTimeout(() => {
                        librarySearchDebounceTimer = null;
                        renderList();
                    }, 130);
                });
                category.addEventListener("change", renderList);
                search.dataset.libraryBound = "true";
            }
            renderList();
            if (iconLibrarySelectedName && metadata[iconLibrarySelectedName]) {
                renderIconLibraryDetails(iconLibrarySelectedName, metadata[iconLibrarySelectedName]);
            }
        } catch (error) {
            results.textContent = "Could not load icon metadata: " + error.message;
        }
    }

    async function renderIconLibraryDetails(name, baseRecord) {
        const panel = document.getElementById("icon-library-details");
        if (!panel) return;
        panel.replaceChildren();
        const heading = document.createElement("h3");
        heading.textContent = name;
        panel.appendChild(heading);

        let review = null;
        try {
            review = await getAIReviewRecord(name);
        } catch (error) {
            const warning = document.createElement("p");
            warning.textContent = "Local review storage is unavailable: " + error.message;
            panel.appendChild(warning);
        }
        if (iconLibrarySelectedName !== name) return;

        const edits = review?.metadataEdits || {};
        const description = document.createElement("p");
        description.textContent = edits.description ?? baseRecord?.ai?.description ?? "No description has been added yet.";
        description.style.cssText = "font-size:13px;line-height:1.5;";
        panel.appendChild(description);

        const addList = (label, values) => {
            if (!Array.isArray(values) || !values.length) return;
            const title = document.createElement("strong");
            title.textContent = label;
            title.style.cssText = "display:block;margin:12px 0 6px;font-size:12px;";
            const value = document.createElement("p");
            value.textContent = values.join(", ");
            value.style.cssText = "font-size:12px;line-height:1.5;margin:0;";
            panel.append(title, value);
        };
        addList("Official Lucide categories", baseRecord?.lucide?.categories);
        addList("Tags", edits.tags ?? baseRecord?.lucide?.tags);
        addList("Use cases", edits.useCases ?? baseRecord?.lucide?.useCases);
        addList("Contributors", edits.contributors ?? baseRecord?.lucide?.contributors);
        addList("Search terms", edits.searchTerms ?? getExpandedIconSearchTerms(name, baseRecord));

        const divider = document.createElement("hr");
        divider.style.cssText = "border:0;border-top:1px solid var(--border-subtle);margin:16px 0;";
        panel.appendChild(divider);
        const metadataTitle = document.createElement("h4");
        metadataTitle.textContent = "Editable metadata";
        panel.appendChild(metadataTitle);
        createMetadataEditor(panel, name, review, baseRecord);

        const reviewTitle = document.createElement("h4");
        reviewTitle.textContent = "Category review";
        reviewTitle.style.marginTop = "18px";
        panel.appendChild(reviewTitle);

        const official = baseRecord?.lucide?.categories || review?.officialCategories || [];
        const suggestions = review?.aiSuggestions || [];
        if (!review?.aiSuggestions?.length) {
            const note = document.createElement("p");
            note.textContent = "No AI analysis is saved for this icon yet. Official categories and your own categories can still be selected here.";
            note.style.cssText = "font-size:12px;opacity:.8;";
            panel.appendChild(note);
        }

        const selected = new Set(Array.isArray(review?.manualCategories)
            ? review.manualCategories : official);
        const checkboxes = [];
        const group = document.createElement("div");
        group.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;";
        const addCategory = (value, source) => {
            if (!value || checkboxes.some(input => input.value === value)) return;
            const label = document.createElement("label");
            label.style.cssText = "display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid var(--border-subtle);border-radius:18px;font-size:12px;";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = value;
            input.checked = selected.has(value);
            const text = document.createElement("span");
            text.textContent = value + (source ? " · " + source : "");
            label.append(input, text);
            group.appendChild(label);
            checkboxes.push(input);
        };
        official.forEach(value => addCategory(value, "Lucide"));
        suggestions.forEach(item => addCategory(item.name, "AI suggestion"));
        panel.appendChild(group);

        const customRow = document.createElement("div");
        customRow.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;";
        const customInput = document.createElement("input");
        customInput.type = "text";
        customInput.placeholder = "Add your own category";
        customInput.style.cssText = "flex:1;min-width:160px;padding:8px;border:1px solid var(--border-subtle);border-radius:7px;background:transparent;color:inherit;";
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = "Add category";
        addButton.className = "btn btn-secondary";
        addButton.addEventListener("click", () => {
            const value = customInput.value.trim();
            if (!value) return;
            addCategory(value, "Manual");
            const added = checkboxes.find(input => input.value === value);
            if (added) added.checked = true;
            customInput.value = "";
        });
        customRow.append(customInput, addButton);
        panel.appendChild(customRow);

        const saveCategories = document.createElement("button");
        saveCategories.type = "button";
        saveCategories.className = "btn btn-primary";
        saveCategories.textContent = "Save selected categories";
        saveCategories.addEventListener("click", async () => {
            saveCategories.disabled = true;
            try {
                const latest = await getAIReviewRecord(name) || {
                    name, officialCategories: official, aiSuggestions: [],
                    analyzedAt: null, reviewedAt: null, manualCategories: null
                };
                const chosenCategories = [...new Set(checkboxes.filter(input => input.checked).map(input => input.value))];
                if (!chosenCategories.length) {
                    showToast("Select at least one category before saving.", "error");
                    return;
                }
                latest.manualCategories = chosenCategories;
                latest.reviewedAt = new Date().toISOString();
                await saveAIReviewRecord(latest);
                showToast("Category choices saved locally for " + name + ".", "success");
            } catch (error) {
                showToast("Could not save categories: " + error.message, "error");
            } finally {
                saveCategories.disabled = false;
            }
        });
        panel.appendChild(saveCategories);
    }

    // Keep AI-only category suggestions conservative in the editor too.
    // Official Lucide categories remain authoritative; AI candidates need
    // corroborating words from the icon's official metadata.
    function isSupportedAICategorySuggestion(iconName, suggestion, baseRecord) {
        if (!suggestion || !suggestion.name || Number(suggestion.score) < 0.52) return false;
        const lucide = baseRecord?.lucide || {};
        const tokens = new Set([
            String(iconName || "").replace(/[-_]/g, " "),
            ...(lucide.tags || []),
            ...(lucide.useCases || []),
            ...((lucide.aliases || []).map(alias => alias.name || ""))
        ].join(" ").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(token => token.length >= 4));
        const category = suggestion.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/)
            .filter(token => token.length >= 4 && !["icons", "icon", "with", "from", "into"].includes(token));
        if (category.some(token => tokens.has(token))) return true;
        const categoryData = window.ICON_CATEGORY_DATA;
        if (!Array.isArray(categoryData)) return false;
        const definition = categoryData.find(item => item.name === suggestion.name)?.description || "";
        const overlap = definition.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/)
            .filter(token => token.length >= 4 && tokens.has(token));
        return overlap.length >= 2;
    }

    function renderDrawerSearchTerms(terms = []) {
        if (!projectSearchTerms) return;

        const cleanTerms = [...new Set(terms.map(term => String(term).trim()).filter(Boolean))];
        const expanded = projectSearchTerms.dataset.expanded === "true";
        const visibleLimit = 3;
        const canExpand = cleanTerms.length > visibleLimit;
        const termsToShow = expanded || !canExpand
            ? cleanTerms
            : cleanTerms.slice(0, visibleLimit);

        projectSearchTerms.replaceChildren();
        projectSearchTerms.classList.toggle("is-expanded", expanded && canExpand);

        termsToShow.forEach(term => {
            const chip = document.createElement("span");
            chip.className = "project-search-term";
            chip.textContent = term;
            projectSearchTerms.appendChild(chip);
        });

        if (canExpand) {
            const more = document.createElement("button");
            more.type = "button";
            more.className = "project-search-more";
            more.textContent = expanded ? "Show less" : `+${cleanTerms.length - visibleLimit} more`;
            more.setAttribute("aria-expanded", String(expanded));
            more.addEventListener("click", () => {
                projectSearchTerms.dataset.expanded = expanded ? "false" : "true";
                renderDrawerSearchTerms(cleanTerms);
            });
            projectSearchTerms.appendChild(more);
        }
    }

    async function renderIconMetadataDetails(project) {
        if (!project || !projectSearchTerms) return;

        document.getElementById("icon-ai-metadata-panel")?.remove();

        try {
            const [metadata, review] = await Promise.all([
                loadIconMetadata().catch(() => ({})),
                getAIReviewRecord((project.name || "").trim().toLowerCase().replace(/\s+/g, "-")).catch(() => null)
            ]);
            if (selectedHomeProject !== project) return;

            const iconName = normalizeHomeSearchIconName(project.name);
            // Make the freshly loaded manual edits available to the same
            // complete term builder used by homepage search.
            if (review) {
                homeSearchReviewByName.set(iconName, review);
                homeSearchProfileCache.clear();
            }

            // Use the exact same metadata pipeline as homepage search. This
            // includes official tags, AI terms, manual edits, curated terms,
            // related synonyms, inherited variant metadata and categories.
            const terms = getProjectSearchTerms(project);

            project.searchTerms = terms;
            renderDrawerSearchTerms(terms);

            if (projectCategoryBadge) {
                renderProjectCategoryBadges(project);
            }
        } catch (error) {
            console.warn("Could not enrich drawer search terms:", error);
        }
    }

    // Load official metadata once so category fallback and search terms are
    // available throughout the home gallery, not only after opening a drawer.
    loadIconMetadata().then(() => {
        projectManager.projects.forEach(project => {
            if (project.status !== "finished") return;
            if (!Array.isArray(project.manualCategories) || !project.manualCategories.length) {
                refreshProjectAutomaticCategories(project);
            }
        });
        renderHomeProjects();
    }).catch(error => console.warn("Official icon metadata unavailable:", error));

    function showProjectPreview(project) {
        if (!project || !projectDetails) return;

        selectedHomeProject = project;
        updateHomeProjectSelection();
        if (projectRelated) projectRelated.hidden = true;
        projectRelatedPage?.classList.remove("show");
        projectRelatedPage?.setAttribute("aria-hidden", "true");

        if (projectName) projectName.textContent = project.name || "Untitled icon";
        if (projectCategoryBadge) {
            projectCategoryBadge.dataset.expanded = "false";
            renderProjectCategoryBadges(project);
        }
        ensureProjectCategoryEditor();
        if (projectDateBadge) projectDateBadge.textContent = `Saved ${new Date(project.savedAt).toLocaleDateString()}`;

        const globalStroke = Number(globalStrokeWidth?.value) || 2;

        if (previewStrokeWidth) {
            previewStrokeWidth.value = globalStroke;
        }

        if (previewStrokeValue) {
            previewStrokeValue.textContent = globalStroke.toFixed(1);
        }

        if (projectPreviewImage) {
            projectPreviewImage.src = getPreviewSVG(project, globalStroke);
        }

        if (projectFavoriteBtn) {
            projectFavoriteBtn.classList.toggle("active", project.favorite === true);
            projectFavoriteBtn.innerHTML = project.favorite ? "★" : "☆";
        }

        // Render search tags
        if (projectSearchTerms) {
            projectSearchTerms.dataset.expanded = "false";
            renderDrawerSearchTerms(getProjectSearchTerms(project));
        }

        if (projectMoreSearchButton) {
            projectMoreSearchButton.title = `More icons with "${project.name}" in their name`;
        }

        renderRelatedProjects(project);
        renderIconMetadataDetails(project);

        projectDetails.classList.add("show");
        projectDetails.setAttribute("aria-hidden", "false");
    }

    function closeProjectPreview() {
        projectDetails?.classList.remove("show");
        projectSearchTerms && (projectSearchTerms.dataset.expanded = "false");
        projectDetails?.setAttribute("aria-hidden", "true");

        projectRelatedPage?.classList.remove("show");
        projectRelatedPage?.setAttribute("aria-hidden", "true");
        if (projectRelated) projectRelated.hidden = true;

        selectedHomeProject = null;
        updateHomeProjectSelection();
    }

    projectDetailsClose?.addEventListener("click", closeProjectPreview);
    // Open the Similar Icons page from behind the fixed preview drawer.
    projectMoreSearchButton?.addEventListener("click", () => {
        if (!selectedHomeProject || !projectDetails || !projectRelated || !projectRelatedPage) return;

        projectRelated.hidden = false;
        projectRelatedPage.scrollTop = 0;
        projectRelatedPage.classList.add("show");
        projectRelatedPage.setAttribute("aria-hidden", "false");
    });
    document.getElementById("project-global-preview-button")?.addEventListener("click", () => {
        const sidebarScroll = document.querySelector(".sidebar-scroll-area");
        const globalPreview = document.querySelector(".sidebar-customization");
        if (!sidebarScroll || !globalPreview) return;
        sidebarScroll.scrollTo({ top: 0, behavior: "smooth" });
        globalPreview?.classList.add("global-preview-focus");
        window.setTimeout(() => globalPreview?.classList.remove("global-preview-focus"), 900);
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
        remix.manualCategories = Array.isArray(sourceProject.manualCategories) ? [...sourceProject.manualCategories] : null;
        remix.autoCategories = [...getProjectCategories(sourceProject)];
        remix.categories = [...getProjectCategories(sourceProject)];
        remix.categorySource = sourceProject.categorySource || "automatic";
        remix.category = remix.categories[0] || "Uncategorized";
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

        const project = selectedHomeProject;
        const name = project.name || "Untitled icon";

        if (!deleteConfirmModal || !deleteTargetProjectName || !deleteConfirmBtn || !deleteCancelBtn) {
            showToast("Delete confirmation dialog is unavailable", "error");
            return;
        }

        if (deleteConfirmTitle) deleteConfirmTitle.textContent = "Delete Icon";
        deleteTargetProjectName.textContent = name;
        deleteConfirmBtn.textContent = "Delete Icon";
        deleteConfirmModal.style.display = "flex";
        deleteConfirmModal.classList.add("show");

        const closeDeleteDialog = () => {
            deleteConfirmModal.style.display = "none";
            deleteConfirmModal.classList.remove("show");
        };

        deleteConfirmBtn.onclick = () => {
            closeDeleteDialog();
            projectManager.projects = projectManager.projects.filter(p => p.id !== project.id);
            saveProjectManager();
            closeProjectPreview();
            renderHomeProjects();
            showToast(`Deleted "${name}"`, "info");
        };

        deleteCancelBtn.onclick = closeDeleteDialog;
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

        const galleryIcon = `
        <svg width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    `;

        const editorIcon = `
        <svg xmlns="http://www.w3.org/2000/svg"
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M10.584 21H5a2 2 0 01-2-2v-9a2 2 0 01.709-1.527l7-6a2 2 0 012.582 0l7 6A2 2 0 0121 10.001v.583" />
            <path d="M14 12H10a1 1 0 00-1 1v8" />
            <path d="m14.305 19.53.923-.382" />
            <path d="m15.229 16.852-.924-.383" />
            <path d="m16.852 15.228-.383-.923" />
            <path d="m16.852 20.773-.383.924" />
            <path d="m19.148 15.228.383-.923" />
            <path d="m19.53 21.697-.382-.924" />
            <path d="m20.773 16.852.922-.383" />
            <path d="m20.773 19.148.922.383" />
            <circle cx="18" cy="18" r="3" />
        </svg>
    `;

        homeButton.innerHTML = isGallery
            ? `${editorIcon}<span>Editor</span>`
            : `${galleryIcon}<span>Gallery</span>`;

        homeButton.title = isGallery
            ? "Return to Icon Editor"
            : "Open Icon Gallery";
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
        } else if (viewName === "icon-library") {
            renderIconLibraryView();
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
            meta.textContent = `${getProjectCategories(project).join(", ")} • ${new Date(project.savedAt).toLocaleDateString()}`;

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
                        if (deleteConfirmTitle) deleteConfirmTitle.textContent = "Delete Finished Project";
                        deleteConfirmBtn.textContent = "Delete Project";
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

   let finishCategoryManuallyChanged = false;

finishProjectButton?.addEventListener("click", () => {
    if (!finishModal) return;

    const activeProject = projectManager.projects.find(
        p => p.id === projectManager.activeProjectId
    );

    finishIconName.value = activeProject?.name || "";

    finishCategoryManuallyChanged = false;

    const savedCategories = getProjectCategories(activeProject);
    finishCategoryManuallyChanged = Array.isArray(activeProject?.manualCategories) &&
        activeProject.manualCategories.length > 0;
    populateFinishCategories(savedCategories);

    const savedColorOption = activeProject?.finishStrokeColor || "original";

    const colorRadio = document.querySelector(
        `input[name="finish-style-choice"][value="${savedColorOption}"]`
    );

    if (colorRadio) colorRadio.checked = true;

    finishModal.classList.add("show");
    finishIconName.focus();
});

// Update automatic suggestions when the icon name changes.
finishIconName?.addEventListener("input", () => {
    if (finishCategoryManuallyChanged) return;
    populateFinishCategories(detectIconCategories(finishIconName.value));
});

// Any manual checkbox change takes priority.
finishIconCategory?.addEventListener("change", event => {
    if (event.target.matches('input[type="checkbox"]')) {
        finishCategoryManuallyChanged = true;
    }
});

// Add a custom category.
document.getElementById("add-custom-category")?.addEventListener("click", () => {
    const categoryName = prompt("Enter your new category name:");

    if (categoryName === null) return;

    if (!saveCustomCategory(categoryName)) {
        showToast("Category is empty or already exists.", "error");
        return;
    }

    const selectedCategories = getSelectedFinishCategories();
    selectedCategories.push(categoryName.trim());

    populateFinishCategories(selectedCategories);
    finishCategoryManuallyChanged = true;

    showToast("Custom category added successfully!", "success");
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

const selectedCategories = getSelectedFinishCategories();

if (selectedCategories.length === 0) {
    showToast("Please select at least one category.", "error");
    return;
}

activeProject.name = name;

if (finishCategoryManuallyChanged) {
    setProjectManualCategories(activeProject, selectedCategories);
} else {
    activeProject.manualCategories = null;
    refreshProjectAutomaticCategories(activeProject);
}
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
        if (event.altKey && key === "s") {
            event.preventDefault();
            toggleSnapping();
            return;
        }

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
            if (selectedCustomAxisGroupId) duplicateCustomAxisGroup();
            else duplicateSelectedShapes();
            return;
        }

        if (ctrl && key === "c") {
            if (copyCustomAxisGroup()) { event.preventDefault(); return; }
            event.preventDefault(); copySelectedShapes(); return;
        }

        if (ctrl && key === "v") {
            event.preventDefault();
            if (!pasteCustomAxisGroup()) pasteCopiedShapes();
            return;
        }

        if (event.key === "Delete" || event.key === "Backspace") {
            if (deleteSelectedCustomAxisGroup()) { event.preventDefault(); return; }
            deleteButton?.click(); return;
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
