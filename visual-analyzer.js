import { pipeline, env } from '@huggingface/transformers';

export const VISUAL_MODEL_ID = 'Xenova/clip-vit-base-patch32';
let modelPromise = null;

export async function loadVisualModel(onProgress = () => {}) {
  if (modelPromise) return modelPromise;
  // CLIP is downloaded from Hugging Face; do not let it resolve against
  // the text model's local-only /models/ directory.
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;
  modelPromise = pipeline('zero-shot-image-classification', VISUAL_MODEL_ID, {
    dtype: 'q4',
    progress_callback: onProgress
  }).catch(error => {
    modelPromise = null;
    throw error;
  });
  return modelPromise;
}

export async function getIconVisualScores(classifier, iconName, categories) {
  if (!classifier) return [];
  const response = await fetch('/lucide-icons/' + encodeURIComponent(iconName) + '.svg');
  if (!response.ok) return [];
  const svg = await response.text();
  const bitmap = await createImageBitmap(new Blob([svg], { type: 'image/svg+xml' }));
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 224, 224);
  const scale = Math.min(184 / bitmap.width, 184 / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (224 - width) / 2, (224 - height) / 2, width, height);
  bitmap.close?.();

  const labels = categories.map(category => category.name + ': ' + category.description);
  const output = await classifier(canvas, labels, {
    hypothesis_template: 'This is a minimalist line icon representing {}.'
  });
  const labelMap = new Map(labels.map((label, index) => [label, categories[index].name]));
  return (Array.isArray(output) ? output : [])
    .map(item => ({ name: labelMap.get(item.label) || item.label, score: Number(item.score) || 0 }))
    .filter(item => item.name)
    .sort((a, b) => b.score - a.score);
}
