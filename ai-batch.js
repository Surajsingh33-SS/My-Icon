import { pipeline, env } from '@huggingface/transformers';
import { CATEGORY_DATA } from './category-data.js';
import ICON_METADATA from './icon-metadata.json' with { type: 'json' };
import './category-engine.js';
import { loadVisualModel, getIconVisualScores, VISUAL_MODEL_ID } from './visual-analyzer.js';

const Engine = window.IconCategoryEngine;
const MODEL_ID = 'all-MiniLM-L6-v2';
const BATCH_SIZE = 8;
const DB_NAME = 'icon-maker-ai-categorization';
const STORE_NAME = 'results';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

const $ = id => document.getElementById(id);
const iconNames = Object.keys(ICON_METADATA).sort((a, b) => a.localeCompare(b));
let extractor = null;
let visualClassifier = null;
let categoryEmbeddings = [];
let running = false;
let pauseRequested = false;
let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction(mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let request;
    try { request = action(store); } catch (error) { reject(error); return; }
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Database transaction aborted'));
  });
}

const getAllRecords = () => transaction('readonly', store => store.getAll());
const putRecords = records => transaction('readwrite', store => {
  records.forEach(record => store.put(record));
});

async function clearAIResults() {
  const records = await getAllRecords();
  await transaction('readwrite', store => {
    records.forEach(record => {
      // Generated analysis is disposable; human decisions and edited metadata are not.
      delete record.aiSuggestions;
      delete record.analyzedAt;
      delete record.analysisVersion;
      delete record.visualScores;
      delete record.visualAnalyzedAt;
      delete record.visualModelVersion;
      delete record.visualError;
      if (record.reviewedAt || Array.isArray(record.manualCategories) || record.metadataEdits) {
        store.put(record);
      } else {
        store.delete(record.name);
      }
    });
  });
}

async function loadModel() {
  if (extractor) return;
  $('load').disabled = true;
  $('status').textContent = 'Loading local semantic model files...';
  try {
    extractor = await pipeline('feature-extraction', MODEL_ID, {
      dtype: 'q4',
      progress_callback: progress => {
        const stage = progress.status || 'Loading';
        const file = progress.file || '';
        const percent = typeof progress.progress === 'number'
          ? ' (' + progress.progress.toFixed(1) + '%)' : '';
        $('status').textContent = 'Model: ' + stage + ' ' + file + percent;
      }
    });

    $('status').textContent = 'Preparing shared category reference embeddings...';
    const output = await extractor(
      CATEGORY_DATA.map(item => item.name + '. ' + item.description),
      { pooling: 'mean', normalize: true }
    );
    categoryEmbeddings = output.tolist();
    $('start').disabled = false;
    $('load').textContent = 'AI Model Ready';
    $('status').textContent = 'Semantic model ready. You can also load CLIP for actual SVG visual analysis.';
  } catch (error) {
    extractor = null;
    $('load').disabled = false;
    $('status').textContent = 'Model loading failed: ' + error.message;
  }
}

async function loadVisualAI() {
  if (visualClassifier) return;
  $('load-visual').disabled = true;
  $('status').textContent = 'Loading CLIP visual model. First load downloads model files and requires internet...';
  try {
    visualClassifier = await loadVisualModel(progress => {
      const stage = progress.status || 'Loading';
      const file = progress.file || '';
      const percent = typeof progress.progress === 'number' ? ' (' + progress.progress.toFixed(1) + '%)' : '';
      $('status').textContent = 'Visual model: ' + stage + ' ' + file + percent;
    });
    $('load-visual').textContent = 'Visual Model Ready';
    $('start').disabled = false;
    $('status').textContent = 'CLIP is ready. Batch analysis will inspect actual SVG artwork and combine it with metadata.';
    await updateStats();
  } catch (error) {
    visualClassifier = null;
    $('load-visual').disabled = false;
    $('status').textContent = 'Visual model loading failed: ' + error.message;
  }
}

