
// =====================================
// 1. GET OUR HTML ELEMENTS
// =====================================

const tools = document.querySelectorAll(".tool");
const workspace = document.getElementById("workspace");
const layerList = document.getElementById("layer-list");
const layerCount = document.getElementById("layer-count");
const pathStyleToggle = document.getElementById("path-style-toggle");
// =====================================
// SMART ALIGNMENT GUIDES
// =====================================
const SVG_NS = "http://www.w3.org/2000/svg";

// =====================================
// HOME APPEARANCE: THEME + ACCENT COLOR
// =====================================

const themeToggle = document.getElementById("theme-toggle");
const themeToggleKnob = themeToggle?.querySelector(".theme-toggle-knob");
const accentSwatches = document.querySelectorAll(".accent-swatch[data-accent]");

const THEME_STORAGE_KEY = "iconMakerTheme";
const ACCENT_STORAGE_KEY = "iconMakerAccent";
const DEFAULT_ACCENT = "#ff0077";
const ALLOWED_ACCENTS = [
    "#ff0077",
    "#a200ff",
    "#0084ff",
    "#00ffee",
    "#00ff73",
    "#a6ff00",
    "#f56565",
    "#ff0000"
];

function applyTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("light-theme", isLight);

    if (themeToggleKnob) {
        themeToggleKnob.textContent = isLight ? "☀" : "☾";
    }

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            isLight ? "Switch to dark theme" : "Switch to light theme"
        );
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
    const safeColor = ALLOWED_ACCENTS.includes(normalizedColor)
        ? normalizedColor
        : DEFAULT_ACCENT;

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

// Restore appearance preferences. Defaults: dark theme and pink accent.
let savedTheme = "dark";
let savedAccent = DEFAULT_ACCENT;

try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) === "light"
        ? "light"
        : "dark";
    savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT;
} catch (error) {
    console.warn("Could not read appearance preferences:", error);
}

applyTheme(savedTheme);
applyAccentColor(savedAccent);
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
function getAlignmentBounds(shape) {

    if (shape.type === "circle") {
        return {
            left: shape.cx - shape.radius,
            right: shape.cx + shape.radius,
            top: shape.cy - shape.radius,
            bottom: shape.cy + shape.radius
        };
    }

    if (shape.type === "rectangle") {
        return {
            left: shape.x,
            right: shape.x + shape.width,
            top: shape.y,
            bottom: shape.y + shape.height
        };
    }

    if (shape.type === "line") {
        return {
            left: Math.min(shape.x1, shape.x2),
            right: Math.max(shape.x1, shape.x2),
            top: Math.min(shape.y1, shape.y2),
            bottom: Math.max(shape.y1, shape.y2)
        };
    }

    if (shape.type === "curve") {
        return {
            left: shape.cx - shape.radius,
            right: shape.cx + shape.radius,
            top: shape.cy - shape.radius,
            bottom: shape.cy + shape.radius
        };
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

    const movingX = [
        movingBounds.left,
        (movingBounds.left + movingBounds.right) / 2,
        movingBounds.right
    ];

    const movingY = [
        movingBounds.top,
        (movingBounds.top + movingBounds.bottom) / 2,
        movingBounds.bottom
    ];

    const targetsX = [0, 12, 24];
    const targetsY = [0, 12, 24];

    shapes.forEach(otherShape => {

        if (otherShape === movingShape) return;

        const bounds = getAlignmentBounds(otherShape);

        if (!bounds) return;

        targetsX.push(
            bounds.left,
            (bounds.left + bounds.right) / 2,
            bounds.right
        );

        targetsY.push(
            bounds.top,
            (bounds.top + bounds.bottom) / 2,
            bounds.bottom
        );

    });

    const tolerance = 0.12;

    const verticalMatch = movingX.find(value =>
        targetsX.some(target => Math.abs(value - target) <= tolerance)
    );

    const horizontalMatch = movingY.find(value =>
        targetsY.some(target => Math.abs(value - target) <= tolerance)
    );

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
const propertiesSelection =
    document.getElementById("properties-selection");

const propertiesFields =
    document.getElementById("properties-fields");
// =====================================
// FINISH PROJECT ELEMENTS
// =====================================

const finishProjectButton =
    document.getElementById("finish-project-button");

const finishModal =
    document.getElementById("finish-modal");

const finishIconName =
    document.getElementById("finish-icon-name");
const finishIconCategory =
    document.getElementById("finish-icon-category");

const finishCancel =
    document.getElementById("finish-cancel");

const finishConfirm =
    document.getElementById("finish-confirm");

// =====================================
// PROJECT SAVE / BROWSER AUTOSAVE
// =====================================

const PROJECT_STORAGE_KEY = "iconMakerProject"; // Old save key
const PROJECTS_STORAGE_KEY = "iconMakerProjects";
const PROJECT_FORMAT_VERSION = 1;

let isRestoringProject = false;

// Multi-project manager
let projectManager = {
    activeProjectId: null,
    projects: []
};

function getProjectData() {
    return {
        version: PROJECT_FORMAT_VERSION,
        savedAt: new Date().toISOString(),

        selectedShapeIndex: shapes.indexOf(selectedShape),

        settings: {
            showCoordinates: document.getElementById("show-coordinates").checked,
            showGridHighlight: gridHighlightToggle.checked,
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

        // Migrate the old single-project save
        const oldSave = localStorage.getItem(PROJECT_STORAGE_KEY);

        const firstProject = createProject(
            oldSave ? JSON.parse(oldSave) : null
        );

        projectManager = {
            activeProjectId: firstProject.id,
            projects: [firstProject]
        };

        saveProjectManager();
    } catch (error) {
        console.error("Could not load projects:", error);
    }
}

function saveProjectManager() {
    try {
        localStorage.setItem(
            PROJECTS_STORAGE_KEY,
            JSON.stringify(projectManager)
        );
    } catch (error) {
        console.error("Could not save projects:", error);
    }
}

function saveProjectToBrowser() {
    if (isRestoringProject) return;

    try {
        let activeProject = projectManager.projects.find(
            project => project.id === projectManager.activeProjectId
        );

        if (!activeProject) {
            activeProject = createProject();
            projectManager.projects.push(activeProject);
            projectManager.activeProjectId = activeProject.id;
        }

        activeProject.data = getProjectData();
        activeProject.savedAt = new Date().toISOString();

        saveProjectManager();

    } catch (error) {
        console.error("Could not autosave:", error);
    }
}
// =====================================
// PROJECT SWITCHING
// =====================================

function resetProjectHistory() {
    history = [getHistorySnapshot()];
    historyIndex = 0;
    updateHistoryButtons();
}

function createNewProject() {
    // Save the current project before switching
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
}

function switchProject(projectId) {
    const targetProject = projectManager.projects.find(
        project => project.id === projectId
    );

    if (!targetProject) return;
    saveProjectToBrowser();

    projectManager.activeProjectId = projectId;
    saveProjectManager();

    const restored = restoreProjectFromBrowser();

    if (!restored) {
        console.error("Project restoration failed:", targetProject);
        return false;
    }

    resetProjectHistory();
    renderUnfinishedProjects();

    return true;
}
// =====================================
// UNFINISHED PROJECT LIST
// =====================================

function renderUnfinishedProjects() {
    const list = document.getElementById("unfinished-project-list");

    if (!list) return;

    const unfinishedProjects = projectManager.projects.filter(
        project => project.status === "unfinished" &&
            project.id !== projectManager.activeProjectId
    );

    if (unfinishedProjects.length === 0) {
        list.innerHTML = `<p class="dropdown-empty">No unfinished projects</p>`;
        return;
    }

    list.innerHTML = "";

    unfinishedProjects.forEach(project => {
        const button = document.createElement("button");

        button.textContent = project.name;
        button.addEventListener("click", () => {
            switchProject(project.id);
            document.getElementById("file-dropdown").classList.remove("show");
        });

        list.appendChild(button);
    });
}
// =====================================
// RENDER FINISHED PROJECTS ON HOME
// =====================================

function renderHomeProjects() {

    const homeProjectGrid = document.getElementById("home-project-grid");
    const categorySelect = document.getElementById("home-category-select");

    if (!homeProjectGrid) return;

    homeProjectGrid.innerHTML = "";

    let finishedProjects = projectManager.projects.filter(
        project => project.status === "finished"
    );

    const searchValue = homeSearchInput.value.trim().toLowerCase();
    const sortValue = document.getElementById("home-sort-select")?.value || "newest";
    const categoryValue = categorySelect?.value || "all";


    // =====================================
    // POPULATE CATEGORY OPTIONS
    // =====================================

    if (categorySelect) {

        const previousCategory = categorySelect.value;

        const categories = [...new Set(
            finishedProjects.map(project =>
                (project.category || "Uncategorized").trim()
            )
        )].sort((a, b) => a.localeCompare(b));

        categorySelect.innerHTML = `<option value="all">All categories</option>`;

        categories.forEach(category => {

            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;

            categorySelect.appendChild(option);

        });

        categorySelect.value = categories.includes(previousCategory)
            ? previousCategory
            : "all";
    }


    // =====================================
    // CATEGORY FILTER
    // =====================================

    const activeCategory = categorySelect?.value || "all";

    if (activeCategory !== "all") {

        finishedProjects = finishedProjects.filter(project =>
            (project.category || "Uncategorized").trim() === activeCategory
        );

    }


    // =====================================
    // SEARCH
    // =====================================

    if (searchValue) {

        const searchWords = searchValue.split(/\s+/);

        finishedProjects = finishedProjects.filter(project => {

            const name = (project.name || "").toLowerCase();
            const category = (project.category || "").toLowerCase();

            const terms = getProjectSearchTerms(project)
                .join(" ")
                .toLowerCase();

            const searchableText = `${name} ${category} ${terms}`;

            return searchWords.every(word =>
                searchableText.includes(word)
            );

        });

    }


    // =====================================
    // SORTING
    // =====================================

    finishedProjects.sort((a, b) => {

        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();

        const dateA = Date.parse(a.savedAt || "") || 0;
        const dateB = Date.parse(b.savedAt || "") || 0;

        switch (sortValue) {

            case "newest":
                return dateB - dateA;

            case "oldest":
                return dateA - dateB;

            case "az":
                return nameA.localeCompare(nameB);

            case "za":
                return nameB.localeCompare(nameA);

            default:
                return dateB - dateA;
        }

    });


    // =====================================
    // EMPTY STATE
    // =====================================

    if (finishedProjects.length === 0) {

        const message = searchValue
            ? `No icons found for "${searchValue}".`
            : "No icons found in this category.";

        homeProjectGrid.innerHTML = `
            <p class="home-no-results">${message}</p>
        `;

        return;
    }


    // =====================================
    // RENDER PROJECT CARDS
    // =====================================

    finishedProjects.forEach(project => {

        const button = document.createElement("button");

        button.className = "home-project-card";
        button.type = "button";

        button.dataset.projectId = project.id;
        button.dataset.name = project.name || "Untitled project";

        // ICON TILE
        const preview = document.createElement("div");
        preview.className = "home-project-preview";


        if (project.thumbnail) {

            const image = document.createElement("img");

            image.src =
                "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(project.thumbnail);

            image.alt = "";

            preview.appendChild(image);

        } else {

            preview.textContent = "✦";

        }


        // HOVER NAME
        const name = document.createElement("span");

        name.className = "home-project-name";
        name.textContent = project.name || "Untitled icon";


        button.appendChild(preview);
        button.appendChild(name);

        homeProjectGrid.appendChild(button);

    });

}
const homeSearchInput = document.getElementById("home-search-input");

// LIVE SEARCH
homeSearchInput?.addEventListener("input", () => {
    renderHomeProjects();
});


// SORTING
const homeSortSelect = document.getElementById("home-sort-select");

homeSortSelect?.addEventListener("change", () => {
    renderHomeProjects();
});


// CLEAR SEARCH WITH ESCAPE
homeSearchInput?.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        homeSearchInput.value = "";

        renderHomeProjects();

        homeSearchInput.blur();

    }

});
// =====================================
// FINISH PROJECT
// =====================================

// Open the naming popup
finishProjectButton?.addEventListener("click", () => {

    if (!finishModal) return;

    finishIconName.value = "";
    finishIconCategory.value = "General";

    finishModal.classList.add("show");

    finishIconName.focus();

});


// Cancel finishing
finishCancel?.addEventListener("click", () => {

    finishModal.classList.remove("show");

});


// Confirm finishing
finishConfirm?.addEventListener("click", () => {

    const projectName = finishIconName.value.trim();

    if (!projectName) {

        finishIconName.focus();
        finishIconName.placeholder = "Please enter an icon name";

        return;
    }

    // Save the latest drawing first
    saveProjectToBrowser();

    const activeProject = projectManager.projects.find(
        project =>
            project.id === projectManager.activeProjectId
    );

    if (!activeProject) return;

    // Give the project its name
    activeProject.name = projectName;

    // Save its category
    activeProject.category = finishIconCategory.value;

    // Save an SVG preview for the Home tile
    activeProject.thumbnail = generateSVG();

    // Mark it as finished
    activeProject.status = "finished";

    activeProject.savedAt = new Date().toISOString();

    // Save everything
    saveProjectManager();

    // Refresh both project lists
    renderHomeProjects();
    renderUnfinishedProjects();

    // Close popup
    finishModal.classList.remove("show");

    // Return to Home
    homeScreen.classList.add("show");

});


// Press Enter to finish
finishIconName?.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        finishConfirm.click();
    }

});


// Close popup when clicking outside the dialog
finishModal?.addEventListener("click", event => {

    if (event.target === finishModal) {
        finishModal.classList.remove("show");
    }

});

function downloadProjectFile() {
    const blob = new Blob(
        [JSON.stringify(getProjectData(), null, 2)],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "my-icon-project.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function restoreProjectFromBrowser() {
    const activeProject = projectManager.projects.find(
        project => project.id === projectManager.activeProjectId
    );

    if (!activeProject || !activeProject.data) return false;

    try {
        const projectData = activeProject.data;
        // Restore editor settings
        if (projectData.settings) {
            document.getElementById("show-coordinates").checked =
                projectData.settings.showCoordinates ?? false;

            gridHighlightToggle.checked =
                projectData.settings.showGridHighlight ?? false;

            pathStyleToggle.checked =
                (projectData.settings.pathStyle ?? "straight") === "curve";

            gridHoverMarker.style.display = "none";
        }

        if (
            projectData.version !== PROJECT_FORMAT_VERSION ||
            !Array.isArray(projectData.shapes)
        ) {
            throw new Error("Invalid project file.");
        }

        isRestoringProject = true;

        shapes.forEach(shape => {
            getShapeElements(shape).forEach(element => element.remove());

            shape.handles?.forEach(handle => handle.remove());
        });

        shapes = [];
        selectedShape = null;
        selectedShapes = [];

        projectData.shapes.forEach(data => {
            const shape = createShapeFromCopy(data);

            if (shape) {

                // Restore hidden layer visibility
                getShapeElements(shape).forEach(element => {
                    element.style.visibility =
                        shape.hidden ? "hidden" : "visible";
                });
            }
        });

        // Restore previously selected shape
        const savedIndex = projectData.selectedShapeIndex;

        if (
            Number.isInteger(savedIndex) &&
            savedIndex >= 0 &&
            savedIndex < shapes.length &&
            !shapes[savedIndex].hidden
        ) {
            selectShape(shapes[savedIndex]);
        } else {
            selectShape(null);
        }

        updateMeasurementPanel();
        updatePropertiesPanel();
        renderLayers();
        updateSVGSource();

        isRestoringProject = false;
        return true;

    } catch (error) {
        isRestoringProject = false;
        console.error("Could not restore project:", error);
        return false;
    }
}
// =====================================
// 2. SVG SETTINGS
// =====================================


let shapes = [];
let pathDrawing = null;
let selectedShape = null;
let selectedShapes = [];

let dragging = null;
let draggingTool = null;
let dropPreview = null;

// =====================================
// COPY / PASTE STORAGE
// =====================================

let copiedShapes = [];

const COPY_OFFSET = 0.8;


// =====================================
// UNDO / REDO HISTORY
// =====================================

const undoButton = document.getElementById("undo-btn");
const redoButton = document.getElementById("redo-btn");

const HISTORY_LIMIT = 50;

let history = [];
let historyIndex = -1;
let historyBeforeAction = null;

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

        selectedShape: snapshot.shapes.findIndex(
            item => item.shape === snapshot.selectedShape
        ),

        selectedShapes: snapshot.selectedShapes.map(shape =>
            snapshot.shapes.findIndex(item => item.shape === shape)
        )
    });
}

