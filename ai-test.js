import { pipeline, env } from '@huggingface/transformers';
import { CATEGORY_DATA } from './category-data.js';
import ICON_METADATA from './icon-metadata.json';
import './category-engine.js';
import { loadVisualModel, getIconVisualScores, VISUAL_MODEL_ID } from './visual-analyzer.js';

const Engine = window.IconCategoryEngine;
const MODEL_ID = 'all-MiniLM-L6-v2';
const status = document.getElementById('status');
const testArea = document.getElementById('test-area');

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';

let extractor = null;
let visualClassifier = null;
let categoryEmbeddings = [];
let isLoading = false;

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function createSection(title, values) {
  const section = document.createElement('section');
  section.style.marginBottom = '18px';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading);
  const content = document.createElement('p');
  content.textContent = values && values.length ? values.join(', ') : 'No information available.';
  section.append(content);
  return section;
}

function createSuggestion(item, index) {
  const row = document.createElement('article');
  row.style.cssText = 'padding:10px;margin:7px 0;border:1px solid #888;border-radius:8px;';
  const heading = document.createElement('strong');
  heading.textContent = (index + 1) + '. ' + item.name + ' — ' +
    Math.round((item.confidence ?? item.score) * 100) + '% confidence';
  const evidence = document.createElement('p');
  evidence.style.margin = '6px 0 0';
  evidence.textContent = (item.evidence || []).join(' · ') || 'No additional evidence recorded.';
  row.append(heading, evidence);
  return row;
}

function cosineSimilarity(a, b) {
  let score = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) score += a[i] * b[i];
  return score;
}