function hasMetadataAnalysis(record) {
  return record.analysisVersion >= Engine.version &&
    Boolean(record.analyzedAt) &&
    Array.isArray(record.aiSuggestions);
}

function hasSuccessfulVisualAnalysis(record) {
  return !record.visualError && record.visualModelVersion === VISUAL_MODEL_ID &&
    Boolean(record.visualAnalyzedAt) &&
    Array.isArray(record.visualScores) &&
    record.visualScores.length > 0;
}

function isAnalysisComplete(record) {
  return hasMetadataAnalysis(record) &&
    (!visualClassifier || hasSuccessfulVisualAnalysis(record));
}

async function updateStats() {
  const records = await getAllRecords();
  const metadataDone = records.filter(hasMetadataAnalysis).length;
  const visualDone = records.filter(hasSuccessfulVisualAnalysis).length;
  const reviewed = records.filter(record => record.reviewedAt).length;
  // The primary batch task is visual recognition. Never show metadata-only
  // completion as if CLIP had inspected the SVG artwork.
  const completed = visualDone;
  $('done').textContent = completed;
  $('reviewed').textContent = reviewed;
  $('remaining').textContent = Math.max(0, iconNames.length - visualDone);
  $('total').textContent = iconNames.length;
  $('progress').max = iconNames.length;
  $('progress').value = visualDone;

  const visualFailed = records.filter(record =>
    record.visualError && !hasSuccessfulVisualAnalysis(record)
  ).length;
  const visualPending = Math.max(0, iconNames.length - visualDone);
  if (visualClassifier) {
    $('status').dataset.progress = 'visual';
    $('status').textContent = 'CLIP visual progress: ' + visualDone + '/' + iconNames.length +
      ' successful; ' + visualPending + ' remaining; ' + visualFailed + ' failed and retryable. ' +
      'Metadata analyzed: ' + metadataDone + '/' + iconNames.length + '.';
  } else {
    $('status').dataset.progress = 'visual';
    $('status').textContent = 'Visual analysis: ' + visualDone + '/' + iconNames.length +
      ' successful; ' + visualPending + ' remaining. Metadata analysis: ' +
      metadataDone + '/' + iconNames.length + '. Click Start / Resume Batch to load CLIP and begin visual analysis.';
  }
}

function getEmbeddingScores(vector) {
  return CATEGORY_DATA.map((category, index) => {
    let score = 0;
    const reference = categoryEmbeddings[index] || [];
    for (let i = 0; i < Math.min(vector.length, reference.length); i++) {
      score += vector[i] * reference[i];
    }
    return { name: category.name, score };
  });
}