function updateHistoryButtons() {
    if (undoButton) {
        undoButton.disabled = historyIndex <= 0;
    }

    if (redoButton) {
        redoButton.disabled = historyIndex >= history.length - 1;
    }
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
}

function getShapeElements(shape) {
    if (shape.type === "line") {
        return [
            shape.hoverBg,
            shape.element,
            shape.guideBg,
            shape.guide,
            shape.hitLine
        ].filter(Boolean);
    }

    if (shape.type === "curve") {
        return [
            shape.element,
            shape.guideBg,
            shape.guide,
            shape.hitPath,
            shape.horizontalGuide,
            shape.angleGuide
        ].filter(Boolean);
    }

    return [shape.element].filter(Boolean);
}


function restoreHistorySnapshot(snapshot) {

    // =================================
    // 1. REMOVE CURRENT SVG ELEMENTS
    // =================================

    shapes.forEach(shape => {

        getShapeElements(shape).forEach(element => {
            element.remove();
        });

        shape.handles?.forEach(handle => {
            handle.remove();
        });

    });


    // =================================
    // 2. RESTORE SAVED SHAPE DATA
    // =================================

    snapshot.shapes.forEach(item => {

        Object.keys(item.shape).forEach(key => {

            if (!shapeDOMKeys.has(key)) {
                delete item.shape[key];
            }

        });

        Object.assign(
            item.shape,
            cloneHistoryValue(item.data)
        );

    });


    // =================================
    // 3. RESTORE SHAPE ORDER
    // =================================

    shapes.length = 0;

    snapshot.shapes.forEach(item => {
        shapes.push(item.shape);
    });


    // =================================
    // 4. RESTORE SVG ELEMENTS
    // =================================

    shapes.forEach(shape => {

        getShapeElements(shape).forEach(element => {
            workspace.appendChild(element);

            element.style.visibility =
                shape.hidden ? "hidden" : "visible";
        });

        // Restore stroke color on the actual SVG
        if (shape.element && shape.color) {
            shape.element.setAttribute("stroke", shape.color);
        }

    });


    // =================================
    // 5. RESTORE SELECTION
    // =================================

    selectedShape = snapshot.selectedShape;

    selectedShapes.length = 0;
    selectedShapes.push(...snapshot.selectedShapes);

    shapes.forEach(shape => {

        if (shape.element) {

            shape.element.classList.toggle(
                "is-selected",
                shape === selectedShape ||
                selectedShapes.includes(shape)
            );

        }

    });


    // =================================
    // 6. RESTORE GEOMETRY
    // =================================

    shapes.forEach(shape => {

        if (shape.type === "line") {
            updateLine(shape);
        }

        else if (shape.type === "curve") {
            updateCurve(shape);
        }

        else if (shape.type === "path") {

            const parts = getPathParts(shape);

            const pathData = parts
                .map(item =>
                    createPathData(item.points, item.curved)
                )
                .join(" ");

            shape.element.setAttribute("d", pathData);
            shape.element.setAttribute("fill", shape.fill || "none");
            shape.element.setAttribute("fill-rule", "evenodd");
            shape.element.setAttribute("stroke", shape.color);
            shape.element.setAttribute("stroke-width", shape.strokeWidth);

        }

        else {
            updateBasicShape(shape);

            // updateBasicShape doesn't restore stroke color
            shape.element.setAttribute("stroke", shape.color);
        }

    });
    // =================================
    // 6A. RESTORE FINAL STROKE STYLES
    // =================================

    shapes.forEach(shape => {

        if (!shape.element) return;

        // Restore the individual shape's saved color
        shape.element.setAttribute("stroke", shape.color);

        // Restore the individual shape's saved stroke width
        const strokeWidth = shape.type === "line"
            ? shape.width
            : shape.strokeWidth;

        if (strokeWidth !== undefined) {
            shape.element.setAttribute(
                "stroke-width",
                strokeWidth
            );
        }

    });


    // =================================
    // 7. REMOVE HANDLES FROM UNSELECTED SHAPES
    // =================================

    shapes.forEach(shape => {

        if (shape !== selectedShape && shape.handles) {

            shape.handles.forEach(handle => {
                handle.remove();
            });

            shape.handles = [];

        }

    });


    // =================================
    // 8. RESTORE SELECTED SHAPE HANDLES
    // =================================

    if (
        selectedShape &&
        !selectedShape.hidden &&
        !selectedShape.locked
    ) {

        if (selectedShape.type === "line") {
            updateHandles(selectedShape);
        }

        else if (selectedShape.type === "curve") {
            updateCurveHandles(selectedShape);
        }

        else {
            updateBasicShape(selectedShape);
        }

    }


    // =================================
    // 9. REFRESH EDITOR
    // =================================

    hideCenterGuides();
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
}

function redoAction() {
    if (historyIndex >= history.length - 1) return;

    historyIndex++;

    restoreHistorySnapshot(history[historyIndex]);

    updateHistoryButtons();
}

if (undoButton) {
    undoButton.addEventListener("click", undoAction);
}

if (redoButton) {
    redoButton.addEventListener("click", redoAction);
}



// =====================================
// 3. COLORS
// =====================================

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
    const palette = colorPalettes[type];
    const index = colorCounters[type] % palette.length;

    colorCounters[type]++;

    return palette[index];
}


// =====================================
// 4. DRAG TOOLS FROM LEFT PANEL
// =====================================

tools.forEach(function (tool) {

    tool.addEventListener("dragstart", function (event) {

        draggingTool = tool.dataset.tool;

        event.dataTransfer.setData("text/plain", draggingTool);

    });

    tool.addEventListener("dragend", function () {

        draggingTool = null;

        if (dropPreview) {
            dropPreview.remove();
            dropPreview = null;
        }

    });

});


// =====================================
// 5. ALLOW DROPPING + PREVIEW
// =====================================

workspace.addEventListener("dragover", function (event) {

    event.preventDefault();

    if (!draggingTool) return;

    const position = getSVGPosition(event);

    updateDropPreview(position.x, position.y);

});


workspace.addEventListener("dragleave", function (event) {

    if (!workspace.contains(event.relatedTarget)) {

        if (dropPreview) {
            dropPreview.remove();
            dropPreview = null;
        }

    }

});


// =====================================
// 6. GET MOUSE POSITION IN SVG
// =====================================

function getSVGPosition(event) {

    const point = workspace.createSVGPoint();

    point.x = event.clientX;
    point.y = event.clientY;

    const svgPoint = point.matrixTransform(
        workspace.getScreenCTM().inverse()
    );

    return {
        x: Math.max(0, Math.min(24, svgPoint.x)),
        y: Math.max(0, Math.min(24, svgPoint.y))
    };

}
// =====================================
// 6B. WORKSPACE ZOOM
// =====================================

const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const zoomResetButton = document.getElementById("zoom-reset");
const zoomLevelText = document.getElementById("zoom-level");

let zoomLevel = 1;
let panX = 0;
let panY = 0;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;


function updateWorkspaceZoom() {

    const viewSize = 24 / zoomLevel;

    const maxPan = 24 - viewSize;

    panX = Math.max(0, Math.min(maxPan, panX));
    panY = Math.max(0, Math.min(maxPan, panY));

    workspace.setAttribute(
        "viewBox",
        `${panX} ${panY} ${viewSize} ${viewSize}`
    );

    zoomLevelText.textContent =
        `${Math.round(zoomLevel * 100)}%`;
}

zoomInButton.addEventListener("click", function () {

    zoomLevel = Math.min(
        MAX_ZOOM,
        zoomLevel + ZOOM_STEP
    );

    updateWorkspaceZoom();

});


zoomOutButton.addEventListener("click", function () {

    zoomLevel = Math.max(
        MIN_ZOOM,
        zoomLevel - ZOOM_STEP
    );

    updateWorkspaceZoom();

});


zoomResetButton.addEventListener("click", function () {

    zoomLevel = 1;

    panX = 0;
    panY = 0;

    updateWorkspaceZoom();

});
// =====================================
// 6C. TWO-FINGER WORKSPACE PANNING
// =====================================

const workspaceContainer = document.querySelector(
    ".workspace-container"
);


// =====================================
// 6C. WORKSPACE PAN + ALT ZOOM
// =====================================

workspaceContainer.addEventListener("wheel", function (event) {

    // ALT + TWO-FINGER SCROLL = ZOOM
    if (event.altKey) {

        event.preventDefault();

        const zoomFactor = Math.exp(-event.deltaY * 0.01);

        zoomLevel = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, zoomLevel * zoomFactor)
        );

        updateWorkspaceZoom();

        return;
    }

    // NORMAL TWO-FINGER SCROLL = PAN
    if (zoomLevel <= 1 || event.deltaMode !== 0) return;

    event.preventDefault();

    const viewSize = 24 / zoomLevel;
    const rect = workspace.getBoundingClientRect();

    panX += event.deltaX * (viewSize / rect.width);
    panY += event.deltaY * (viewSize / rect.height);

    updateWorkspaceZoom();

}, { passive: false });


// =====================================
// 6A. DROP PREVIEW
// =====================================


function updateDropPreview(x, y) {

    if (dropPreview) {
        dropPreview.remove();
        dropPreview = null;
    }

    const previewColor = "#83B5FF";

    // LINE
    if (draggingTool === "line") {

        dropPreview = document.createElementNS(SVG_NS, "line");

        dropPreview.setAttribute("x1", Math.max(0, x - 3));
        dropPreview.setAttribute("y1", y);
        dropPreview.setAttribute("x2", Math.min(24, x + 3));
        dropPreview.setAttribute("y2", y);
    }

    // CURVE
    else if (draggingTool === "curve") {

        dropPreview = document.createElementNS(SVG_NS, "path");

        dropPreview.setAttribute(
            "d",
            `M ${Math.max(0, x - 3)} ${y} A 3 3 0 0 1 ${Math.min(24, x + 3)} ${y}`
        );

        dropPreview.setAttribute("fill", "none");
    }

    // CIRCLE
    else if (draggingTool === "circle") {

        dropPreview = document.createElementNS(SVG_NS, "circle");

        dropPreview.setAttribute("cx", x);
        dropPreview.setAttribute("cy", y);
        dropPreview.setAttribute("r", "2.5");
        dropPreview.setAttribute("fill", "none");
    }

    // RECTANGLE
    else if (draggingTool === "rectangle") {

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
    dropPreview.setAttribute("filter", "drop-shadow(0 0 0.7px #83B5FF) drop-shadow(0 0 1.5px #397FEA)");

    dropPreview.classList.add("drop-preview");

    workspace.appendChild(dropPreview);

    bringHandlesToFront();
}



// =====================================
// 7. CREATE A LINE
// =====================================

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

        x1: Math.max(0, x - 3),
        y1: y,

        x2: Math.min(24, x + 3),
        y2: y,

        width: 2,
        cap: "round",

        color: color,

        element: line,
        hoverBg: hoverBg,
        guideBg: guideBg,
        guide: guide,

        // IMPORTANT: store the hit area on the shape
        hitLine: hitLine

    };

    // Blue glowing hover background
    hoverBg.setAttribute("stroke", "#60A5FA");
    hoverBg.setAttribute("stroke-width", "1.5");
    hoverBg.setAttribute("stroke-linecap", "round");
    hoverBg.setAttribute("opacity", "0.7");
    hoverBg.setAttribute(
        "filter",
        "drop-shadow(0 0 0.5px #60A5FA) drop-shadow(0 0 1.5px #3B82F6)"
    );
    hoverBg.setAttribute("pointer-events", "none");
    hoverBg.style.display = "none";


    // Main colored line
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", shape.width);
    line.setAttribute("stroke-linecap", shape.cap);
    line.setAttribute("pointer-events", "none");


    // Invisible body hit area
    hitLine.classList.add("line-hit-area");

    hitLine.setAttribute("stroke", "transparent");
    hitLine.setAttribute("stroke-width", "0.8");
    hitLine.setAttribute("stroke-linecap", "round");
    hitLine.setAttribute("pointer-events", "stroke");

    hitLine.style.pointerEvents = "stroke";
    hitLine.style.cursor = "move";
    // Background directly behind dashed guide
    guideBg.setAttribute("stroke", "#475569");
    guideBg.setAttribute("stroke-width", "0.8");
    guideBg.setAttribute("stroke-linecap", "round");
    guideBg.setAttribute("pointer-events", "none");
    guideBg.style.display = "none";


    // White dashed guide
    guide.setAttribute("stroke", "#FFFFFF");
    guide.setAttribute("stroke-width", "0.12");
    guide.setAttribute("stroke-dasharray", "0.35 0.25");
    guide.setAttribute("pointer-events", "none");


    // Hover events belong to the top hit area
    hitLine.addEventListener("pointerenter", function () {

        hoverBg.style.display = "block";
        guideBg.style.display = "block";

    });

    hitLine.addEventListener("pointerleave", function () {

        hoverBg.style.display = "none";
        guideBg.style.display = "none";

    });


    // Layer order
    workspace.appendChild(hoverBg);
    workspace.appendChild(line);
    workspace.appendChild(guideBg);
    workspace.appendChild(guide);
    workspace.appendChild(hitLine);


    shapes.push(shape);

    updateLine(shape);

    selectShape(shape);

}


// =====================================
// 8. CREATE OTHER BASIC SHAPES
// =====================================

function createOtherShape(type, x, y) {

    if (type === "curve") {
        createCurve(x, y);
        return;
    }

    const color = getNextColor(type);
    let element;

    if (type === "circle") {

        element = document.createElementNS(SVG_NS, "circle");

        element.setAttribute("cx", x);
        element.setAttribute("cy", y);
        element.setAttribute("r", "2.5");
        element.setAttribute("stroke", color);
        element.setAttribute("stroke-width", "2");
        element.setAttribute("stroke-linejoin", "round");
        element.setAttribute("fill", "none");

    }

    else if (type === "rectangle") {

        element = document.createElementNS(SVG_NS, "rect");

        element.setAttribute("x", Math.max(0, x - 2.5));
        element.setAttribute("y", Math.max(0, y - 2));
        element.setAttribute("width", "5");
        element.setAttribute("height", "4");
        element.setAttribute("stroke", color);
        element.setAttribute("stroke-width", "2");
        element.setAttribute("fill", "none");

    }

    else {
        return;
    }

    workspace.appendChild(element);

    const shape = {
        type: type,
        element: element,
        color: color,
        fill: "none",
        strokeWidth: 2,
        handles: []
    };

    if (type === "circle") {
        shape.cx = x;
        shape.cy = y;
        shape.radius = 2.5;
    }

    else {
        shape.x = Math.max(0, x - 2.5);
        shape.y = Math.max(0, y - 2);
        shape.width = 5;
        shape.height = 4;
    }
    shapes.push(shape);

    updateSVGSource();

    selectShape(shape);

}