async function getSavedReview(iconName) {
  return new Promise(resolve => {
    try {
      const request = indexedDB.open('icon-maker-ai-categorization', 1);
      request.onerror = () => resolve(null);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('results')) {
          request.result.createObjectStore('results', { keyPath: 'name' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const get = db.transaction('results', 'readonly').objectStore('results').get(iconName);
        get.onsuccess = () => { resolve(get.result || null); db.close(); };
        get.onerror = () => { resolve(null); db.close(); };
      };
    } catch (_) {
      resolve(null);
    }
  });
}

async function loadAI() {
  if (extractor || isLoading) return;
  const button = document.getElementById('load-ai-button');
  const analyzeButton = document.getElementById('analyze-button');
  isLoading = true;
  button.disabled = true;
  status.textContent = 'Loading local semantic model files...';
  try {
    extractor = await pipeline('feature-extraction', MODEL_ID, {
      dtype: 'q4',
      progress_callback: progress => {
        const stage = progress.status || 'Loading';
        const file = progress.file || '';
        const percent = typeof progress.progress === 'number'
          ? ' (' + progress.progress.toFixed(1) + '%)' : '';
        status.textContent = 'Loading model: ' + stage + ' ' + file + percent;
      }
    });
    status.textContent = 'Preparing ' + CATEGORY_DATA.length + ' shared category definitions...';
    const output = await extractor(
      CATEGORY_DATA.map(category => category.name + '. ' + category.description),
      { pooling: 'mean', normalize: true }
    );
    categoryEmbeddings = output.tolist();
    button.textContent = 'AI Model Ready';
    analyzeButton.disabled = false;
    status.textContent = 'Ready. This page now uses the same classification engine as the main app and batch analyzer.';
  } catch (error) {
    extractor = null;
    button.disabled = false;
    status.textContent = 'AI loading failed: ' + error.message;
  } finally {
    isLoading = false;
  }
}

function buildIconDescription(iconName, metadata) {
  const lucide = metadata?.lucide || {};
  const ai = metadata?.ai || {};
  return [
    'Icon named ' + iconName.replace(/[-_]/g, ' ') + '.',
    ai.description || '',
    lucide.tags?.length ? 'Tags: ' + lucide.tags.join(', ') + '.' : '',
    lucide.categories?.length ? 'Official categories: ' + lucide.categories.join(', ') + '.' : '',
    ai.searchTerms?.length ? 'Search terms: ' + ai.searchTerms.join(', ') + '.' : '',
    lucide.useCases?.length ? 'Use cases: ' + lucide.useCases.join(', ') + '.' : '',
    (lucide.aliases || []).length ? 'Aliases: ' + lucide.aliases.map(alias =>
      typeof alias === 'string' ? alias : (alias.name || alias.alias || '')
    ).filter(Boolean).join(', ') + '.' : ''
  ].filter(Boolean).join(' ');
}

async function runTest() {
  const input = document.getElementById('icon-name');
  const results = document.getElementById('results');
  const iconName = normalizeName(input.value);
  if (!extractor && !visualClassifier) { results.textContent = 'Load the text model or CLIP visual model first.'; return; }
  if (!iconName) { results.textContent = 'Enter an icon name first.'; return; }
  const metadata = ICON_METADATA[iconName];
  if (!metadata) { results.textContent = 'Icon "' + iconName + '" was not found in the metadata database.'; return; }
  results.textContent = 'Analyzing metadata and available model evidence...';
  try {
    let embeddingScores = [];
    if (extractor) {
      const output = await extractor(buildIconDescription(iconName, metadata), { pooling: 'mean', normalize: true });
      const vector = output.tolist()[0];
      embeddingScores = CATEGORY_DATA.map((category, index) => ({
        name: category.name, score: cosineSimilarity(vector, categoryEmbeddings[index] || [])
      })).sort((a, b) => b.score - a.score);
    }
    const visualScores = visualClassifier ? await getIconVisualScores(visualClassifier, iconName, CATEGORY_DATA) : [];
    const review = await getSavedReview(iconName);
    const analysis = Engine.classify(iconName, metadata, review, {
      categoryData: CATEGORY_DATA, embeddingScores, visualScores, threshold: 0.52, maxSuggestions: 8
    });
    results.replaceChildren();
    const preview = document.createElement('img');
    preview.src = '/lucide-icons/' + encodeURIComponent(iconName) + '.svg';
    preview.alt = iconName + ' SVG artwork';
    preview.style.cssText = 'width:96px;height:96px;padding:12px;border:1px solid #888;border-radius:10px;background:white;';
    results.append(preview);
    const title = document.createElement('h2');
    title.textContent = 'Icon metadata';
    results.append(title);
    const description = document.createElement('p');
    description.textContent = metadata.ai?.description || 'No description available.';
    results.append(description);
    results.append(
      createSection('Official Lucide categories', metadata.lucide?.categories || []),
      createSection('Official Lucide tags', metadata.lucide?.tags || []),
      createSection('Search terms', metadata.ai?.searchTerms || []),
      createSection('Use cases', metadata.lucide?.useCases || []),
      createSection('Aliases', (metadata.lucide?.aliases || []).map(alias =>
        typeof alias === 'string' ? alias : (alias.name || alias.alias || '')
      ).filter(Boolean))
    );
    const categoryHeading = document.createElement('h2');
    categoryHeading.textContent = 'Shared-engine category analysis';
    results.append(categoryHeading);
    results.append(createSection('Official category mapping', analysis.officialCategories));
    const suggestionHeading = document.createElement('h3');
    suggestionHeading.textContent = 'Additional category suggestions';
    results.append(suggestionHeading);
    if (!analysis.suggestions.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No additional category passed the shared evidence threshold.';
      results.append(empty);
    } else {
      analysis.suggestions.forEach((item, index) => results.append(createSuggestion(item, index)));
    }
    if (visualScores.length) results.append(createSection('CLIP visual ranking — rendered SVG', visualScores.slice(0, 10).map(item => item.name + ' — ' + item.score.toFixed(3))));
    if (embeddingScores.length) results.append(createSection('Text embedding ranking (diagnostic)', embeddingScores.slice(0, 10).map(item => item.name + ' — ' + item.score.toFixed(4))));
    const summary = document.createElement('p');
    summary.textContent = 'Engine v' + Engine.version + ' · ' + (visualClassifier ? VISUAL_MODEL_ID + ' visual evidence' : 'no visual model loaded') +
      ' · ' + analysis.officialCategories.length + ' official categories · ' + analysis.suggestions.length + ' evidence-backed suggestions.';
    results.append(summary);
  } catch (error) { results.textContent = 'Analysis failed: ' + error.message; }
}
testArea.hidden = false;
const loadButton = document.createElement('button');
loadButton.id = 'load-ai-button';
loadButton.textContent = 'Load AI Model';
loadButton.style.cssText = 'padding:10px;margin:10px 0;';
const heading = document.createElement('h2');
heading.textContent = 'Test an icon';
const input = document.createElement('input');
input.id = 'icon-name';
input.type = 'text';
input.placeholder = 'Example: file-text';
input.style.cssText = 'padding:10px;width:min(300px,90%);';
const analyzeButton = document.createElement('button');
analyzeButton.id = 'analyze-button';
analyzeButton.textContent = 'Analyze icon';
analyzeButton.style.padding = '10px';
analyzeButton.disabled = true;
const results = document.createElement('div');
results.id = 'results';
results.style.marginTop = '20px';
testArea.replaceChildren(loadButton, heading, input, analyzeButton, results);

const visualButton = document.createElement('button');
visualButton.id = 'load-visual-button';
visualButton.textContent = 'Load CLIP Visual Model';
visualButton.style.cssText = 'padding:10px;margin:10px 0 10px 8px;';
const visualNote = document.createElement('p');
visualNote.textContent = 'CLIP examines the actual SVG artwork. First load downloads model files and requires internet.';
testArea.replaceChildren(loadButton, visualButton, visualNote, heading, input, analyzeButton, results);
visualButton.addEventListener('click', async () => {
  visualButton.disabled = true;
  status.textContent = 'Loading CLIP visual model...';
  try {
    visualClassifier = await loadVisualModel(progress => {
      const stage = progress.status || 'Loading';
      const file = progress.file || '';
      const percent = typeof progress.progress === 'number' ? ' (' + progress.progress.toFixed(1) + '%)' : '';
      status.textContent = 'CLIP: ' + stage + ' ' + file + percent;
    });
    visualButton.textContent = 'Visual Model Ready';
    analyzeButton.disabled = false;
    status.textContent = 'CLIP visual model ready.';
  } catch (error) {
    visualButton.disabled = false;
    status.textContent = 'Visual model loading failed: ' + error.message;
  }
});
loadButton.addEventListener('click', loadAI);
analyzeButton.addEventListener('click', runTest);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter') runTest();
});
status.textContent = 'Ready. Load the local AI model to begin.';
