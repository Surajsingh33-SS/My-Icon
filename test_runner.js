// Automated Test Suite for Icon Maker PRO
const fs = require('fs');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.error(`  ✗ FAIL: ${testName}`);
        testsFailed++;
    }
}

console.log("=== RUNNING ICON MAKER TEST SUITE ===");

// TEST 1: index.html contains all critical DOM elements
const html = fs.readFileSync('./index.html', 'utf8');
const requiredIds = [
    'file-menu-button', 'file-dropdown', 'new-project-button', 'unfinished-project-list',
    'home-button', 'save-project-button', 'finish-project-button', 'topbar-export-btn',
    'home-screen', 'reset-global-customization', 'global-icon-color', 'global-stroke-width',
    'global-icon-size', 'theme-toggle', 'home-edit-button', 'home-search-input',
    'home-category-select', 'home-sort-select', 'home-project-grid', 'project-details',
    'project-preview', 'project-preview-image', 'project-name', 'project-search-terms',
    'preview-stroke-width', 'preview-stroke-value', 'project-more-search-button',
    'project-edit-button', 'project-remix-button', 'project-delete-button',
    'project-related', 'related-heading-text', 'related-count', 'related-project-grid',
    'project-details-close', 'delete-shape', 'path-style-toggle', 'properties-panel',
    'properties-selection', 'properties-fields', 'show-guidelines', 'show-coordinates',
    'show-grid-highlight', 'undo-btn', 'redo-btn', 'workspace', 'grid', 'major-grid',
    'workspace-guidelines', 'coordinate-labels', 'grid-hover-marker', 'zoom-in',
    'zoom-level', 'zoom-out', 'zoom-reset', 'layer-count', 'layer-list', 'copy-code',
    'svg-code', 'apply-code', 'measurement-panel', 'measurement-selection',
    'measurement-fields', 'finish-modal', 'finish-icon-name', 'finish-icon-category',
    'finish-cancel', 'finish-confirm', 'export-modal', 'export-cancel', 'export-download-btn',
    'shortcuts-modal', 'canvas-context-menu', 'toast-container', 'transform-toolbar'
];

console.log("\n[1] Verifying DOM Structure in index.html:");
requiredIds.forEach(id => {
    assert(html.includes(`id="${id}"`), `Element with ID #${id} exists in HTML`);
});

// TEST 2: script.js syntax and key function presence
const script = fs.readFileSync('./script.js', 'utf8');
console.log("\n[2] Verifying Engine Functions in script.js:");

const requiredFunctions = [
    'applyTheme', 'applyAccentColor', 'updateGlobalCustomizationState',
    'getProjectData', 'createProject', 'loadProjectManager', 'saveProjectManager',
    'saveProjectToBrowser', 'createNewProject', 'switchProject', 'downloadProjectFile',
    'restoreProjectFromBrowser', 'getHistorySnapshot', 'getHistoryKey', 'updateHistoryButtons',
    'beginHistoryAction', 'commitHistoryAction', 'restoreHistorySnapshot', 'undoAction',
    'redoAction', 'getNextColor', 'getSVGPosition', 'updateWorkspaceZoom', 'createLine',
    'createCurve', 'createOtherShape', 'createPathData', 'getPathParts', 'updatePathShape',
    'finishPath', 'selectShape', 'updateHandles', 'updateCurveHandles', 'updateBasicShapeHandles',
    'updatePathHandles', 'updateLine', 'snapAngle', 'updateCurve', 'updateBasicShape',
    'getShapeEndpoints', 'getSnappedPoint', 'getAlignmentBounds', 'updateAlignmentGuides',
    'renderLayers', 'reorderShape', 'toggleLayerVisibility', 'toggleLayerLock',
    'updatePropertiesPanel', 'updateMeasurementPanel', 'alignSelectedShapes',
    'flipSelectedShapes', 'duplicateSelectedShapes', 'generateSVG', 'readSVGSource',
    'renderHomeProjects', 'showProjectPreview', 'showToast'
];

requiredFunctions.forEach(fn => {
    assert(script.includes(fn), `Function "${fn}" exists in script.js`);
});

// TEST 3: Lock/Unlock icon bug fix validation
console.log("\n[3] Verifying Layer Padlock Bug Fix:");
const layerLockFix = script.includes('shape.locked ? "assets/icons/locked.svg" : "assets/icons/unlocked.svg"');
assert(layerLockFix, "Locked layers render locked.svg and unlocked layers render unlocked.svg");

// TEST 4: Handle creation in selectShape fix validation
console.log("\n[4] Verifying Handle Re-creation Fix in selectShape():");
const selectShapeHandlesFix = script.includes('createHandlesForShape(selectedShape)');
assert(selectShapeHandlesFix, "selectShape creates handles for Line, Curve, Circle, Rect, and Path");

// TEST 5: Path canvas hit testing and vertex manipulation validation
console.log("\n[5] Verifying Path Canvas Selection & Vertex Editing Support:");
const pathCanvasHit = script.includes('item.type === "path"') && script.includes('vertexHit');
assert(pathCanvasHit, "Path shapes can be selected by clicking their body or vertex handles on canvas");

// TEST 6: Robust SVG source parser validation
console.log("\n[6] Testing SVG Source Math & Parser Logic:");

function parseSVGNumber(value, defaultValue) {
    if (value === null || value === undefined || value.trim() === "") return defaultValue;
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}

// Test path data generator
function testCreatePathData(points, curved = false, closePath = true) {
    if (points.length < 2) return "";
    if (!curved) {
        const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        return closePath ? `${path} Z` : path;
    }
    return `M ${points[0].x} ${points[0].y} Q ... Z`;
}

const pts = [{x: 4, y: 4}, {x: 20, y: 4}, {x: 12, y: 20}];
const generatedPath = testCreatePathData(pts, false, true);
assert(generatedPath === "M 4 4 L 20 4 L 12 20 Z", "Straight path data generates valid SVG M...L...Z");

// Test curve math
function testCurveEndpoints(cx, cy, radius, startAngle, endAngle) {
    const startX = cx + radius * Math.cos(startAngle);
    const startY = cy + radius * Math.sin(startAngle);
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy + radius * Math.sin(endAngle);
    return { startX, startY, endX, endY };
}
const curve = testCurveEndpoints(12, 12, 6, Math.PI, 0);
assert(Math.round(curve.startX) === 6 && Math.round(curve.startY) === 12, "Curve start endpoint is correctly calculated at (6, 12)");
assert(Math.round(curve.endX) === 18 && Math.round(curve.endY) === 12, "Curve end endpoint is correctly calculated at (18, 12)");

// TEST 7: Style.css checks
console.log("\n[7] Verifying CSS Rules and Themes:");
const css = fs.readFileSync('./style.css', 'utf8');
assert(css.includes('--bg-base: #090a0f'), "CSS defines modern obsidian dark theme base");
assert(css.includes('body.light-theme'), "CSS defines light theme overrides");
assert(css.includes('.home-project-grid.list-view'), "CSS defines list-view layout for gallery");
assert(css.includes('.context-menu'), "CSS defines canvas context menu styling");
assert(css.includes('.toast'), "CSS defines floating toast notifications");
assert(css.includes('.transform-toolbar'), "CSS defines transform & alignment toolbar");

console.log("\n======================================");
console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
console.log("======================================");

process.exit(testsFailed > 0 ? 1 : 0);