// =====================================
// 8A. CREATE CURVE
// =====================================

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

        cx: x,
        cy: y,

        radius: 3,

        startAngle: Math.PI,
        endAngle: 0,

        color: color,
        strokeWidth: 2,

        element: path,
        hitPath: hitPath,

        guideBg: guideBg,
        guide: guide,

        handles: [],

        horizontalGuide: horizontalGuide,
        angleGuide: angleGuide

    };


    // Invisible body hit area
    hitPath.setAttribute("fill", "none");
    hitPath.setAttribute("stroke", "transparent");
    hitPath.setAttribute("stroke-width", "4");
    hitPath.setAttribute("stroke-linecap", "round");
    hitPath.setAttribute("pointer-events", "stroke");


    // Main colored curve
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("pointer-events", "none");


    // Background directly behind dashed guide
    guideBg.setAttribute("fill", "none");
    guideBg.setAttribute("stroke", "#334155");
    guideBg.setAttribute("stroke-width", "1.7");
    guideBg.setAttribute("stroke-linecap", "round");
    guideBg.setAttribute("pointer-events", "none");
    guideBg.style.display = "none";


    // White dashed guide
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", "#FFFFFF");
    guide.setAttribute("stroke-width", "0.12");
    guide.setAttribute("stroke-dasharray", "0.35 0.25");
    guide.setAttribute("pointer-events", "none");


    // Horizontal reference line
    horizontalGuide.setAttribute("stroke", "#FBBF24");
    horizontalGuide.setAttribute("stroke-width", "0.18");
    horizontalGuide.setAttribute("opacity", "0.8");
    horizontalGuide.setAttribute("stroke-dasharray", "0.4 0.3");
    horizontalGuide.setAttribute("pointer-events", "none");


    // Radial helper line
    angleGuide.setAttribute("stroke", "#FBBF24");
    angleGuide.setAttribute("stroke-width", "0.12");
    angleGuide.setAttribute("stroke-dasharray", "0.4 0.3");
    angleGuide.setAttribute("pointer-events", "none");


    horizontalGuide.style.display = "none";
    angleGuide.style.display = "none";


    // Hover events belong to the top hit area
    hitPath.addEventListener("pointerenter", function () {
        guideBg.style.display = "block";
    });

    hitPath.addEventListener("pointerleave", function () {
        guideBg.style.display = "none";
    });


    // Layer order
    workspace.appendChild(path);
    workspace.appendChild(guideBg);
    workspace.appendChild(guide);
    workspace.appendChild(hitPath);

    workspace.appendChild(horizontalGuide);
    workspace.appendChild(angleGuide);


    shapes.push(shape);

    updateCurve(shape);

    selectShape(shape);

}


// =====================================
// 9. SELECT SHAPES
// =====================================

function selectShape(shape, additive = false) {

    const oldPrimary = selectedShape;

    // Remove old primary shape handles
    if (oldPrimary) {
        oldPrimary.handles?.forEach(handle => handle.remove());
        oldPrimary.handles = [];
    }

    // NORMAL CLICK: Select only one shape
    if (!additive) {

        selectedShapes = shape ? [shape] : [];

        selectedShape = shape;

    }

    // SHIFT + CLICK: Add or remove a shape
    else {

        const index = selectedShapes.indexOf(shape);

        if (index !== -1) {

            // Already selected: remove it
            selectedShapes.splice(index, 1);

            // If it was the primary selection,
            // choose another selected shape
            if (selectedShape === shape) {
                selectedShape = selectedShapes.at(-1) || null;
            }

        }

        else {

            // Add new selection
            selectedShapes.push(shape);

            selectedShape = shape;

        }

    }

    // Update visual selection
    shapes.forEach(item => {

        item.element.classList.toggle(
            "is-selected",
            selectedShapes.includes(item)
        );

    });

    // Create handles for primary basic shape
    if (
        selectedShape &&
        !selectedShape.hidden &&
        !selectedShape.locked &&
        (selectedShape.type === "circle" ||
            selectedShape.type === "rectangle")
    ) {
        updateBasicShapeHandles(selectedShape);
    }

    updateMeasurementPanel();
    updatePropertiesPanel();
    renderLayers();

}


// =====================================
// 9A. RENDER LAYERS PANEL
// =====================================
function renderLayers() {

    layerCount.textContent = shapes.length;

    if (shapes.length === 0) {
        layerList.innerHTML = `
            <p class="empty-layers">No layers yet</p>
        `;
        return;
    }

    layerList.innerHTML = [...shapes]
        .map((shape) => {

            const index = shapes.indexOf(shape);

            const number = shapes
                .slice(0, index + 1)
                .filter(item => item.type === shape.type)
                .length;

            const defaultName =
                shape.type.charAt(0).toUpperCase() +
                shape.type.slice(1) +
                " " + number;

            if (!shape.name) {
                shape.name = defaultName;
            }
            if (shape.hidden === undefined) {
                shape.hidden = false;
            }
            if (shape.locked === undefined) {
                shape.locked = false;
            }

            const isSelected = selectedShapes.includes(shape);

            const safeName = String(shape.name)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

            return `
                <div
                    class="layer-item ${isSelected ? "active" : ""}"
                    data-layer-index="${index}"
                >
                    <span class="layer-name">${safeName}</span>

                    <span class="layer-type">${shape.type}</span>

<div class="layer-controls">

    <button
        class="layer-move-btn"
        data-layer-action="up"
        data-layer-index="${index}"
        type="button"
        title="Bring forward"
        ${index === shapes.length - 1 ? "disabled" : ""}
    >↑</button>

    <button
        class="layer-visibility-btn"
        data-layer-action="visibility"
        data-layer-index="${index}"
        type="button"
        title="${shape.hidden ? "Show layer" : "Hide layer"}"
    >
        ${shape.hidden ? "○" : "●"}
    </button>

    <button
        class="layer-lock-btn"
        data-layer-action="lock"
        data-layer-index="${index}"
        type="button"
        title="${shape.locked ? "Unlock layer" : "Lock layer"}"
    >
        <img
            src="${shape.locked ? 'assets/icons/unlocked.svg' : 'assets/icons/locked.svg'}"
            alt="${shape.locked ? 'Unlock' : 'Lock'}"
        >
    </button>

    <button
        class="layer-move-btn"
        data-layer-action="down"
        data-layer-index="${index}"
        type="button"
        title="Send backward"
        ${index === 0 ? "disabled" : ""}
    >↓</button>

</div>
                </div>
            `;

        })
        .reverse()
        .join("");
}
// =====================================
// 9A-1. REORDER SHAPES
// =====================================

function reorderShape(index, direction) {

    const newIndex = index + direction;

    // Prevent moving beyond the layer list
    if (
        newIndex < 0 ||
        newIndex >= shapes.length
    ) {
        return;
    }
    beginHistoryAction();
    // Swap the shapes in the array
    [shapes[index], shapes[newIndex]] =
        [shapes[newIndex], shapes[index]];


    // Move every SVG element belonging to each shape
    shapes.forEach(shape => {

        let elements = [];

        if (shape.type === "line") {

            elements = [
                shape.hoverBg,
                shape.element,
                shape.guideBg,
                shape.guide,
                shape.hitLine
            ];

        }

        else if (shape.type === "curve") {

            elements = [
                shape.element,
                shape.guideBg,
                shape.guide,
                shape.hitPath,
                shape.horizontalGuide,
                shape.angleGuide
            ];

        }

        else {

            elements = [
                shape.element
            ];

        }

        elements.forEach(element => {
            workspace.appendChild(element);
        });

    });


    // Keep editing handles above the shapes
    bringHandlesToFront();

    // Keep the tool preview above everything
    if (dropPreview) {
        workspace.appendChild(dropPreview);
    }

    renderLayers();
    updateSVGSource();
    commitHistoryAction();
}
// =====================================
// 9A-2. HIDE / SHOW LAYERS
// =====================================

function toggleLayerVisibility(index) {

    const shape = shapes[index];

    if (!shape) return;
    beginHistoryAction();
    shape.hidden = !shape.hidden;
    // Deselect the shape if it is being hidden
    if (shape.hidden && selectedShapes.includes(shape)) {

        selectedShapes = selectedShapes.filter(
            item => item !== shape
        );

        if (selectedShape === shape) {
            selectedShape = selectedShapes.at(-1) || null;
        }

        shape.element.classList.remove("is-selected");

        shape.handles?.forEach(handle => handle.remove());
        shape.handles = [];

        updateMeasurementPanel();
    }

    let elements = [];

    if (shape.type === "line") {

        elements = [
            shape.element,
            shape.hoverBg,
            shape.guideBg,
            shape.guide,
            shape.hitLine
        ];

    }

    else if (shape.type === "curve") {

        elements = [
            shape.element,
            shape.guideBg,
            shape.guide,
            shape.hitPath,
            shape.horizontalGuide,
            shape.angleGuide
        ];

    }

    else {

        elements = [shape.element];

    }

    // Hide or show the shape and its editing handles
    elements.forEach(element => {
        element.style.visibility =
            shape.hidden ? "hidden" : "visible";
    });

    shape.handles?.forEach(handle => {
        handle.style.visibility =
            shape.hidden ? "hidden" : "visible";
    });

    renderLayers();
    updateSVGSource();
    commitHistoryAction();
}
// =====================================
// 9A-3. LOCK / UNLOCK LAYERS
// =====================================

function toggleLayerLock(index) {

    const shape = shapes[index];

    if (!shape) return;
    beginHistoryAction();
    shape.locked = !shape.locked;

    // Remove editing handles when locking
    if (shape.locked) {

        shape.handles?.forEach(handle => handle.remove());
        shape.handles = [];

        hideCenterGuides();
    }

    // Restore handles when unlocking a selected shape
    else if (selectedShape === shape && !shape.hidden) {

        if (shape.type === "line") {
            updateHandles(shape);
        }

        else if (shape.type === "curve") {
            updateCurveHandles(shape);
        }

        else {
            updateBasicShapeHandles(shape);
        }
    }

    renderLayers();
    commitHistoryAction();
}
// =====================================
// 9B. SELECT AND REORDER LAYERS
// =====================================

layerList.addEventListener("click", function (event) {

    // Check if an Up/Down button was clicked
    const moveButton = event.target.closest(".layer-move-btn");
    // Check if visibility button was clicked
    const visibilityButton =
        event.target.closest(".layer-visibility-btn");

    if (visibilityButton) {

        event.preventDefault();
        event.stopPropagation();

        const index = Number(
            visibilityButton.dataset.layerIndex
        );

        toggleLayerVisibility(index);

        return;
    }
    const lockButton = event.target.closest(".layer-lock-btn");

    if (lockButton) {

        event.preventDefault();
        event.stopPropagation();

        const index = Number(lockButton.dataset.layerIndex);

        toggleLayerLock(index);

        return;
    }
    if (moveButton) {

        event.preventDefault();
        event.stopPropagation();

        if (moveButton.disabled) return;

        const index = Number(moveButton.dataset.layerIndex);

        const direction =
            moveButton.dataset.layerAction === "up" ? 1 : -1;

        reorderShape(index, direction);

        return;
    }



    // Normal layer selection
    const layer = event.target.closest(".layer-item");

    if (!layer) return;

    const index = Number(layer.dataset.layerIndex);

    const shape = shapes[index];

    if (!shape) return;

    if (
        !event.shiftKey &&
        selectedShape === shape
    ) {
        return;
    }

    selectShape(shape, event.shiftKey);

});
// =====================================
// 9C. RENAME LAYERS
// =====================================

layerList.addEventListener("dblclick", function (event) {

    const nameElement = event.target.closest(".layer-name");

    if (!nameElement) return;

    const layer = nameElement.closest(".layer-item");

    if (!layer) return;

    const index = Number(layer.dataset.layerIndex);

    const shape = shapes[index];

    if (!shape) return;

    event.preventDefault();

    const originalName = shape.name;

    // Create rename input
    const input = document.createElement("input");

    input.type = "text";
    input.className = "layer-rename-input";
    input.value = originalName;
    input.maxLength = 40;

    nameElement.replaceWith(input);

    input.focus();
    input.select();

    let finished = false;

    function finishRename() {

        if (finished) return;

        finished = true;

        const newName = input.value.trim();
        beginHistoryAction();

        // Empty names revert to the previous name
        shape.name = newName || originalName;

        renderLayers();
        commitHistoryAction();
    }

    input.addEventListener("keydown", function (event) {

        event.stopPropagation();

        if (event.key === "Enter") {
            event.preventDefault();
            input.blur();
        }

        if (event.key === "Escape") {
            event.preventDefault();

            input.value = originalName;
            input.blur();
        }

    });

    input.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    input.addEventListener("blur", finishRename);

});


// =====================================
// KEEP ALL HANDLES ON TOP
// =====================================

function bringHandlesToFront() {

    shapes.forEach(function (shape) {

        shape.handles?.forEach(function (handle) {
            workspace.appendChild(handle);
        });

    });

}


// =====================================
// 10. CREATE LINE EDITING HANDLES
// =====================================

function updateHandles(shape) {

    shape.handles?.forEach(element => element.remove());

    shape.handles = [];

    if (shape.type !== "line") return;


    const points = [
        { x: shape.x1, y: shape.y1, end: "start" },
        { x: shape.x2, y: shape.y2, end: "end" }
    ];


    points.forEach(point => {

        const hoverBg = document.createElementNS(SVG_NS, "circle");

        hoverBg.setAttribute("cx", point.x);
        hoverBg.setAttribute("cy", point.y);
        hoverBg.setAttribute("r", "0.85");
        hoverBg.setAttribute("fill", "#64748B");
        hoverBg.setAttribute("pointer-events", "none");
        hoverBg.style.display = "none";
        hoverBg.classList.add("endpoint-hover-bg");


        const hitArea = document.createElementNS(SVG_NS, "circle");

        hitArea.setAttribute("cx", point.x);
        hitArea.setAttribute("cy", point.y);
        hitArea.setAttribute("r", "0.9");
        hitArea.setAttribute("fill", "transparent");
        hitArea.setAttribute("pointer-events", "all");
        hitArea.classList.add("edit-hit-area");
        hitArea.dataset.end = point.end;


        const handle = document.createElementNS(SVG_NS, "circle");

        handle.setAttribute("cx", point.x);
        handle.setAttribute("cy", point.y);
        handle.setAttribute("r", "0.30");
        handle.setAttribute("fill", "#171717");
        handle.setAttribute("stroke", "#FFFFFF");
        handle.setAttribute("stroke-width", "0.1");
        handle.setAttribute("pointer-events", "none");
        handle.classList.add("edit-handle");


        hitArea.addEventListener("pointerenter", () => {
            hoverBg.style.display = "block";
        });

        hitArea.addEventListener("pointerleave", () => {

            if (
                dragging?.shape !== shape ||
                dragging?.end !== point.end
            ) {
                hoverBg.style.display = "none";
            }

        });


        workspace.appendChild(hoverBg);
        workspace.appendChild(handle);
        workspace.appendChild(hitArea);

        shape.handles.push(hoverBg, hitArea, handle);

    });

}


// =====================================
// 10A. CREATE CURVE HANDLES
// =====================================

