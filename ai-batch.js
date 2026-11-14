import { pipeline, env } from '@huggingface/transformers';
import { CATEGORY_DATA } from './category-data.js';
import ICON_METADATA from './icon-metadata.json';

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';

const MODEL_ID = 'all-MiniLM-L6-v2';
const BATCH_SIZE = 8;
const DB_NAME = 'icon-maker-ai-categorization';
const STORE_NAME = 'results';
const LUCIDE_CATEGORY_MAP = {
  accessibility:'Accessibility', account:'Accounts & access', animals:'Animals',
  arrows:'Arrows', buildings:'Buildings', charts:'Charts', communication:'Communication',
  connectivity:'Connectivity', cursors:'Cursors', design:'Design',
  development:'Coding & development', devices:'Devices', emoji:'Emoji', files:'File icons',
  finance:'Finance', 'food-beverage':'Food & beverage', gaming:'Gaming', home:'Home',
  layout:'Layout', 'letters-digits':'Letters & digits', mail:'Mail', math:'Mathematics',
  medical:'Medical', multimedia:'Multimedia', nature:'Nature', navigation:'Navigation & places',
  notifications:'Notifications', people:'People', photography:'Photography', science:'Science',
  seasons:'Seasons', security:'Security', shapes:'Shapes', shopping:'Shopping', social:'Social',
  sports:'Sports', sustainability:'Sustainability', text:'Text formatting', time:'Time & calendar',
  tools:'Tools', transportation:'Transportation', travel:'Travel', weather:'Weather'
};

const $ = id => document.getElementById(id);
const iconNames = Object.keys(ICON_METADATA);
let extractor = null;
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

const getRecord = name => transaction('readonly', store => store.get(name));
const getAllRecords = () => transaction('readonly', store => store.getAll());
const putRecords = records => transaction('readwrite', store => {
  records.forEach(record => store.put(record));
});
const clearRecords = () => transaction('readwrite', store => store.clear());

function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function officialFor(name) {
  const slugs = ICON_METADATA[name]?.lucide?.categories || [];
  return unique(slugs.map(slug => LUCIDE_CATEGORY_MAP[slug]))
    .filter(category => CATEGORY_DATA.some(item => item.name === category));
}
function descriptionFor(name) {
  const record = ICON_METADATA[name] || {};
  const lucide = record.lucide || {};
  const ai = record.ai || {};
  return [
    'Icon named ' + name.replace(/[-_]/g, ' ') + '.',
    ai.description || '',
    lucide.tags?.length ? 'Tags: ' + lucide.tags.join(', ') + '.' : '',
    lucide.categories?.length ? 'Official Lucide categories: ' + lucide.categories.join(', ') + '.' : '',
    ai.searchTerms?.length ? 'Search terms: ' + ai.searchTerms.join(', ') + '.' : '',
    lucide.useCases?.length ? 'Use cases: ' + lucide.useCases.join(', ') + '.' : ''
  ].filter(Boolean).join(' ');
}
function cosine(a, b) {
  let score = 0;
  for (let i = 0; i < a.length; i++) score += a[i] * b[i];
  return score;
}
// Similarity alone is not proof that an icon belongs in a category.
// Require both a strong semantic match and corroborating words in official
// Lucide metadata. When evidence is weak, return no extra category.
function evidenceTokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 4);
}
function hasCategoryEvidence(iconName, category) {
  const record = ICON_METADATA[iconName] || {};
  const lucide = record.lucide || {};
  const evidence = new Set(evidenceTokens([
    iconName.replace(/[-_]/g, ' '),
    ...(lucide.tags || []),
    ...(lucide.useCases || []),
    ...((lucide.aliases || []).map(alias => alias.name))
  ].join(' ')));
  const categoryWords = evidenceTokens(category.name);
  const descriptionWords = evidenceTokens(category.description);
  const meaningful = categoryWords.filter(word => !['icons','icon','for','and','with','the','into','from','that','this'].includes(word));
  // Exact category wording is strongest; descriptive overlap must be specific.
  if (meaningful.some(word => evidence.has(word))) return true;
  const overlap = descriptionWords.filter(word => evidence.has(word));
  return overlap.length >= 2;
}
function rankCategories(embedding, official, iconName) {
  const officialSet = new Set(official);
  const ranked = CATEGORY_DATA.map((category, index) => ({
    name: category.name,
    score: cosine(embedding, categoryEmbeddings[index]),
    category
  })).sort((a, b) => b.score - a.score);
  const eligible = ranked.filter(item =>
    !officialSet.has(item.name) &&
    item.score >= 0.52 &&
    hasCategoryEvidence(iconName, item.category)
  );
  return eligible.slice(0, 3).map(({ name, score }) => ({ name, score }));
}

async function loadModel() {
  if (extractor) return;
  $('load').disabled = true;
  $('status').textContent = 'Loading local model files...';
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
    $('status').textContent = 'Preparing the 43 category reference embeddings...';
    const output = await extractor(
      CATEGORY_DATA.map(item => item.name + '. ' + item.description),
      { pooling: 'mean', normalize: true }
    );
    categoryEmbeddings = output.tolist();
    $('start').disabled = false;
    $('load').textContent = 'AI Model Ready';
    $('status').textContent = 'AI ready. You can start or resume batch analysis.';
  } catch (error) {
    extractor = null;
    $('load').disabled = false;
    $('status').textContent = 'Model loading failed: ' + error.message;
  }
}