async function analyzeBatch(names) {
  const existingRecords = await getAllRecords();
  const existingByName = new Map(existingRecords.map(record => [record.name, record]));
  const vectorsByName = new Map();

  if (extractor) {
    const descriptions = names.map(name => {
      const record = ICON_METADATA[name] || {};
      const lucide = record.lucide || {};
      const ai = record.ai || {};
      return [
        'Icon name: ' + name.replace(/[-_]/g, ' ') + '.',
        ai.description || '',
        lucide.tags?.length ? 'Tags: ' + lucide.tags.join(', ') + '.' : '',
        lucide.aliases?.length ? 'Aliases: ' + lucide.aliases.map(alias =>
          typeof alias === 'string' ? alias : (alias.name || alias.alias || '')
        ).filter(Boolean).join(', ') + '.' : '',
        lucide.useCases?.length ? 'Use cases: ' + lucide.useCases.join(', ') + '.' : '',
        ai.searchTerms?.length ? 'Search terms: ' + ai.searchTerms.join(', ') + '.' : '',
        lucide.categories?.length ? 'Official categories: ' + lucide.categories.filter(value => typeof value === 'string' && !/^\\$(?:group|extends):/i.test(value)).join(', ') + '.' : ''
      ].filter(Boolean).join(' ');
    });
    const output = await extractor(descriptions, { pooling: 'mean', normalize: true });
    output.tolist().forEach((vector, index) => vectorsByName.set(names[index], vector));
  }

  const records = [];
  for (const name of names) {
    const existing = existingByName.get(name) || {};
    let visualScores = Array.isArray(existing.visualScores) ? existing.visualScores : [];
    let visualError = existing.visualError || null;
    if (visualClassifier) {
      try {
        visualScores = await getIconVisualScores(visualClassifier, name, CATEGORY_DATA);
        visualError = null;
      } catch (error) {
        visualError = error.message;
      }
    }
    const vector = vectorsByName.get(name);
    const embeddingScores = vector ? getEmbeddingScores(vector) : [];
    const analysis = Engine.classify(name, ICON_METADATA[name] || {}, existing, {
      categoryData: CATEGORY_DATA, embeddingScores, visualScores,
      threshold: 0.52, maxSuggestions: 8
    });
    const now = new Date().toISOString();
    const visualSucceeded = Boolean(visualClassifier && !visualError && visualScores.length);
    records.push({
      ...existing,
      name,
      officialCategories: analysis.officialCategories,
      primaryCategory: analysis.primaryCategory,
      secondaryCategories: analysis.secondaryCategories,
      aiSuggestions: analysis.suggestions,
      analyzedAt: now,
      analysisVersion: Engine.version,
      visualScores,
      // Failed visual decoding stays incomplete so Resume can retry it.
      visualAnalyzedAt: visualClassifier ? (visualSucceeded ? now : null) : existing.visualAnalyzedAt || null,
      visualModelVersion: visualClassifier ? (visualSucceeded ? VISUAL_MODEL_ID : null) : existing.visualModelVersion || null,
      visualError
    });
  }
  // Existing manual decisions and metadata edits survive every analysis pass.
  await putRecords(records);
}
async function runBatches() {
  if ((!extractor && !visualClassifier) || running) return;
  running = true;
  pauseRequested = false;
  $('start').disabled = true;
  $('pause').disabled = false;
  const attemptedThisRun = new Set();
  try {
    while (!pauseRequested) {
      const records = await getAllRecords();
      const completed = new Set(records.filter(isAnalysisComplete).map(record => record.name));
      const pending = iconNames.filter(name => !completed.has(name) && !attemptedThisRun.has(name));
      const next = pending.slice(0, BATCH_SIZE);
      if (!next.length) {
        const failed = iconNames.length - completed.size;
        if (visualClassifier) {
          $('status').textContent = failed
            ? 'CLIP pass finished: ' + completed.size + '/' + iconNames.length +
              ' icons visually analyzed successfully; ' + failed +
              ' remain (including failed decodes). Click Start / Resume Batch to retry.'
            : 'CLIP visual analysis complete: all ' + iconNames.length +
              ' icons were successfully inspected by the visual model.';
        } else {
          $('status').textContent = failed
            ? 'Metadata pass finished: ' + completed.size + '/' + iconNames.length +
              ' icons analyzed; ' + failed + ' metadata analyses remain.'
            : 'Metadata analysis complete for all ' + iconNames.length +
              ' icons. This does NOT mean CLIP inspected the SVG artwork. Load CLIP Visual Model, then run Start / Resume Batch for visual analysis.';
        }
        break;
      }
      next.forEach(name => attemptedThisRun.add(name));
      $('status').textContent = 'Analyzing batch ' + attemptedThisRun.size + ' of ' + iconNames.length + '...';
      await analyzeBatch(next);
      await updateStats();
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    if (pauseRequested) $('status').textContent = 'Paused. Completed batches are saved; use Start / Resume Batch to continue.';
  } catch (error) {
    $('status').textContent = 'Batch stopped: ' + error.message + '. Completed batches remain saved.';
  } finally {
    running = false;
    $('start').disabled = !(extractor || visualClassifier);
    $('pause').disabled = true;
    await updateStats();
    await renderResults();
  }
}

function makeChip(name, checked, evidence = []) {
  const label = document.createElement('label');
  label.className = 'chip';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = name;
  input.checked = checked;
  const text = document.createElement('span');
  text.textContent = name;
  label.append(input, text);
  if (evidence.length) label.title = evidence.join('\n');
  return label;
}

async function renderResults(query = '') {
  const all = await getAllRecords();
  const normalized = query.trim().toLowerCase();
  let records = all.filter(record =>
    record.analysisVersion >= Engine.version &&
    (!normalized || record.name.toLowerCase().includes(normalized))
  );
  records.sort((a, b) => (b.analyzedAt || '').localeCompare(a.analyzedAt || ''));
  records = records.slice(0, 30);

  const root = $('results');
  root.replaceChildren();
  if (!records.length) {
    const empty = document.createElement('p');
    empty.textContent = normalized
      ? 'No current-engine results match that search.'
      : 'No results from the current engine yet. Start the batch to analyze all icons.';
    root.append(empty);
    return;
  }

  for (const record of records) {
    const card = document.createElement('article');
    card.className = 'item';

    const heading = document.createElement('h3');
    heading.textContent = record.name;
    const badge = document.createElement('span');
    badge.className = 'tag';
    badge.textContent = record.reviewedAt ? 'Manually reviewed' : 'Awaiting review';
    card.append(heading, badge);
    if (record.visualError) {
      const visualWarning = document.createElement('p');
      visualWarning.className = 'muted';
      visualWarning.textContent = 'Visual analysis issue: ' + record.visualError;
      card.append(visualWarning);
    }

    const officialTitle = document.createElement('p');
    officialTitle.textContent = 'Official Lucide categories';
    card.append(officialTitle);
    const chips = document.createElement('div');
    chips.className = 'chips';

    const selected = Array.isArray(record.manualCategories) && record.manualCategories.length
      ? record.manualCategories : (record.officialCategories || []);
    (record.officialCategories || []).forEach(name =>
      chips.append(makeChip(name, selected.includes(name), ['Official Lucide category']))
    );
    card.append(chips);

    const aiTitle = document.createElement('p');
    aiTitle.textContent = 'Shared-engine suggestions — select only the categories that genuinely fit';
    card.append(aiTitle);
    const aiChips = document.createElement('div');
    aiChips.className = 'chips';

    (record.aiSuggestions || []).forEach(item => {
      const chip = makeChip(item.name, selected.includes(item.name), item.evidence || []);
      const score = document.createElement('small');
      score.textContent = ' ' + Math.round((item.confidence ?? item.score) * 100) + '%';
      chip.append(score);
      aiChips.append(chip);
    });
    card.append(aiChips);

    const customRow = document.createElement('div');
    customRow.className = 'controls';
    customRow.style.margin = '10px 0';
    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.placeholder = 'Add another category name';
    customInput.setAttribute('aria-label', 'Custom category name');
    const addCustom = document.createElement('button');
    addCustom.textContent = 'Add category';
    addCustom.addEventListener('click', () => {
      const value = customInput.value.trim();
      if (!value) return;
      const alreadyExists = [...card.querySelectorAll('input[type="checkbox"]')]
        .some(input => input.value.toLowerCase() === value.toLowerCase());
      if (alreadyExists) { customInput.value = ''; return; }
      const customChip = makeChip(value, true);
      customChip.dataset.custom = 'true';
      card.append(customChip);
      customInput.value = '';
    });
    customRow.append(customInput, addCustom);
    card.append(customRow);

    const save = document.createElement('button');
    save.className = 'primary';
    save.textContent = 'Save my categories';
    save.addEventListener('click', async () => {
      const chosen = [...card.querySelectorAll('input[type="checkbox"]:checked')]
        .map(input => input.value);
      record.manualCategories = unique(chosen);
      record.reviewedAt = new Date().toISOString();
      await putRecords([record]);
      await updateStats();
      badge.textContent = 'Manually reviewed';
      save.textContent = 'Saved';
      apply.disabled = record.manualCategories.length === 0;
      apply.title = apply.disabled
        ? 'Select at least one category before applying.'
        : 'Apply these manually selected categories to matching finished Gallery icons.';
    });
    card.append(save);

    const apply = document.createElement('button');
    apply.textContent = 'Apply reviewed categories to Gallery';
    apply.style.marginLeft = '8px';
    apply.disabled = !record.reviewedAt ||
      !Array.isArray(record.manualCategories) || record.manualCategories.length === 0;
    apply.title = apply.disabled
      ? 'Save your category selection first.'
      : 'Set these categories as the manual categories for matching finished icons in Icon Maker PRO.';
    apply.addEventListener('click', () => {
      try {
        const raw = localStorage.getItem('iconMakerProjects');
        if (!raw) throw new Error('No saved Icon Maker PRO projects were found in this browser.');
        const manager = JSON.parse(raw);
        if (!manager || !Array.isArray(manager.projects)) {
          throw new Error('The saved project data is not in the expected format.');
        }
        const normalize = value => String(value || '').trim().toLowerCase()
          .replace(/[_\s]+/g, '-').replace(/-+/g, '-');
        const matches = manager.projects.filter(project =>
          normalize(project.name) === normalize(record.name) && project.status === 'finished'
        );
        if (!matches.length) {
          throw new Error('No finished Gallery icon named "' + record.name + '" was found. Check that its project name matches the icon name.');
        }
        const categories = unique(record.manualCategories);
        if (!categories.length) throw new Error('Save at least one category before applying.');
        matches.forEach(project => {
          project.manualCategories = [...categories];
          project.categories = [...categories];
          project.categorySource = 'manual';
          project.category = categories[0];
        });
        localStorage.setItem('iconMakerProjects', JSON.stringify(manager));
        apply.textContent = 'Applied to Gallery (' + matches.length + ')';
        apply.disabled = true;
        $('status').textContent = 'Applied ' + categories.length + ' manual category/categories to ' +
          matches.length + ' finished Gallery project(s). Refresh Icon Maker PRO to see the update.';
      } catch (error) {
        $('status').textContent = 'Could not apply categories: ' + error.message;
      }
    });
    card.append(apply);
    root.append(card);
  }
}

async function initialize() {
  try {
    if (!Engine || typeof Engine.classify !== 'function') {
      throw new Error('The shared category engine could not be initialized.');
    }
    db = await openDatabase();
    await updateStats();
    await renderResults();
    $('status').textContent = 'Ready. For actual SVG recognition, load CLIP Visual Model before starting. Text-only runs are metadata analysis, not visual analysis. Shared engine v' + Engine.version + '.';
  } catch (error) {
    $('status').textContent = 'Initialization failed: ' + error.message;
  }
}

$('load').addEventListener('click', loadModel);
$('load-visual').addEventListener('click', loadVisualAI);
$('start').addEventListener('click', async () => {
  // Start always means visual analysis. Load CLIP automatically so users cannot
  // accidentally run metadata-only analysis and receive a false "complete" state.
  if (!visualClassifier) {
    await loadVisualAI();
    if (!visualClassifier) return;
  }
  await runBatches();
});
$('pause').addEventListener('click', () => { pauseRequested = true; $('pause').disabled = true; });
$('reset').addEventListener('click', async () => {
  if (!confirm('Clear generated AI analysis? Saved manual category reviews and metadata edits will be kept.')) return;
  await clearAIResults();
  await updateStats();
  await renderResults();
  $('status').textContent = 'Generated analysis cleared. Manual reviews and metadata edits were preserved.';
});
$('search').addEventListener('input', event => renderResults(event.target.value));
$('show-all').addEventListener('click', () => { $('search').value = ''; renderResults(); });

initialize();