function updateCurveHandles(shape) {

    shape.handles?.forEach(element => element.remove());

    shape.handles = [];


    function makeHandle(x, y, action, color, radius = 0.32) {

        const hoverBg = document.createElementNS(SVG_NS, "circle");

        hoverBg.setAttribute("cx", x);
        hoverBg.setAttribute("cy", y);
        hoverBg.setAttribute("r", "1");
        hoverBg.setAttribute("fill", "#64748B");
        hoverBg.setAttribute("pointer-events", "none");
        hoverBg.style.display = "none";


        const hitArea = document.createElementNS(SVG_NS, "circle");

        hitArea.setAttribute("cx", x);
        hitArea.setAttribute("cy", y);
        hitArea.setAttribute("r", "1.2");
        hitArea.setAttribute("fill", "transparent");
        hitArea.setAttribute("stroke", "transparent");
        hitArea.setAttribute("stroke-width", "0.5");
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


        hitArea.addEventListener("pointerenter", () => {
            hoverBg.style.display = "block";
        });

        hitArea.addEventListener("pointerleave", () => {
            hoverBg.style.display = "none";
        });


        workspace.appendChild(hoverBg);
        workspace.appendChild(handle);
        workspace.appendChild(hitArea);

        shape.handles.push(hoverBg, handle, hitArea);

    }


    let delta = shape.endAngle - shape.startAngle;

    while (delta < 0) delta += Math.PI * 2;
    while (delta >= Math.PI * 2) delta -= Math.PI * 2;


    // A: Start endpoint
    const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
    const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);

    makeHandle(startX, startY, "start", "#60A5FA");


    // B: End endpoint
    const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
    const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);

    makeHandle(endX, endY, "end", "#60A5FA");


    // E: Rotate around B
    const angleE = shape.startAngle + delta * 0.25;

    const eX = shape.cx + shape.radius * Math.cos(angleE);
    const eY = shape.cy + shape.radius * Math.sin(angleE);

    makeHandle(eX, eY, "rotate-b", "#FBBF24");


    // F: Rotate around A
    const angleF = shape.startAngle + delta * 0.75;

    const fX = shape.cx + shape.radius * Math.cos(angleF);
    const fY = shape.cy + shape.radius * Math.sin(angleF);

    makeHandle(fX, fY, "rotate-a", "#FBBF24");


    // Green center: Change radius
    makeHandle(shape.cx, shape.cy, "radius", "#4ADE80", 0.38);

}
// =====================================
// 10B. BASIC SHAPE EDITING HANDLES
// =====================================

function updateBasicShapeHandles(shape) {

    shape.handles?.forEach(handle => handle.remove());
    shape.handles = [];

    if (selectedShape !== shape) return;

    function makeHandle(x, y, action) {

        const hover = document.createElementNS(SVG_NS, "circle");

        hover.setAttribute("cx", x);
        hover.setAttribute("cy", y);
        hover.setAttribute("r", "0.75");
        hover.setAttribute("fill", "#64748B");
        hover.setAttribute("pointer-events", "none");
        hover.style.display = "none";

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
        visible.setAttribute("r", "0.3");
        visible.setAttribute("fill", "#171717");
        visible.setAttribute("stroke", "#FFFFFF");
        visible.setAttribute("stroke-width", "0.12");
        visible.setAttribute("pointer-events", "none");

        hit.addEventListener("pointerenter", () => {
            hover.style.display = "block";
        });

        hit.addEventListener("pointerleave", () => {
            hover.style.display = "none";
        });

        workspace.appendChild(hover);
        workspace.appendChild(visible);
        workspace.appendChild(hit);

        shape.handles.push(hover, visible, hit);
    }

    // CIRCLE: radius handle
    if (shape.type === "circle") {

        makeHandle(
            shape.cx + shape.radius,
            shape.cy,
            "radius"
        );

    }

    // RECTANGLE: 8 resize handles
    else if (shape.type === "rectangle") {

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


// =====================================
// 10C. UPDATE BASIC SHAPE
// =====================================

function updateBasicShape(shape) {
    shape.element.setAttribute("fill", shape.fill || "none");
    shape.element.setAttribute("stroke", shape.color);
    shape.element.setAttribute("stroke-width", shape.strokeWidth);

    if (shape.type === "circle") {

        shape.element.setAttribute("cx", shape.cx);
        shape.element.setAttribute("cy", shape.cy);
        shape.element.setAttribute("r", shape.radius);

    }

    else if (shape.type === "rectangle") {

        shape.element.setAttribute("x", shape.x);
        shape.element.setAttribute("y", shape.y);
        shape.element.setAttribute("width", shape.width);
        shape.element.setAttribute("height", shape.height);

    }

    if (
        selectedShape === shape &&
        !shape.hidden &&
        !shape.locked
    ) {
        updateBasicShapeHandles(shape);
    }

    updateSVGSource();
}
// =====================================
// 10D. CENTER GUIDES
// =====================================

function createCenterGuides() {

    const vertical = document.createElementNS(SVG_NS, "line");
    const horizontal = document.createElementNS(SVG_NS, "line");

    [vertical, horizontal].forEach(line => {
        line.setAttribute("stroke", "#FFFFFF");
        line.setAttribute("stroke-width", "0.08");
        line.setAttribute("stroke-dasharray", "0.35 0.25");
        line.setAttribute("pointer-events", "none");
        line.style.display = "none";
        workspace.appendChild(line);
    });

    return { vertical, horizontal };
}

const centerGuides = createCenterGuides();
// =====================================
// LINE AND CURVE MIDPOINT GUIDES
// =====================================

function createMidpointGuides() {

    const vertical = document.createElementNS(SVG_NS, "line");
    const horizontal = document.createElementNS(SVG_NS, "line");
    const marker = document.createElementNS(SVG_NS, "circle");

    [vertical, horizontal].forEach(line => {
        line.setAttribute("stroke", "#38BDF8");
        line.setAttribute("stroke-width", "0.07");
        line.setAttribute("stroke-dasharray", "0.4 0.25");
        line.setAttribute("pointer-events", "none");
        line.style.display = "none";
    });

    marker.setAttribute("r", "0.35");
    marker.setAttribute("fill", "#38BDF8");
    marker.setAttribute("stroke", "#FFFFFF");
    marker.setAttribute("stroke-width", "0.08");
    marker.setAttribute("pointer-events", "none");
    marker.style.display = "none";

    workspace.append(vertical, horizontal, marker);

    return { vertical, horizontal, marker };
}

const midpointGuides = createMidpointGuides();


function updateMidpointGuides(shape) {

    let x;
    let y;

    // LINE: exact halfway point between endpoints
    if (shape.type === "line") {

        x = (shape.x1 + shape.x2) / 2;
        y = (shape.y1 + shape.y2) / 2;

    }

    // CURVE: halfway point along the arc
    else if (shape.type === "curve") {

        let delta = shape.endAngle - shape.startAngle;

        while (delta < 0) delta += Math.PI * 2;
        while (delta >= Math.PI * 2) delta -= Math.PI * 2;

        const middleAngle = shape.startAngle + delta / 2;

        x = shape.cx + shape.radius * Math.cos(middleAngle);
        y = shape.cy + shape.radius * Math.sin(middleAngle);

    }

    else {
        hideMidpointGuides();
        return;
    }

    midpointGuides.vertical.setAttribute("x1", x);
    midpointGuides.vertical.setAttribute("x2", x);
    midpointGuides.vertical.setAttribute("y1", 0);
    midpointGuides.vertical.setAttribute("y2", 24);

    midpointGuides.horizontal.setAttribute("x1", 0);
    midpointGuides.horizontal.setAttribute("x2", 24);
    midpointGuides.horizontal.setAttribute("y1", y);
    midpointGuides.horizontal.setAttribute("y2", y);

    midpointGuides.marker.setAttribute("cx", x);
    midpointGuides.marker.setAttribute("cy", y);

    // Keep guides and marker above the artwork
    workspace.append(
        midpointGuides.vertical,
        midpointGuides.horizontal,
        midpointGuides.marker
    );

    midpointGuides.vertical.style.display = "block";
    midpointGuides.horizontal.style.display = "block";
    midpointGuides.marker.style.display = "block";
}


function hideMidpointGuides() {

    midpointGuides.vertical.style.display = "none";
    midpointGuides.horizontal.style.display = "none";
    midpointGuides.marker.style.display = "none";

}

function updateCenterGuides(shape) {

    let cx, cy;

    if (shape.type === "circle") {
        cx = shape.cx;
        cy = shape.cy;
    }

    else if (shape.type === "rectangle") {
        cx = shape.x + shape.width / 2;
        cy = shape.y + shape.height / 2;
    }

    else {
        return;
    }

    centerGuides.vertical.setAttribute("x1", cx);
    centerGuides.vertical.setAttribute("x2", cx);
    centerGuides.vertical.setAttribute("y1", 0);
    centerGuides.vertical.setAttribute("y2", 24);

    centerGuides.horizontal.setAttribute("x1", 0);
    centerGuides.horizontal.setAttribute("x2", 24);
    centerGuides.horizontal.setAttribute("y1", cy);
    centerGuides.horizontal.setAttribute("y2", cy);

    centerGuides.vertical.style.display = "block";
    centerGuides.horizontal.style.display = "block";
}


function hideCenterGuides() {
    centerGuides.vertical.style.display = "none";
    centerGuides.horizontal.style.display = "none";
}


// =====================================
// 11. UPDATE LINE POSITION
// =====================================

function updateLine(shape) {

    const elements = [
        shape.element,
        shape.hoverBg,
        shape.guideBg,
        shape.guide,
        shape.hitLine
    ];

    elements.forEach(function (element) {

        element.setAttribute("x1", shape.x1);
        element.setAttribute("y1", shape.y1);

        element.setAttribute("x2", shape.x2);
        element.setAttribute("y2", shape.y2);

    });

    updateHandles(shape);
    updateSVGSource();
    shape.element.setAttribute("stroke", shape.color);
}


// =====================================
// 11A. UPDATE CURVE
// =====================================

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


    shape.element.setAttribute("d", curvePath);
    shape.element.setAttribute("stroke-width", shape.strokeWidth);
    shape.guideBg.setAttribute("d", curvePath);
    shape.guide.setAttribute("d", curvePath);
    shape.hitPath.setAttribute("d", curvePath);


    // Horizontal reference line
    shape.horizontalGuide.setAttribute("x1", shape.cx);
    shape.horizontalGuide.setAttribute("y1", shape.cy);
    shape.horizontalGuide.setAttribute("x2", 24);
    shape.horizontalGuide.setAttribute("y2", shape.cy);


    // Radial helper line
    const activeAngle =
        dragging?.shape === shape &&
            dragging.type === "curve-handle" &&
            dragging.action === "start"
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


    updateCurveHandles(shape);
    updateSVGSource();

}


// =====================================
// SNAP CURVE ANGLES — EVERY 10 DEGREES
// =====================================

function snapAngle(angle) {

    const snapStep = Math.PI / 18;

    return Math.round(angle / snapStep) * snapStep;

}


// =====================================
// 12. MEASUREMENT PANEL
// =====================================

const measurementPanel = document.getElementById("measurement-panel");
const measurementSelection = document.getElementById("measurement-selection");
const measurementFields = document.getElementById("measurement-fields");


function getCurveValues(shape) {

    let delta = shape.endAngle - shape.startAngle;

    while (delta < 0) delta += Math.PI * 2;
    while (delta >= Math.PI * 2) delta -= Math.PI * 2;


    const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
    const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);

    const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
    const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);


    return {

        radius: shape.radius,

        startAngle: shape.startAngle * 180 / Math.PI,
        endAngle: shape.endAngle * 180 / Math.PI,

        arcLength: shape.radius * delta,

        chordLength: Math.hypot(endX - startX, endY - startY)

    };

}


function createMeasurementInput(label, value, key, editable = true) {

    return `
        <div class="measurement-field">

            <label>${label}</label>

            <input
                type="number"
                data-measure="${key}"
                value="${Number(value).toFixed(2)}"
                step="0.1"
                ${editable ? "" : "readonly"}
            >

        </div>
    `;

}


function updateMeasurementPanel() {

    if (!selectedShape) {

        measurementSelection.textContent = "No selection";

        measurementFields.innerHTML =
            "<p>Select a shape to view its measurements</p>";

        return;

    }


    const shape = selectedShape;

    measurementSelection.textContent =
        shape.type.charAt(0).toUpperCase() + shape.type.slice(1);


    let html = "";


    // LINE
    if (shape.type === "line") {

        const length = Math.hypot(
            shape.x2 - shape.x1,
            shape.y2 - shape.y1
        );

        html += createMeasurementInput("X1", shape.x1, "x1");
        html += createMeasurementInput("Y1", shape.y1, "y1");
        html += createMeasurementInput("X2", shape.x2, "x2");
        html += createMeasurementInput("Y2", shape.y2, "y2");

        html += createMeasurementInput("Length", length, "length", false);

    }


    // CURVE
    else if (shape.type === "curve") {

        const values = getCurveValues(shape);

        html += createMeasurementInput("Radius", values.radius, "radius");

        html += createMeasurementInput(
            "Start angle (°)",
            values.startAngle,
            "startAngle"
        );

        html += createMeasurementInput(
            "End angle (°)",
            values.endAngle,
            "endAngle"
        );

        html += createMeasurementInput(
            "Arc length",
            values.arcLength,
            "arcLength",
            false
        );

        html += createMeasurementInput(
            "Chord length",
            values.chordLength,
            "chordLength",
            false
        );

    }
    // CIRCLE
    else if (shape.type === "circle") {

        html += createMeasurementInput("Center X", shape.cx, "cx");
        html += createMeasurementInput("Center Y", shape.cy, "cy");
        html += createMeasurementInput("Radius", shape.radius, "radius");

        html += createMeasurementInput(
            "Diameter",
            shape.radius * 2,
            "diameter",
            false
        );

    }

    // RECTANGLE
    else if (shape.type === "rectangle") {

        html += createMeasurementInput("X", shape.x, "x");
        html += createMeasurementInput("Y", shape.y, "y");
        html += createMeasurementInput("Width", shape.width, "width");
        html += createMeasurementInput("Height", shape.height, "height");

    }


    measurementFields.innerHTML = html;

}
// =====================================
// 12A. PROPERTIES PANEL
// =====================================

function updatePropertiesPanel() {

    if (!selectedShape) {
        propertiesFields.innerHTML = "";
        return;
    }

    const shape = selectedShape;

    const strokeWidth = shape.type === "line"
        ? shape.width
        : shape.strokeWidth;

    const isFillableShape =
        shape.type === "circle" ||
        shape.type === "rectangle" ||
        shape.type === "path";

    let html = `
        <div class="property-group">

            <h4>Stroke</h4>

            <div class="property-field">
                <span>Stroke Color</span>
                <input
                    type="color"
                    data-style="stroke-color"
                    value="${shape.color}"
                >
            </div>

            <div class="property-field">
                <span>Stroke Width</span>
                <input
                    type="number"
                    data-style="stroke-width"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value="${strokeWidth}"
                >
            </div>

        </div>
    `;

    if (isFillableShape) {
        const fillEnabled = shape.fill !== "none";

        const fillColor = fillEnabled
            ? shape.fill
            : (shape.fillColor || "#ffffff");

        html += `
            <div class="property-group">

                <h4>Fill</h4>

                <div class="property-inline-row">

                    <div class="property-field">
                        <span>Fill Color</span>
                        <input
                            type="color"
                            data-style="fill-color"
                            value="${fillColor}"
                            ${!fillEnabled ? "disabled" : ""}
                        >
                    </div>

                    <label class="property-checkbox">
                        <input
                            type="checkbox"
                            data-style="fill-toggle"
                            ${fillEnabled ? "checked" : ""}
                        >
                        <span>Enabled</span>
                    </label>

                </div>

            </div>
        `;
    }

    propertiesFields.innerHTML = html;
}
propertiesFields.addEventListener("change", function (event) {

    const input = event.target;

    if (!input.matches("[data-style]")) return;
    if (!selectedShape || selectedShape.locked || selectedShape.hidden) return;

    beginHistoryAction();

    const shape = selectedShape;
    const style = input.dataset.style;

    // =================================
    // STROKE COLOR — ALL SHAPES
    // =================================

    if (style === "stroke-color") {

        shape.color = input.value;

        shape.element.setAttribute("stroke", shape.color);

        updateSVGSource();
        commitHistoryAction();

        return;
    }

    // =================================
    // STROKE WIDTH — ALL SHAPES
    // =================================

    if (style === "stroke-width") {

        const value = Number(input.value);

        if (!Number.isFinite(value) || value <= 0) {
            commitHistoryAction();
            return;
        }
        const strokeWidth = Math.max(0.1, Math.min(5, value));

        if (shape.type === "line") {
            shape.width = strokeWidth;
            shape.element.setAttribute("stroke-width", strokeWidth);
        }

        else if (shape.type === "curve") {
            shape.strokeWidth = strokeWidth;
            shape.element.setAttribute("stroke-width", strokeWidth);
        }

        else {
            shape.strokeWidth = strokeWidth;
            updateBasicShape(shape);
        }

        input.value = strokeWidth;
        updateSVGSource();
        commitHistoryAction();

        return;
    }

    // =================================
    // FILL — CIRCLE AND RECTANGLE ONLY
    // =================================

    if (
        shape.type !== "circle" &&
        shape.type !== "rectangle" &&
        shape.type !== "path"
    ) return;

    if (style === "fill-toggle") {

        if (input.checked) {
            shape.fill = shape.fillColor || "#ffffff";
        }

        else {
            shape.fillColor = shape.fill !== "none"
                ? shape.fill
                : (shape.fillColor || "#ffffff");

            shape.fill = "none";
        }

        updateBasicShape(shape);
        updatePropertiesPanel();
        commitHistoryAction();

    }

    else if (style === "fill-color") {

        shape.fill = input.value;
        shape.fillColor = input.value;

        updateBasicShape(shape);
        commitHistoryAction();

    }

});