async function updateStats() {
  const records = await getAllRecords();
  const analyzed = records.filter(record => Array.isArray(record.aiSuggestions)).length;
  const reviewed = records.filter(record => record.reviewedAt).length;
  $('done').textContent = analyzed;
  $('reviewed').textContent = reviewed;
  $('remaining').textContent = Math.max(0, iconNames.length - analyzed);
  $('total').textContent = iconNames.length;
  $('progress').max = iconNames.length;
  $('progress').value = analyzed;
}

async function analyzeBatch(names) {
  const texts = names.map(descriptionFor);
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  const vectors = output.tolist();
  const records = names.map((name, index) => {
    const existingOfficial = officialFor(name);
    return {
      name,
      officialCategories: existingOfficial,
      aiSuggestions: rankCategories(vectors[index], existingOfficial, name),
      analyzedAt: new Date().toISOString(),
      reviewedAt: null,
      manualCategories: null
    };
  });
  await putRecords(records);
}

async function runBatches() {
  if (!extractor || running) return;
  running = true;
  pauseRequested = false;
  $('start').disabled = true;
  $('pause').disabled = false;
  try {
    while (!pauseRequested) {
      const records = await getAllRecords();
      const completed = new Set(records.filter(r => Array.isArray(r.aiSuggestions)).map(r => r.name));
      const next = iconNames.filter(name => !completed.has(name)).slice(0, BATCH_SIZE);
      if (!next.length) {
        $('status').textContent = 'All ' + iconNames.length + ' icons have been analyzed.';
        break;
      }
      $('status').textContent = 'Analyzing ' + (completed.size + 1) + '–' +
        Math.min(completed.size + next.length, iconNames.length) + ' of ' + iconNames.length + '...';
      await analyzeBatch(next);
      await updateStats();
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    if (pauseRequested) $('status').textContent = 'Paused. Progress is saved; use Start / Resume Batch to continue.';
  } catch (error) {
    $('status').textContent = 'Batch stopped: ' + error.message + '. Completed batches remain saved.';
  } finally {
    running = false;
    $('start').disabled = !extractor;
    $('pause').disabled = true;
    await updateStats();
    await renderResults();
  }
}

function makeChip(name, checked) {
  const label = document.createElement('label');
  label.className = 'chip';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = name;
  input.checked = checked;
  const text = document.createElement('span');
  text.textContent = name;
  label.append(input, text);
  return label;
}

async function renderResults(query = '') {
  const all = await getAllRecords();
  const normalized = query.trim().toLowerCase();
  let records = all.filter(record => !normalized || record.name.includes(normalized));
  records.sort((a, b) => (b.analyzedAt || '').localeCompare(a.analyzedAt || ''));
  records = records.slice(0, 30);
  const root = $('results');
  root.replaceChildren();
  if (!records.length) {
    const empty = document.createElement('p');
    empty.textContent = normalized ? 'No analyzed icons match that search.' : 'No batch results yet. Start the batch to analyze icons.';
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
    const officialTitle = document.createElement('p');
    officialTitle.textContent = 'Official Lucide category mapping';
    card.append(officialTitle);
    const chips = document.createElement('div');
    chips.className = 'chips';
    const selected = Array.isArray(record.manualCategories)
      ? record.manualCategories : record.officialCategories;
    record.officialCategories.forEach(name => chips.append(makeChip(name, selected.includes(name))));
    card.append(chips);
    const aiTitle = document.createElement('p');
    aiTitle.textContent = 'AI suggestions — select only the ones that genuinely fit';
    card.append(aiTitle);
    const aiChips = document.createElement('div');
    aiChips.className = 'chips';
    (record.aiSuggestions || []).filter(item => {
      const category = CATEGORY_DATA.find(entry => entry.name === item.name);
      return category && item.score >= 0.52 && hasCategoryEvidence(record.name, category);
    }).forEach(item => {
      const chip = makeChip(item.name, selected.includes(item.name));
      const score = document.createElement('small');
      score.textContent = ' ' + item.score.toFixed(3);
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
      if (alreadyExists) {
        customInput.value = '';
        return;
      }
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
      const chosen = [...card.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
      record.manualCategories = unique(chosen);
      record.reviewedAt = new Date().toISOString();
      await putRecords([record]);
      await updateStats();
      badge.textContent = 'Manually reviewed';
      save.textContent = 'Saved';
    });
    card.append(save);
    root.append(card);
  }
}

async function initialize() {
  try {
    db = await openDatabase();
    await updateStats();
    await renderResults();
  } catch (error) {
    $('status').textContent = 'Local database could not be opened: ' + error.message;
  }
}

$('load').addEventListener('click', loadModel);
$('start').addEventListener('click', runBatches);
$('pause').addEventListener('click', () => { pauseRequested = true; $('pause').disabled = true; });
$('reset').addEventListener('click', async () => {
  if (!confirm('Clear all locally saved AI analysis and manual review decisions?')) return;
  await clearRecords();
  await updateStats();
  await renderResults();
  $('status').textContent = 'Saved AI results cleared. The model does not need to be reloaded.';
});
$('search').addEventListener('input', event => renderResults(event.target.value));
$('show-all').addEventListener('click', () => { $('search').value = ''; renderResults(); });

initialize();