// =====================================
// 13. EDIT MEASUREMENTS
// =====================================
measurementFields.addEventListener("focusin", function (event) {

    if (event.target.matches("[data-measure]")) {
        beginHistoryAction();
    }

});

measurementFields.addEventListener("focusout", function (event) {

    if (event.target.matches("[data-measure]")) {
        commitHistoryAction();
    }

});
measurementFields.addEventListener("input", function (event) {

    const input = event.target;

    if (!input.matches("[data-measure]")) return;
    if (!selectedShape) return;
    if (selectedShape.locked) return;
    if (input.readOnly) return;


    const shape = selectedShape;
    const key = input.dataset.measure;
    const value = Number(input.value);

    if (!Number.isFinite(value)) return;


    // LINE
    if (shape.type === "line") {

        if (["x1", "y1", "x2", "y2"].includes(key)) {

            shape[key] = Math.max(0, Math.min(24, value));

            updateLine(shape);

        }

    }


    // CURVE
    else if (shape.type === "curve") {

        if (key === "radius") {

            shape.radius = Math.max(0.5, Math.min(8, value));

        }

        else if (key === "startAngle") {

            shape.startAngle = value * Math.PI / 180;

        }

        else if (key === "endAngle") {

            shape.endAngle = value * Math.PI / 180;

        }

        updateCurve(shape);

    }
    // CIRCLE
    else if (shape.type === "circle") {

        if (key === "cx") {
            shape.cx = Math.max(
                shape.radius,
                Math.min(24 - shape.radius, value)
            );
        }

        else if (key === "cy") {
            shape.cy = Math.max(
                shape.radius,
                Math.min(24 - shape.radius, value)
            );
        }

        else if (key === "radius") {
            shape.radius = Math.max(
                0.5,
                Math.min(
                    Math.min(shape.cx, 24 - shape.cx, shape.cy, 24 - shape.cy),
                    value
                )
            );
        }

        updateBasicShape(shape);

    }

    // RECTANGLE
    else if (shape.type === "rectangle") {

        if (key === "x") {
            const right = shape.x + shape.width;
            shape.x = Math.max(0, Math.min(right - 0.5, value));
            shape.width = right - shape.x;
        }

        else if (key === "y") {
            const bottom = shape.y + shape.height;
            shape.y = Math.max(0, Math.min(bottom - 0.5, value));
            shape.height = bottom - shape.y;
        }

        else if (key === "width") {
            shape.width = Math.max(
                0.5,
                Math.min(24 - shape.x, value)
            );
        }

        else if (key === "height") {
            shape.height = Math.max(
                0.5,
                Math.min(24 - shape.y, value)
            );
        }

        updateBasicShape(shape);

    }


    updateCalculatedMeasurements();

});


// =====================================
// UPDATE CALCULATED MEASUREMENTS
// =====================================

function updateCalculatedMeasurements() {

    if (!selectedShape) return;

    const shape = selectedShape;


    if (shape.type === "line") {

        const length = Math.hypot(
            shape.x2 - shape.x1,
            shape.y2 - shape.y1
        );

        const lengthInput =
            measurementFields.querySelector('[data-measure="length"]');

        if (lengthInput) {
            lengthInput.value = length.toFixed(2);
        }

    }


    else if (shape.type === "curve") {

        const values = getCurveValues(shape);

        ["arcLength", "chordLength"].forEach(key => {

            const input =
                measurementFields.querySelector(`[data-measure="${key}"]`);

            if (input) {
                input.value = values[key].toFixed(2);
            }

        });

    }
    else if (shape.type === "circle") {

        const diameterInput =
            measurementFields.querySelector('[data-measure="diameter"]');

        if (diameterInput) {
            diameterInput.value = (shape.radius * 2).toFixed(2);
        }

    }

}



// =====================================
// 14. START MOUSE MOVEMENT
// =====================================

workspace.addEventListener("pointerdown", function (event) {
    // PATH DRAWING
    if (pathDrawing) {
        if (event.button !== 0) return;

        event.preventDefault();

        const position = getSVGPosition(event);
        pathDrawing.points.push(position);

        const pathData = createPathData(
            pathDrawing.points,
            pathDrawing.curved
        );

        pathDrawing.preview.setAttribute("d", pathData);

        return;
    }
    beginHistoryAction();
    const lockedShape = shapes.find(shape => {

        const elements = [
            shape.element,
            shape.hoverBg,
            shape.guideBg,
            shape.guide,
            shape.hitLine,
            shape.hitPath,
            shape.horizontalGuide,
            shape.angleGuide,
            ...(shape.handles || [])
        ];

        return elements.includes(event.target);

    });

    if (lockedShape?.locked) {

        selectShape(lockedShape, event.shiftKey);

        return;

    }

    const curveHit = event.target.closest(".curve-hit-area");
    const hitArea = event.target.closest(".edit-hit-area");
    const basicHit = event.target.closest(".basic-hit-area");

    // =================================
    // CIRCLE / RECTANGLE RESIZE HANDLE
    // =================================

    if (basicHit) {

        const shape = shapes.find(item =>
            (item.type === "circle" || item.type === "rectangle") &&
            item.handles.includes(basicHit)
        );

        if (!shape) return;

        selectShape(shape, event.shiftKey);

        const position = getSVGPosition(event);

        dragging = {
            shape: shape,
            type: "basic-resize",
            action: basicHit.dataset.action,

            startX: position.x,
            startY: position.y,

            originalX: shape.x,
            originalY: shape.y,
            originalWidth: shape.width,
            originalHeight: shape.height,

            originalCx: shape.cx,
            originalCy: shape.cy,
            originalRadius: shape.radius
        };

    }

    // =================================
    // CURVE HANDLE
    // =================================

    else if (curveHit) {

        const shape = shapes.find(item =>
            item.type === "curve" &&
            item.handles.includes(curveHit)
        );

        if (!shape) return;

        selectShape(shape);

        const position = getSVGPosition(event);
        const action = curveHit.dataset.action;

        let pivot;

        if (action === "rotate-b") {
            pivot = {
                x: shape.cx + shape.radius * Math.cos(shape.endAngle),
                y: shape.cy + shape.radius * Math.sin(shape.endAngle)
            };
        }

        else if (action === "rotate-a") {
            pivot = {
                x: shape.cx + shape.radius * Math.cos(shape.startAngle),
                y: shape.cy + shape.radius * Math.sin(shape.startAngle)
            };
        }

        dragging = {
            shape: shape,
            type: "curve-handle",
            action: action,

            startY: position.y,
            startRadius: shape.radius,

            previousX: position.x,
            previousY: position.y,

            pivot: pivot,

            startPointerAngle: pivot
                ? Math.atan2(
                    position.y - pivot.y,
                    position.x - pivot.x
                )
                : null,

            startCx: shape.cx,
            startCy: shape.cy,

            startAngle: shape.startAngle,
            initialEndAngle: shape.endAngle,

            snappedTo: null
        };
    }

    // =================================
    // LINE ENDPOINT
    // =================================

    else if (hitArea) {

        const shape = shapes.find(item =>
            item.type === "line" &&
            item.handles?.includes(hitArea)
        );

        if (!shape) return;

        selectShape(shape);

        dragging = {
            shape: shape,
            type: "endpoint",
            end: hitArea.dataset.end,
            snappedTo: null
        };
    }

    // =================================
    // CIRCLE OR RECTANGLE BODY
    // =================================

    else {

        const basicShape = shapes.find(item =>
            !item.hidden &&
            (item.type === "circle" || item.type === "rectangle") &&
            item.element === event.target
        );
        if (basicShape) {

            selectShape(basicShape, event.shiftKey);

            const position = getSVGPosition(event);

            dragging = {
                shape: basicShape,
                type: "basic-body",
                previousX: position.x,
                previousY: position.y
            };

        }

        else {

            // =================================
            // LINE OR CURVE BODY
            // =================================

            const shape = shapes.find(item =>

                (
                    item.type === "line" &&
                    (
                        item.hitLine === event.target ||
                        item.element === event.target
                    )
                ) ||

                (
                    item.type === "curve" &&
                    (
                        item.hitPath === event.target ||
                        item.element === event.target
                    )
                )

            );

            if (!shape) {

                if (!event.shiftKey) {
                    selectShape(null);
                }

                return;

            }

            selectShape(shape, event.shiftKey);

            const position = getSVGPosition(event);

            dragging = {
                shape: shape,
                type: "body",
                previousX: position.x,
                previousY: position.y,
                snappedTo: null
            };

        }

    }

    // =================================
    // CURVE HELPER GUIDES
    // =================================
    if (
        dragging?.shape?.type === "curve" ||
        dragging?.shape?.type === "line"
    ) {
        updateMidpointGuides(dragging.shape);
    }

    if (dragging?.shape?.type === "curve") {
        dragging.shape.horizontalGuide.style.display = "block";
        dragging.shape.angleGuide.style.display = "block";
    }

    workspace.setPointerCapture(event.pointerId);

});



// =====================================
// 15. GET ALL AVAILABLE SNAP POINTS
// =====================================

function getShapeEndpoints(shape) {

    if (shape.type === "line") {

        return [

            {
                x: shape.x1,
                y: shape.y1,
                shape: shape,
                end: "start"
            },

            {
                x: shape.x2,
                y: shape.y2,
                shape: shape,
                end: "end"
            }

        ];

    }


    if (shape.type === "curve") {

        return [

            {
                x: shape.cx + shape.radius * Math.cos(shape.startAngle),
                y: shape.cy + shape.radius * Math.sin(shape.startAngle),
                shape: shape,
                end: "start"
            },

            {
                x: shape.cx + shape.radius * Math.cos(shape.endAngle),
                y: shape.cy + shape.radius * Math.sin(shape.endAngle),
                shape: shape,
                end: "end"
            }

        ];

    }


    return [];

}


// =====================================
// 16. UNIVERSAL SNAP SYSTEM
// =====================================

function getSnappedPoint(x, y, currentShape) {

    const snapDistance = 0.3;
    const releaseDistance = 0.4;


    // Keep existing connection while close to target
    if (dragging.snappedTo) {

        const target = getShapeEndpoints(
            dragging.snappedTo.shape
        ).find(point =>
            point.end === dragging.snappedTo.end
        );


        if (target) {

            const distance = Math.hypot(
                x - target.x,
                y - target.y
            );

            if (distance <= releaseDistance) {

                return {
                    x: target.x,
                    y: target.y
                };

            }

        }


        dragging.snappedTo = null;

    }


    let closest = null;
    let closestDistance = snapDistance;


    for (const shape of shapes) {

        if (shape === currentShape) continue;

        const points = getShapeEndpoints(shape);


        for (const point of points) {

            const distance = Math.hypot(
                x - point.x,
                y - point.y
            );


            if (distance <= closestDistance) {

                closestDistance = distance;
                closest = point;

            }

        }

    }


    if (closest) {

        dragging.snappedTo = {
            shape: closest.shape,
            end: closest.end
        };

        return {
            x: closest.x,
            y: closest.y
        };

    }


    return { x, y };

}


// =====================================
// 17. SNAP ENTIRE SHAPE WHILE MOVING
// =====================================

function getBodySnapOffset(shape, moveX, moveY) {

    const snapDistance = 0.3;
    const releaseDistance = 0.4;

    const movingPoints = getShapeEndpoints(shape);


    // Maintain existing connection
    if (dragging.snappedTo) {

        const target = getShapeEndpoints(
            dragging.snappedTo.shape
        ).find(point =>
            point.end === dragging.snappedTo.end
        );


        const movingPoint = movingPoints.find(point =>
            point.end === dragging.snappedTo.movingEnd
        );


        if (target && movingPoint) {

            const distance = Math.hypot(
                movingPoint.x + moveX - target.x,
                movingPoint.y + moveY - target.y
            );


            if (distance <= releaseDistance) {

                return {
                    x: target.x - movingPoint.x,
                    y: target.y - movingPoint.y
                };

            }

        }


        dragging.snappedTo = null;

    }


    let closest = null;
    let closestDistance = snapDistance;


    for (const movingPoint of movingPoints) {

        for (const otherShape of shapes) {

            if (otherShape === shape) continue;

            const targetPoints = getShapeEndpoints(otherShape);


            for (const target of targetPoints) {

                const distance = Math.hypot(
                    movingPoint.x + moveX - target.x,
                    movingPoint.y + moveY - target.y
                );


                if (distance <= closestDistance) {

                    closestDistance = distance;

                    closest = {
                        movingPoint: movingPoint,
                        target: target
                    };

                }

            }

        }

    }


    if (closest) {

        dragging.snappedTo = {

            shape: closest.target.shape,
            end: closest.target.end,
            movingEnd: closest.movingPoint.end

        };


        return {

            x: closest.target.x - closest.movingPoint.x,
            y: closest.target.y - closest.movingPoint.y

        };

    }


    return {
        x: moveX,
        y: moveY
    };

}


// =====================================
// 18. MOVE SHAPES
// =====================================

workspace.addEventListener("pointermove", function (event) {

    if (!dragging) return;


    const shape = dragging.shape;
    const position = getSVGPosition(event);

    const dx = position.x - dragging.previousX;
    const dy = position.y - dragging.previousY;
    // =================================
    // CIRCLE / RECTANGLE MOVEMENT
    // =================================

    if (
        shape.type === "circle" ||
        shape.type === "rectangle"
    ) {

        // MOVE ENTIRE SHAPE
        if (dragging.type === "basic-body") {

            if (shape.type === "circle") {

                shape.cx = Math.max(
                    shape.radius,
                    Math.min(24 - shape.radius, shape.cx + dx)
                );

                shape.cy = Math.max(
                    shape.radius,
                    Math.min(24 - shape.radius, shape.cy + dy)
                );

            }

            else {

                shape.x = Math.max(
                    0,
                    Math.min(24 - shape.width, shape.x + dx)
                );

                shape.y = Math.max(
                    0,
                    Math.min(24 - shape.height, shape.y + dy)
                );

            }

        }

        // RESIZE SHAPE
        else if (dragging.type === "basic-resize") {

            const action = dragging.action;

            if (shape.type === "circle") {

                const distance = Math.hypot(
                    position.x - shape.cx,
                    position.y - shape.cy
                );

                const maximumRadius = Math.min(
                    shape.cx,
                    24 - shape.cx,
                    shape.cy,
                    24 - shape.cy
                );

                shape.radius = Math.max(
                    0.5,
                    Math.min(maximumRadius, distance)
                );

            }

            else {

                const dx = position.x - dragging.startX;
                const dy = position.y - dragging.startY;

                let left = dragging.originalX;
                let top = dragging.originalY;
                let right = left + dragging.originalWidth;
                let bottom = top + dragging.originalHeight;

                // LEFT SIDE
                if (["nw", "w", "sw"].includes(action)) {
                    left = Math.max(
                        0,
                        Math.min(right - 0.5, dragging.originalX + dx)
                    );
                }

                // RIGHT SIDE
                if (["ne", "e", "se"].includes(action)) {
                    right = Math.max(
                        left + 0.5,
                        Math.min(24, dragging.originalX +
                            dragging.originalWidth + dx)
                    );
                }

                // TOP SIDE
                if (["nw", "n", "ne"].includes(action)) {
                    top = Math.max(
                        0,
                        Math.min(bottom - 0.5, dragging.originalY + dy)
                    );
                }

                // BOTTOM SIDE
                if (["sw", "s", "se"].includes(action)) {
                    bottom = Math.max(
                        top + 0.5,
                        Math.min(24, dragging.originalY +
                            dragging.originalHeight + dy)
                    );
                }

                shape.x = left;
                shape.y = top;
                shape.width = right - left;
                shape.height = bottom - top;

            }

        }

        dragging.previousX = position.x;
        dragging.previousY = position.y;

        updateBasicShape(shape);

        if (dragging.type === "basic-body") {
            updateAlignmentGuides(shape);
        } else {
            hideAlignmentGuides();
        }

        updateCenterGuides(shape);
        updateMeasurementPanel();
        renderLayers();
        return;

    }


    // =================================
    // CURVE MOVEMENT
    // =================================

    if (shape.type === "curve") {


        // MOVE ENTIRE CURVE
        if (dragging.type === "body") {

            let moveX = dx;
            let moveY = dy;

            const minX = shape.radius;
            const maxX = 24 - shape.radius;

            const minY = shape.radius;
            const maxY = 24 - shape.radius;


            moveX = Math.max(
                minX - shape.cx,
                Math.min(maxX - shape.cx, moveX)
            );

            moveY = Math.max(
                minY - shape.cy,
                Math.min(maxY - shape.cy, moveY)
            );


            const snapped = getBodySnapOffset(
                shape,
                moveX,
                moveY
            );


            shape.cx += snapped.x;
            shape.cy += snapped.y;

        }


        // ROTATE CURVE AROUND FIXED ENDPOINT
        else if (
            dragging.action === "rotate-a" ||
            dragging.action === "rotate-b"
        ) {

            const currentAngle = Math.atan2(
                position.y - dragging.pivot.y,
                position.x - dragging.pivot.x
            );


            let rotation = currentAngle - dragging.startPointerAngle;


            rotation = Math.atan2(
                Math.sin(rotation),
                Math.cos(rotation)
            );


            const pivot = dragging.pivot;

            const dx = dragging.startCx - pivot.x;
            const dy = dragging.startCy - pivot.y;


            shape.cx = pivot.x +
                dx * Math.cos(rotation) -
                dy * Math.sin(rotation);

            shape.cy = pivot.y +
                dx * Math.sin(rotation) +
                dy * Math.cos(rotation);


            shape.startAngle = dragging.startAngle + rotation;
            shape.endAngle = dragging.initialEndAngle + rotation;

        }


        // CHANGE RADIUS
        else if (dragging.action === "radius") {

            const radiusChange = dragging.startY - position.y;

            shape.radius = Math.max(
                0.5,
                Math.min(8, dragging.startRadius + radiusChange)
            );

        }


        // CHANGE ENDPOINT ANGLE + SNAP
        else if (
            dragging.action === "start" ||
            dragging.action === "end"
        ) {

            const snapped = getSnappedPoint(
                position.x,
                position.y,
                shape
            );


            const dx = snapped.x - shape.cx;
            const dy = snapped.y - shape.cy;

            let angle = Math.atan2(dy, dx);


            if (!dragging.snappedTo) {
                angle = snapAngle(angle);
            }


            if (dragging.action === "start") {
                shape.startAngle = angle;
            }

            else {
                shape.endAngle = angle;
            }

        }


        dragging.previousX = position.x;
        dragging.previousY = position.y;


        updateCurve(shape);

        if (dragging.type === "body") {
            updateAlignmentGuides(shape);
        } else {
            hideAlignmentGuides();
        }

        updateMidpointGuides(shape);
        updateMeasurementPanel();

        return;

    }


    // =================================
    // LINE MOVEMENT
    // =================================


    // MOVE LINE ENDPOINT
    if (dragging.type === "endpoint") {

        const x = Math.max(0, Math.min(24, position.x));
        const y = Math.max(0, Math.min(24, position.y));

        const snapped = getSnappedPoint(x, y, shape);


        if (dragging.end === "start") {

            shape.x1 = snapped.x;
            shape.y1 = snapped.y;

        }

        else {

            shape.x2 = snapped.x;
            shape.y2 = snapped.y;

        }

    }


    // MOVE ENTIRE LINE
    else if (dragging.type === "body") {

        let moveX = dx;
        let moveY = dy;


        const minX = Math.min(shape.x1, shape.x2);
        const maxX = Math.max(shape.x1, shape.x2);

        const minY = Math.min(shape.y1, shape.y2);
        const maxY = Math.max(shape.y1, shape.y2);


        moveX = Math.max(
            -minX,
            Math.min(24 - maxX, moveX)
        );

        moveY = Math.max(
            -minY,
            Math.min(24 - maxY, moveY)
        );


        const snapped = getBodySnapOffset(
            shape,
            moveX,
            moveY
        );


        shape.x1 += snapped.x;
        shape.x2 += snapped.x;

        shape.y1 += snapped.y;
        shape.y2 += snapped.y;


        dragging.previousX = position.x;
        dragging.previousY = position.y;

    }


    updateLine(shape);

    if (dragging.type === "body") {
        updateAlignmentGuides(shape);
    } else {
        hideAlignmentGuides();
    }

    updateMidpointGuides(shape);

});


// =====================================
// 19. STOP MOVEMENT
// =====================================

function stopMovement() {

    if (dragging?.shape?.type === "curve") {

        dragging.shape.horizontalGuide.style.display = "none";
        dragging.shape.angleGuide.style.display = "none";

    }

    hideCenterGuides();
    hideMidpointGuides();
    hideAlignmentGuides();
    dragging = null;
    commitHistoryAction();

}


workspace.addEventListener("pointerup", stopMovement);
workspace.addEventListener("pointercancel", stopMovement);


// =====================================
// 20. DROP SHAPES INTO WORKSPACE
// =====================================

workspace.addEventListener("drop", function (event) {
    event.preventDefault();
    beginHistoryAction();

    const type = event.dataTransfer.getData("text/plain") || draggingTool;
    const position = getSVGPosition(event);

    if (dropPreview) {
        dropPreview.remove();
        dropPreview = null;
    }

    if (type === "cutout") {

        if (
            !selectedShape ||
            selectedShape.type !== "path" ||
            selectedShape.locked ||
            selectedShape.hidden
        ) {
            return;
        }

        const preview = document.createElementNS(SVG_NS, "path");

        preview.setAttribute("fill", "none");
        preview.setAttribute("stroke", "#F472B6");
        preview.setAttribute("stroke-width", "0.07");
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

    }

    else if (type === "path") {

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

        selectedShape = null;
        selectedShapes = [];

        renderLayers();
        updatePropertiesPanel();

    }
    else if (type === "line") {
        createLine(position.x, position.y);
    }
    else if (type === "curve") {
        createCurve(position.x, position.y);
    }
    else {
        createOtherShape(type, position.x, position.y);
    }

    draggingTool = null;

    if (!pathDrawing) {
        commitHistoryAction();
    }
});
// =====================================
// FINISH PATH / CUTOUT
// =====================================

function finishPath() {

    if (!pathDrawing || pathDrawing.points.length < 3) return;
    beginHistoryAction();

    const pathData = createPathData(
        pathDrawing.points,
        pathDrawing.curved
    );


    // =================================
    // CUTOUT MODE
    // =================================

    if (pathDrawing.mode === "cutout") {

        const shape = pathDrawing.shape;

        pathDrawing.preview.remove();

        if (!shape.holes) {
            shape.holes = [];
        }

        shape.holes.push({
            points: [...pathDrawing.points],
            curved: pathDrawing.curved
        });

        const combinedPath = getPathParts(shape)
            .map(item =>
                createPathData(item.points, item.curved)
            )
            .join(" ");

        shape.element.setAttribute("d", combinedPath);
        shape.element.setAttribute("fill-rule", "evenodd");

        pathDrawing = null;

        selectShape(shape);
        updateSVGSource();
        commitHistoryAction();
        return;
    }


    // =================================
    // NORMAL PATH MODE
    // =================================

    const pathShape = {

        type: "path",
        element: pathDrawing.preview,

        points: [...pathDrawing.points],
        holes: [],

        curved: pathDrawing.curved,

        color: getNextColor("path"),
        fill: "none",
        strokeWidth: 0.15,

        hidden: false,
        locked: false

    };

    pathDrawing.preview.setAttribute("d", pathData);
    pathDrawing.preview.setAttribute("stroke", pathShape.color);
    pathDrawing.preview.setAttribute("stroke-width", pathShape.strokeWidth);

    pathDrawing = null;

    shapes.push(pathShape);

    updateSVGSource();
    selectShape(pathShape);
    commitHistoryAction();
}
// =====================================
// 21. DELETE SELECTED SHAPES
// =====================================

const deleteButton = document.getElementById("delete-shape");

function removeShape(shape) {

    // Remove all editing handles
    shape.handles?.forEach(handle => {
        handle.remove();
    });

    shape.handles = [];

    // Remove line elements
    if (shape.type === "line") {

        shape.element.remove();
        shape.hoverBg.remove();
        shape.guideBg.remove();
        shape.guide.remove();
        shape.hitLine.remove();

    }

    // Remove curve elements
    else if (shape.type === "curve") {

        shape.element.remove();
        shape.hitPath.remove();
        shape.guideBg.remove();
        shape.guide.remove();
        shape.horizontalGuide.remove();
        shape.angleGuide.remove();

    }

    // Remove circle or rectangle
    else {

        shape.element.remove();

    }

}
// =====================================
// 21A. COPY / PASTE / DUPLICATE
// =====================================

// Get shape data without its SVG elements or editing handles
function getCopyData(shape) {

    const data = {};

    for (const [key, value] of Object.entries(shape)) {

        if (shapeDOMKeys.has(key)) continue;

        data[key] = structuredClone(value);

    }

    return data;

}


// Move copied shape geometry
function offsetShapeData(data, offset) {

    const shape = structuredClone(data);

    if (shape.type === "line") {

        shape.x1 += offset;
        shape.x2 += offset;
        shape.y1 += offset;
        shape.y2 += offset;

    }

    else if (shape.type === "curve") {

        shape.cx += offset;
        shape.cy += offset;

    }

    else if (shape.type === "circle") {

        shape.cx += offset;
        shape.cy += offset;

    }

    else if (shape.type === "rectangle") {

        shape.x += offset;
        shape.y += offset;

    }

    else if (shape.type === "path") {

        shape.points = shape.points.map(point => ({
            x: point.x + offset,
            y: point.y + offset
        }));

        shape.holes = (shape.holes || []).map(hole => {

            const points = Array.isArray(hole)
                ? hole
                : hole.points;

            const movedPoints = points.map(point => ({
                x: point.x + offset,
                y: point.y + offset
            }));

            return Array.isArray(hole)
                ? movedPoints
                : {
                    ...hole,
                    points: movedPoints
                };

        });

    }

    return shape;

}


// Recreate a shape with its SVG elements
function createShapeFromCopy(data) {

    let shape;

    if (data.type === "line") {

        createLine(data.x1, data.y1);

        shape = shapes[shapes.length - 1];

        Object.assign(shape, data);

        updateLine(shape);

    }

    else if (data.type === "curve") {

        createCurve(data.cx, data.cy);

        shape = shapes[shapes.length - 1];

        Object.assign(shape, data);

        updateCurve(shape);

    }

    else if (
        data.type === "circle" ||
        data.type === "rectangle"
    ) {

        createOtherShape(data.type, 12, 12);

        shape = shapes[shapes.length - 1];

        Object.assign(shape, data);

        updateBasicShape(shape);

    }

    else if (data.type === "path") {

        const element = document.createElementNS(
            SVG_NS,
            "path"
        );

        shape = {
            ...structuredClone(data),
            element: element
        };

        element.setAttribute(
            "d",
            getPathParts(shape)
                .map(item =>
                    createPathData(item.points, item.curved)
                )
                .join(" ")
        );

        element.setAttribute("fill", shape.fill || "none");
        element.setAttribute("fill-rule", "evenodd");
        element.setAttribute("stroke", shape.color);
        element.setAttribute("stroke-width", shape.strokeWidth);
        element.setAttribute("stroke-linecap", "round");
        element.setAttribute("stroke-linejoin", "round");

        workspace.appendChild(element);
        shapes.push(shape);

    }

    return shape;

}


// Create copies of selected shape data
function pasteShapeData(dataList) {

    if (!dataList.length) return;

    beginHistoryAction();

    const newShapes = [];

    dataList.forEach(data => {

        const movedData = offsetShapeData(
            data,
            COPY_OFFSET
        );

        const newShape = createShapeFromCopy(movedData);

        if (newShape) {
            newShapes.push(newShape);
        }

    });

    // Select all newly created shapes
    selectedShapes = newShapes;
    selectedShape = newShapes[newShapes.length - 1] || null;

    selectShape(selectedShape);

    // Restore multi-selection
    selectedShapes = newShapes;

    newShapes.forEach(shape => {
        shape.element.classList.add("is-selected");
    });

    updateMeasurementPanel();
    updatePropertiesPanel();
    renderLayers();
    updateSVGSource();

    commitHistoryAction();

}


// COPY
function copySelectedShapes() {

    if (selectedShapes.length === 0) return;

    copiedShapes = selectedShapes
        .filter(shape => !shape.locked && !shape.hidden)
        .map(getCopyData);

}


// PASTE
function pasteCopiedShapes() {

    if (copiedShapes.length === 0) return;

    pasteShapeData(copiedShapes);

}


// DUPLICATE
function duplicateSelectedShapes() {

    if (selectedShapes.length === 0) return;

    const data = selectedShapes
        .filter(shape => !shape.locked && !shape.hidden)
        .map(getCopyData);

    pasteShapeData(data);

}
deleteButton.addEventListener("click", function () {

    if (selectedShapes.length === 0) return;
    beginHistoryAction();

    dragging = null;

    // Remove every selected shape
    selectedShapes.forEach(shape => {
        removeShape(shape);
    });

    // Remove from shapes array
    shapes = shapes.filter(shape =>
        !selectedShapes.includes(shape)
    );

    // Clear selection
    selectedShapes = [];
    selectedShape = null;

    updateMeasurementPanel();
    updatePropertiesPanel();
    renderLayers();
    updateSVGSource();
    commitHistoryAction();

});
// =====================================
// GRID POINT HIGHLIGHT
// =====================================

const gridHighlightToggle = document.getElementById("show-grid-highlight");
const gridHoverMarker = document.getElementById("grid-hover-marker");
console.log("Grid marker:", gridHoverMarker);
console.log("Grid toggle:", gridHighlightToggle);

// Keep the marker above the existing SVG elements
workspace.appendChild(gridHoverMarker);

workspace.addEventListener("pointermove", (event) => {

    if (!gridHighlightToggle.checked) {
        gridHoverMarker.style.display = "none";
        return;
    }

    const position = getSVGPosition(event);

    const x = Math.round(position.x);
    const y = Math.round(position.y);

    gridHoverMarker.setAttribute("cx", x);
    gridHoverMarker.setAttribute("cy", y);
    gridHoverMarker.style.display = "block";
});

workspace.addEventListener("pointerleave", () => {
    gridHoverMarker.style.display = "none";
});

gridHighlightToggle.addEventListener("change", () => {
    if (!gridHighlightToggle.checked) {
        gridHoverMarker.style.display = "none";
    }
});
// Autosave editor settings when changed
document.getElementById("show-coordinates")
    .addEventListener("change", saveProjectToBrowser);

gridHighlightToggle.addEventListener(
    "change",
    saveProjectToBrowser
);

pathStyleToggle?.addEventListener(
    "change",
    saveProjectToBrowser
);


// =====================================
// 22. REAL SVG GENERATOR
// =====================================

const svgCode = document.getElementById("svg-code");
const copyCodeButton = document.getElementById("copy-code");
const exportButton = document.querySelector(".export-btn");
const applyCodeButton = document.getElementById("apply-code");

const saveProjectButton = document.getElementById("save-project-button");
const newProjectButton = document.getElementById("new-project-button");
const fileMenuButton = document.getElementById("file-menu-button");
const fileDropdown = document.getElementById("file-dropdown");
const homeButton = document.getElementById("home-button");
const homeScreen = document.getElementById("home-screen");
const homeEditButton = document.getElementById("home-edit-button");

saveProjectButton?.addEventListener("click", () => {
    saveProjectToBrowser();
});

newProjectButton?.addEventListener("click", () => {
    createNewProject();
    fileDropdown.classList.remove("show");
});

fileMenuButton?.addEventListener("click", () => {
    fileDropdown.classList.toggle("show");
});
homeButton?.addEventListener("click", () => {
    homeScreen.classList.toggle("show");

    if (homeScreen.classList.contains("show")) {
        renderHomeProjects();
    }

    fileDropdown?.classList.remove("show");
});

// =====================================
// HOME ICON PREVIEW SYSTEM
// =====================================

const projectDetails = document.getElementById("project-details");
const projectPreviewImage = document.getElementById("project-preview-image");
const projectName = document.getElementById("project-name");
const projectSearchTerms = document.getElementById("project-search-terms");

const projectEditButton = document.getElementById("project-edit-button");
const projectRemixButton = document.getElementById("project-remix-button");
const projectDeleteButton = document.getElementById("project-delete-button");
const projectDetailsClose = document.getElementById("project-details-close");
const projectMoreSearchButton = document.getElementById("project-more-search-button");
const projectRelated = document.getElementById("project-related");
const relatedProjectGrid = document.getElementById("related-project-grid");
const relatedHeadingText = document.getElementById("related-heading-text");
const relatedCount = document.getElementById("related-count");
const previewStrokeWidth = document.getElementById("preview-stroke-width");
const previewStrokeValue = document.getElementById("preview-stroke-value");

let selectedHomeProject = null;

// =====================================
// REMIX EXISTING ICON
// =====================================

projectRemixButton?.addEventListener("click", () => {

    if (!selectedHomeProject) return;

    const sourceId = selectedHomeProject.id;

    // Save the current project before creating the remix
    saveProjectToBrowser();

    // Get the latest original project
    const sourceProject = projectManager.projects.find(
        project => project.id === sourceId
    );

    if (!sourceProject?.data) {
        alert("Could not find the original icon data.");
        return;
    }

    // Create a completely independent copy of its drawing data
    const copiedData = structuredClone(sourceProject.data);

    // Generate a unique remix name
    const baseName = `${sourceProject.name || "Untitled icon"} (Remix)`;

    let remixName = baseName;
    let count = 2;

    while (projectManager.projects.some(
        project => project.name.toLowerCase() === remixName.toLowerCase()
    )) {
        remixName = `${baseName} ${count++}`;
    }

    // Create the new project
    const remixProject = createProject(copiedData);

    remixProject.name = remixName;
    remixProject.category = sourceProject.category || "General";
    remixProject.searchTerms = [
        ...getProjectSearchTerms(sourceProject)
    ];

    remixProject.remixedFrom = sourceProject.id;

    // Add it to the project manager
    projectManager.projects.push(remixProject);

    saveProjectManager();

    // Open the new independent project
    const success = switchProject(remixProject.id);

    if (success) {

        closeProjectPreview();
        openIconEditor();

    }

});
// Delete finished icon
projectDeleteButton?.addEventListener("click", () => {

    if (!selectedHomeProject) return;

    const projectId = selectedHomeProject.id;
    const projectName = selectedHomeProject.name || "Untitled icon";

    const confirmed = confirm(
        `Are you sure you want to delete "${projectName}"?`
    );

    if (!confirmed) return;

    // Remove only the selected project
    projectManager.projects = projectManager.projects.filter(
        project => project.id !== projectId
    );

    // Save the updated project manager
    saveProjectManager();

    // Close preview and refresh the home gallery
    closeProjectPreview();
    renderHomeProjects();

});

// Search terms

function getProjectSearchTerms(project) {

    if (Array.isArray(project.searchTerms)) {
        return project.searchTerms;
    }

    const name = (project.name || "").trim().toLowerCase();

    if (["search", "magnifier", "magnifying glass"].includes(name)) {
        return [
            "search", "magnifier", "scan", "scanning", "browsing",
            "finding", "find", "lookup", "query", "locate", "explore",
            "discover", "browse", "inspect", "examine", "investigate",
            "magnifying glass", "lens", "zoom", "enlarge"
        ];
    }

    return [];
}
// =====================================
// FIND RELATED FINISHED PROJECTS
// =====================================

function renderRelatedProjects(project) {

    if (!project || !relatedProjectGrid) return;

    relatedProjectGrid.innerHTML = "";

    const terms = [
        project.name || "",
        ...getProjectSearchTerms(project)
    ]
        .map(term => term.trim().toLowerCase())
        .filter(Boolean);

    const relatedProjects = projectManager.projects.filter(item => {

        if (
            item.status !== "finished" ||
            item.id === project.id
        ) {
            return false;
        }

        const name = (item.name || "").toLowerCase();

        return terms.some(term => name.includes(term));

    });

    relatedHeadingText.textContent =
        `Other icons related to "${project.name}"`;

    relatedCount.textContent =
        `${relatedProjects.length} icons`;

    if (relatedProjects.length === 0) {

        relatedProjectGrid.innerHTML = `
            <p class="related-empty">
                No other finished icons match these terms yet.
            </p>
        `;

        return;
    }

    relatedProjects.forEach(item => {

        const card = document.createElement("button");

        card.className = "related-project-card";
        card.type = "button";
        card.dataset.projectId = item.id;

        if (item.thumbnail) {

            const image = document.createElement("img");

            image.src =
                "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(item.thumbnail);

            image.alt = item.name || "Icon";

            card.appendChild(image);

        }

        const name = document.createElement("span");

        name.textContent = item.name || "Untitled icon";

        card.appendChild(name);

        relatedProjectGrid.appendChild(card);

    });

}


// Preview SVG without changing the saved project

function getPreviewSVG(project, strokeWidth = 2) {

    if (!project?.thumbnail) return "";

    const svg = project.thumbnail.replace(
        /stroke-width="[^"]*"/g,
        `stroke-width="${strokeWidth}"`
    );

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}


// Open preview bar

function showProjectPreview(project) {

    if (!project || !projectDetails) return;

    selectedHomeProject = project;
    projectRelated.hidden = true;
    projectMoreSearchButton.textContent = "More icons with this name";
    renderRelatedProjects(project);

    projectName.textContent = project.name || "Untitled icon";

    previewStrokeWidth.value = 2;
    previewStrokeValue.textContent = "2.0";

    projectPreviewImage.src = getPreviewSVG(project, 2);

    projectSearchTerms.innerHTML = "";

    const terms = getProjectSearchTerms(project);

    if (terms.length) {

        terms.forEach(term => {

            const tag = document.createElement("span");
            tag.className = "project-search-term";
            tag.textContent = term;

            projectSearchTerms.appendChild(tag);

        });

    } else {

        const tag = document.createElement("span");
        tag.className = "project-search-term";
        tag.textContent = "No additional search terms yet";

        projectSearchTerms.appendChild(tag);

    }

    projectMoreSearchButton.textContent =
        `More icons with "${project.name}" in their name`;

    projectDetails.classList.add("show");
    projectDetails.setAttribute("aria-hidden", "false");

}


// Close preview bar

function closeProjectPreview() {

    projectDetails?.classList.remove("show");
    projectDetails?.setAttribute("aria-hidden", "true");

    selectedHomeProject = null;
    projectDetails.classList.remove("full-screen");
    projectRelated.hidden = true;
}


// Open editor screen

function openIconEditor() {
    homeScreen.classList.remove("show");
}


// Clicking a card opens preview only

homeScreen?.addEventListener("click", event => {

    const projectCard = event.target.closest(".home-project-card");

    if (!projectCard) return;

    const projectId = projectCard.dataset.projectId;

    const project = projectManager.projects.find(
        item => item.id === projectId
    );

    if (!project) return;

    showProjectPreview(project);

});


// Edit Icon button

projectEditButton?.addEventListener("click", () => {

    if (!selectedHomeProject) return;

    const projectId = selectedHomeProject.id;

    console.log("Selected project:", projectId);
    console.log("Project before switch:", selectedHomeProject);

    const success = switchProject(projectId);

    console.log("Switch result:", success);
    console.log("Loaded project:", projectManager.activeProjectId);
    console.log("Loaded shapes:", shapes.length);

    if (success) {
        closeProjectPreview();
        openIconEditor();
    }

});

// Close button

projectDetailsClose?.addEventListener("click", closeProjectPreview);


// Escape key closes preview

document.addEventListener("keydown", event => {

    if (event.key === "Escape" && selectedHomeProject) {
        closeProjectPreview();
    }

});


// Preview-only stroke width slider

previewStrokeWidth?.addEventListener("input", () => {

    if (!selectedHomeProject) return;

    const value = Number(previewStrokeWidth.value);

    previewStrokeValue.textContent = value.toFixed(1);

    projectPreviewImage.src = getPreviewSVG(
        selectedHomeProject,
        value
    );

});


// =====================================
// SHOW / HIDE RELATED ICONS
// =====================================

projectMoreSearchButton?.addEventListener("click", () => {
    if (!selectedHomeProject) return;

    const isExpanded = projectDetails.classList.toggle("full-screen");

    projectRelated.hidden = !isExpanded;

    projectMoreSearchButton.textContent = isExpanded
        ? "Show less"
        : "More icons with this name";
});
// =====================================
// SELECT A RELATED ICON
// =====================================

relatedProjectGrid?.addEventListener("click", event => {

    const card = event.target.closest(".related-project-card");

    if (!card) return;

    const project = projectManager.projects.find(
        item => item.id === card.dataset.projectId
    );

    if (!project) return;

    showProjectPreview(project);

});


// Home Edit button

homeEditButton?.addEventListener("click", () => {
    console.log("NAVBAR EDIT CLICKED");

    closeProjectPreview();
    createNewProject();
    openIconEditor();

    console.log("Home screen:", homeScreen.classList.contains("show"));
});


document.addEventListener("click", event => {
    if (
        fileDropdown &&
        !event.target.closest(".file-menu-wrapper")
    ) {
        fileDropdown.classList.remove("show");
    }
});

function formatSVGNumber(value) {
    return Number(Number(value).toFixed(4)).toString();
}
// =====================================
// PATH DATA GENERATOR
// =====================================

function createPathData(points, curved = false, closePath = true) {

    if (points.length < 2) return "";

    // STRAIGHT MODE
    if (!curved) {

        const path = points.map((point, index) =>
            `${index === 0 ? "M" : "L"} ${formatSVGNumber(point.x)} ${formatSVGNumber(point.y)}`
        ).join(" ");

        return closePath ? path + " Z" : path;
    }

    // CURVE MODE
    if (points.length < 3) {
        if (!closePath) {
            return points.map((point, index) =>
                `${index === 0 ? "M" : "L"} ${formatSVGNumber(point.x)} ${formatSVGNumber(point.y)}`
            ).join(" ");
        }

        return "";
    }

    function midpoint(a, b) {
        return {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2
        };
    }

    let d;

    if (closePath) {

        const firstMidpoint = midpoint(
            points[points.length - 1],
            points[0]
        );

        d = `M ${formatSVGNumber(firstMidpoint.x)} ${formatSVGNumber(firstMidpoint.y)}`;

        points.forEach((point, index) => {

            const next = points[(index + 1) % points.length];
            const mid = midpoint(point, next);

            d += ` Q ${formatSVGNumber(point.x)} ${formatSVGNumber(point.y)} ${formatSVGNumber(mid.x)} ${formatSVGNumber(mid.y)}`;

        });

        return d + " Z";

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

// Supports both older hole arrays and the new saved format.
function getPathParts(shape) {

    return [
        {
            points: shape.points,
            curved: shape.curved || false
        },

        ...(shape.holes || []).map(hole => {

            // Older format: hole is just an array of points.
            if (Array.isArray(hole)) {
                return {
                    points: hole,
                    curved: false
                };
            }

            // New format: hole stores points and curve setting.
            return hole;

        })
    ];
}


function generateSVG(colorMode = "original") {

    const artwork = [];

    shapes.forEach(shape => {

        // Ignore hidden layers
        if (shape.hidden) return;

        const strokeColor =
            colorMode === "white" ? "#FFFFFF" :
                colorMode === "black" ? "#000000" :
                    shape.color;


        // LINE
        if (shape.type === "line") {

            artwork.push(
                `    <line
        x1="${formatSVGNumber(shape.x1)}"
        y1="${formatSVGNumber(shape.y1)}"
        x2="${formatSVGNumber(shape.x2)}"
        y2="${formatSVGNumber(shape.y2)}"
        stroke="${strokeColor}"
        stroke-width="${formatSVGNumber(shape.width)}"
        stroke-linecap="${shape.cap || "round"}"
        fill="none"
    />`
            );

        }


        // CURVE
        else if (shape.type === "curve") {

            const startX = shape.cx + shape.radius * Math.cos(shape.startAngle);
            const startY = shape.cy + shape.radius * Math.sin(shape.startAngle);

            const endX = shape.cx + shape.radius * Math.cos(shape.endAngle);
            const endY = shape.cy + shape.radius * Math.sin(shape.endAngle);

            let delta = shape.endAngle - shape.startAngle;

            while (delta < 0) delta += Math.PI * 2;
            while (delta >= Math.PI * 2) delta -= Math.PI * 2;

            const largeArc = delta > Math.PI ? 1 : 0;

            const path =
                `M ${formatSVGNumber(startX)} ${formatSVGNumber(startY)} ` +
                `A ${formatSVGNumber(shape.radius)} ${formatSVGNumber(shape.radius)} 0 ${largeArc} 1 ` +
                `${formatSVGNumber(endX)} ${formatSVGNumber(endY)}`;

            artwork.push(
                `    <path
        d="${path}"
        fill="none"
        stroke="${strokeColor}"
        stroke-width="${formatSVGNumber(shape.strokeWidth)}"
        stroke-linecap="round"
    />`
            );

        }


        // PATH
        else if (shape.type === "path") {

            const pathData = getPathParts(shape)
                .map(item =>
                    createPathData(item.points, item.curved)
                )
                .join(" ");

            artwork.push(
                `    <path
        d="${pathData}"
        fill="${shape.fill || "none"}"
        fill-rule="evenodd"
        stroke="${strokeColor}"
        stroke-width="${formatSVGNumber(shape.strokeWidth)}"
        stroke-linecap="round"
        stroke-linejoin="round"
    />`
            );

        }


        // CIRCLE
        else if (shape.type === "circle") {

            artwork.push(
                `    <circle
        cx="${formatSVGNumber(shape.cx)}"
        cy="${formatSVGNumber(shape.cy)}"
        r="${formatSVGNumber(shape.radius)}"
        fill="${shape.fill || "none"}"
        stroke="${strokeColor}"
        stroke-width="${formatSVGNumber(shape.strokeWidth)}"
    />`
            );

        }


        // RECTANGLE
        else if (shape.type === "rectangle") {

            artwork.push(
                `    <rect
        x="${formatSVGNumber(shape.x)}"
        y="${formatSVGNumber(shape.y)}"
        width="${formatSVGNumber(shape.width)}"
        height="${formatSVGNumber(shape.height)}"
        fill="${shape.fill || "none"}"
        stroke="${strokeColor}"
        stroke-width="${formatSVGNumber(shape.strokeWidth)}"
    />`
            );

        }

    });


    return [
        `<svg`,
        `    xmlns="http://www.w3.org/2000/svg"`,
        `    width="24"`,
        `    height="24"`,
        `    viewBox="0 0 24 24"`,
        `>`,
        artwork.join("\n\n"),
        `</svg>`
    ].join("\n");

}

document.addEventListener("keydown", function (event) {
    // Ignore shortcuts while typing in fields
    const isTyping =
        event.target.matches("input, textarea, select") ||
        event.target.isContentEditable;

    if (isTyping) return;


    // DUPLICATE: Ctrl + D
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "d"
    ) {

        if (selectedShapes.length === 0) return;

        event.preventDefault();
        duplicateSelectedShapes();
        return;

    }


    // COPY SHAPES: Ctrl + C
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "c"
    ) {

        if (selectedShapes.length === 0) return;

        event.preventDefault();
        copySelectedShapes();
        return;

    }


    // PASTE SHAPES: Ctrl + V
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "v"
    ) {

        if (copiedShapes.length === 0) return;

        event.preventDefault();
        pasteCopiedShapes();
        return;

    }
    // UNDO: Ctrl + Z
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "z" &&
        !event.shiftKey
    ) {

        if (
            event.target.matches("input, textarea") ||
            event.target.isContentEditable
        ) return;

        event.preventDefault();
        undoAction();
        return;
    }

    // REDO: Ctrl + Y or Ctrl + Shift + Z
    if (
        (event.ctrlKey || event.metaKey) &&
        (
            event.key.toLowerCase() === "y" ||
            (event.key.toLowerCase() === "z" && event.shiftKey)
        )
    ) {

        if (
            event.target.matches("input, textarea") ||
            event.target.isContentEditable
        ) return;

        event.preventDefault();
        redoAction();
        return;
    }
    if (event.key === "Enter" && pathDrawing) {
        event.preventDefault();
        finishPath();
    }

    if (event.key === "Escape" && pathDrawing) {
        pathDrawing.preview.remove();
        pathDrawing = null;
        commitHistoryAction();
    }
});

// =====================================
// 23. UPDATE SVG SOURCE PANEL
// =====================================

function updateSVGSource() {

    if (!svgCode) return;

    svgCode.value = generateSVG();

}
// =====================================
// 23A. APPLY SVG SOURCE
// =====================================

function parseSVGNumber(value, defaultValue) {

    if (value === null || value.trim() === "") {
        return defaultValue;
    }

    // Only accept ordinary SVG numbers
    if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) {
        throw new Error("Invalid number: " + value);
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error("Invalid number.");
    }

    return number;
}


function parseSVGColor(value, defaultValue) {

    if (!value) return defaultValue;

    value = value.trim();

    // Accept hexadecimal colors
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
        return value;
    }

    // Accept simple named colors
    if (/^[a-zA-Z]+$/.test(value)) {
        return value;
    }

    throw new Error("Unsupported color: " + value);
}


function readSVGSource() {

    const parser = new DOMParser();

    const documentSVG = parser.parseFromString(
        svgCode.value,
        "image/svg+xml"
    );

    if (documentSVG.querySelector("parsererror")) {
        throw new Error("The SVG code contains invalid XML.");
    }

    const root = documentSVG.documentElement;

    if (
        root.localName !== "svg" ||
        root.namespaceURI !== "http://www.w3.org/2000/svg"
    ) {
        throw new Error("The document must have an SVG root element.");
    }

    const viewBox = root.getAttribute("viewBox");

    if (viewBox && viewBox.trim() !== "0 0 24 24") {
        throw new Error("Please use viewBox='0 0 24 24'.");
    }

    const parsedShapes = [];

    Array.from(root.children).forEach(element => {

        const type = element.localName;

        if (
            element.namespaceURI !==
            "http://www.w3.org/2000/svg"
        ) {
            throw new Error("Unsupported SVG element.");
        }

        if (!["line", "circle", "rect", "path"].includes(type)) {
            throw new Error(
                "Unsupported element: <" + type + ">. Use line, circle, rect, or path."
            );
        }

        const color = parseSVGColor(
            element.getAttribute("stroke"),
            "#FFFFFF"
        );

        const fill = parseSVGColor(
            element.getAttribute("fill"),
            "none"
        );

        const strokeWidth = parseSVGNumber(
            element.getAttribute("stroke-width"),
            2
        );

        if (strokeWidth < 0.1 || strokeWidth > 5) {
            throw new Error("Stroke width must be between 0.1 and 5.");
        }

        const shape = {
            type,
            color,
            fill,
            strokeWidth
        };

        if (type === "line") {

            shape.x1 = parseSVGNumber(element.getAttribute("x1"), 0);
            shape.y1 = parseSVGNumber(element.getAttribute("y1"), 0);
            shape.x2 = parseSVGNumber(element.getAttribute("x2"), 0);
            shape.y2 = parseSVGNumber(element.getAttribute("y2"), 0);

            shape.cap = element.getAttribute("stroke-linecap") || "round";

            if (!["round", "butt", "square"].includes(shape.cap)) {
                throw new Error("Unsupported line cap.");
            }

            if (
                [shape.x1, shape.y1, shape.x2, shape.y2]
                    .some(value => value < 0 || value > 24)
            ) {
                throw new Error("Line coordinates must be between 0 and 24.");
            }

        }

        else if (type === "circle") {

            shape.cx = parseSVGNumber(element.getAttribute("cx"), 12);
            shape.cy = parseSVGNumber(element.getAttribute("cy"), 12);
            shape.radius = parseSVGNumber(element.getAttribute("r"), 2.5);

            if (
                shape.radius <= 0 ||
                shape.cx - shape.radius < 0 ||
                shape.cy - shape.radius < 0 ||
                shape.cx + shape.radius > 24 ||
                shape.cy + shape.radius > 24
            ) {
                throw new Error("Circle must fit inside the 24 × 24 workspace.");
            }

        }

        else if (type === "rect") {

            if (
                element.hasAttribute("rx") ||
                element.hasAttribute("ry")
            ) {
                throw new Error("Rounded rectangles are not supported yet.");
            }

            shape.x = parseSVGNumber(element.getAttribute("x"), 0);
            shape.y = parseSVGNumber(element.getAttribute("y"), 0);
            shape.width = parseSVGNumber(element.getAttribute("width"), 5);
            shape.height = parseSVGNumber(element.getAttribute("height"), 4);

            if (
                shape.width <= 0 ||
                shape.height <= 0 ||
                shape.x < 0 ||
                shape.y < 0 ||
                shape.x + shape.width > 24 ||
                shape.y + shape.height > 24
            ) {
                throw new Error("Rectangle must fit inside the 24 × 24 workspace.");
            }

        }
        else if (type === "path") {

            const d = element.getAttribute("d") || "";

            const arcMatch = d.match(
                /^\s*M\s*([-\d.]+)[,\s]+([-\d.]+)\s+A\s*([-\d.]+)[,\s]+([-\d.]+)\s+0\s+([01])\s+([01])\s+([-\d.]+)[,\s]+([-\d.]+)\s*$/i
            );

            if (!arcMatch) {
                throw new Error(
                    "Only simple circular arc paths are supported currently."
                );
            }

            const [
                ,
                x1, y1,
                rx, ry,
                largeArc,
                sweep,
                x2, y2
            ] = arcMatch;

            const startX = Number(x1);
            const startY = Number(y1);
            const endX = Number(x2);
            const endY = Number(y2);

            const radiusX = Number(rx);
            const radiusY = Number(ry);

            if (
                Math.abs(radiusX - radiusY) > 0.001 ||
                radiusX <= 0 ||
                largeArc !== "0"
            ) {
                throw new Error("Only simple circular arcs are supported.");
            }

            shape.type = "importedArc";
            shape.startX = startX;
            shape.startY = startY;
            shape.endX = endX;
            shape.endY = endY;
            shape.radius = radiusX;
            shape.sweep = Number(sweep);

        }

        parsedShapes.push(shape);

    });

    return parsedShapes;
}


applyCodeButton.addEventListener("click", function () {

    let parsedShapes;

    // Validate everything BEFORE changing the workspace
    try {

        parsedShapes = readSVGSource();

    }

    catch (error) {

        alert("Could not apply SVG:\n" + error.message);
        return;

    }


    // =================================
    // SAVE UNDO HISTORY
    // =================================

    beginHistoryAction();


    // =================================
    // REMOVE OLD SHAPES
    // =================================

    shapes.forEach(shape => {

        getShapeElements(shape).forEach(element => {
            element.remove();
        });

        shape.handles?.forEach(handle => {
            handle.remove();
        });

    });

    shapes = [];

    selectedShape = null;
    selectedShapes = [];

    dragging = null;


    // =================================
    // CREATE NEW EDITABLE SHAPES
    // =================================

    parsedShapes.forEach(data => {

        // IMPORT ARC AS AN EDITABLE CURVE
        if (data.type === "importedArc") {

            const cx = (data.startX + data.endX) / 2;
            const cy = (data.startY + data.endY) / 2;

            createCurve(cx, cy);

            const shape = shapes[shapes.length - 1];

            shape.radius = data.radius;

            shape.startAngle = Math.atan2(
                data.startY - cy,
                data.startX - cx
            );

            shape.endAngle = Math.atan2(
                data.endY - cy,
                data.endX - cx
            );

            shape.color = data.color;
            shape.strokeWidth = data.strokeWidth;

            updateCurve(shape);
            updateCurveHandles(shape);

        }

        else if (data.type === "line") {

            createLine(data.x1, data.y1);

            const shape = shapes[shapes.length - 1];

            shape.x1 = data.x1;
            shape.y1 = data.y1;
            shape.x2 = data.x2;
            shape.y2 = data.y2;

            shape.color = data.color;
            shape.width = data.strokeWidth;
            shape.cap = data.cap;

            updateLine(shape);

        }

        else {

            const x = data.type === "circle"
                ? data.cx
                : data.x;

            const y = data.type === "circle"
                ? data.cy
                : data.y;

            createOtherShape(
                data.type === "rect" ? "rectangle" : data.type,
                x,
                y
            );
            const shape = shapes[shapes.length - 1];

            if (data.type === "circle") {

                shape.cx = data.cx;
                shape.cy = data.cy;
                shape.radius = data.radius;

            }

            else {

                shape.x = data.x;
                shape.y = data.y;
                shape.width = data.width;
                shape.height = data.height;

            }

            shape.color = data.color;
            shape.fill = data.fill;
            shape.strokeWidth = data.strokeWidth;

            updateBasicShape(shape);

        }

    });


    // =================================
    // CLEAR SELECTION
    // =================================

    selectShape(null);

    hideCenterGuides();

    renderLayers();
    updateMeasurementPanel();
    updatePropertiesPanel();
    updateSVGSource();
    bringHandlesToFront();

    commitHistoryAction();

});


// =====================================
// 24. COPY SVG CODE
// =====================================

copyCodeButton.addEventListener("click", async function () {

    const code = svgCode.value;
    try {

        await navigator.clipboard.writeText(code);

        copyCodeButton.textContent = "Copied!";

        setTimeout(() => {
            copyCodeButton.textContent = "Copy";
        }, 1500);

    }

    catch (error) {

        console.error("Could not copy SVG:", error);

    }

});


// =====================================
// 25. EXPORT SVG FILE
// =====================================

const exportModal = document.getElementById("export-modal");
const exportCancel = document.getElementById("export-cancel");
const exportOptions = document.querySelectorAll(".export-option");

// Open popup
exportButton.addEventListener("click", function () {
    exportModal.classList.add("show");
});

// Close popup
exportCancel.addEventListener("click", function () {
    exportModal.classList.remove("show");
});

// Download using selected color
exportOptions.forEach(option => {
    option.addEventListener("click", function () {
        const colorMode = this.dataset.color;
        const code = generateSVG(colorMode);

        const blob = new Blob([code], {
            type: "image/svg+xml;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "my-icon.svg";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        exportModal.classList.remove("show");
    });
});
// =====================================
// INITIALIZE PROJECTS + UNDO / REDO
// =====================================

// Load all saved projects from localStorage
loadProjectManager();

// Restore the last active project
restoreProjectFromBrowser();

// Render both project lists after loading
renderHomeProjects();
renderUnfinishedProjects();

// Update editor
updateSVGSource();

// Initialize undo / redo history
history = [getHistorySnapshot()];
historyIndex = 0;

updateHistoryButtons();


// =====================================
// COLLAPSIBLE PANELS
// =====================================

document.addEventListener("click", function (event) {
    const button = event.target.closest(".collapse-btn");

    if (!button) return;

    const section = button.closest(
        ".tools-panel, .properties-panel, .layers-panel, .svg, .measurement-panel"
    );

    if (!section) return;

    const content = section.querySelector(".collapse-content");

    if (!content) {
        console.warn("Collapse content not found:", section);
        return;
    }

    const willCollapse = content.style.display !== "none";

    // Hide or show the panel content directly
    content.style.display = willCollapse ? "none" : "";

    // Keep the class and accessibility state in sync
    content.classList.toggle("collapsed", willCollapse);
    button.setAttribute("aria-expanded", String(!willCollapse));
    button.title = willCollapse ? "Expand" : "Collapse";

    console.log(
        "Panel:",
        section.className,
        willCollapse ? "collapsed" : "expanded"
    );

}, true);
// =====================================
// WORKSPACE GUIDELINES
// =====================================

const showGuidelinesCheckbox =
    document.getElementById("show-guidelines");

const workspaceGuidelines =
    document.getElementById("workspace-guidelines");

showGuidelinesCheckbox.addEventListener("change", () => {

    workspaceGuidelines.style.display =
        showGuidelinesCheckbox.checked ? "inline" : "none";

});
// =====================================
// GLOBAL CUSTOMIZATION DEFAULTS
// =====================================

const globalIconColor = document.getElementById("global-icon-color");
const globalStrokeWidth = document.getElementById("global-stroke-width");
const globalIconSize = document.getElementById("global-icon-size");

const globalStrokeValue = document.getElementById("global-stroke-value");
const globalSizeValue = document.getElementById("global-size-value");

const resetGlobalCustomization = document.getElementById(
    "reset-global-customization"
);

const customizationSettings = [
    {
        input: globalIconColor,
        defaultValue: "#ffffff"
    },
    {
        input: globalStrokeWidth,
        defaultValue: "2"
    },
    {
        input: globalIconSize,
        defaultValue: "24"
    }
];


// =====================================
// CHECK CUSTOMIZATION CHANGES
// =====================================

function updateGlobalCustomizationState() {

    let hasChanges = false;

    customizationSettings.forEach(setting => {

        const isChanged =
            setting.input.value.toLowerCase() !==
            setting.defaultValue.toLowerCase();

        const control = setting.input.closest(".customization-control");

        control.classList.toggle("is-customized", isChanged);

        if (isChanged) {
            hasChanges = true;
        }
    });

    resetGlobalCustomization.disabled = !hasChanges;

    globalStrokeValue.textContent = `${globalStrokeWidth.value}px`;
    globalSizeValue.textContent = `${globalIconSize.value}px`;
}


// =====================================
// LISTEN FOR CHANGES
// =====================================

customizationSettings.forEach(setting => {

    setting.input.addEventListener("input", () => {
        updateGlobalCustomizationState();
    });

});


// =====================================
// RESET CUSTOMIZATION
// =====================================

resetGlobalCustomization.addEventListener("click", () => {

    customizationSettings.forEach(setting => {
        setting.input.value = setting.defaultValue;
    });

    updateGlobalCustomizationState();

    // Restart the rotation animation
    resetGlobalCustomization.classList.remove("is-rotating");

    void resetGlobalCustomization.offsetWidth;

    resetGlobalCustomization.classList.add("is-rotating");

});


// =====================================
// INITIAL STATE
// =====================================

updateGlobalCustomizationState();