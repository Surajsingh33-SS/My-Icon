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

async function loadSvgImage(svg) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob); } catch (error) {
      // Some browsers cannot decode SVG blobs with createImageBitmap; use Image instead.
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    if (typeof image.decode === 'function') await image.decode();
    else await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Browser could not decode the SVG image.'));
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function getIconVisualScores(classifier, iconName, categories) {
  if (!classifier) throw new Error('CLIP visual model is not loaded.');
  const response = await fetch('/lucide-icons/' + encodeURIComponent(iconName) + '.svg');
  if (!response.ok) throw new Error('Could not load SVG for "' + iconName + '" (HTTP ' + response.status + ').');
  const svg = await response.text();
  if (!svg.includes('<svg')) throw new Error('The source for "' + iconName + '" is not valid SVG markup.');

  const image = await loadSvgImage(svg);
  const imageWidth = image.width || image.naturalWidth;
  const imageHeight = image.height || image.naturalHeight;
  if (!imageWidth || !imageHeight) {
    image.close?.();
    throw new Error('The source SVG has no usable image dimensions.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    image.close?.();
    throw new Error('Could not create a canvas context for SVG rendering.');
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 224, 224);
  const scale = Math.min(184 / imageWidth, 184 / imageHeight);
  const width = imageWidth * scale, height = imageHeight * scale;
  context.drawImage(image, (224 - width) / 2, (224 - height) / 2, width, height);
  image.close?.();

  const labels = categories.map(category => category.name + ': ' + category.description);
  const output = await classifier(canvas, labels, {
    hypothesis_template: 'This is a minimalist line icon representing {}.'
  });
  const labelMap = new Map(labels.map((label, index) => [label, categories[index].name]));
  const scores = (Array.isArray(output) ? output : [])
    .map(item => ({ name: labelMap.get(item.label) || item.label, score: Number(item.score) || 0 }))
    .filter(item => item.name).sort((a, b) => b.score - a.score);
  if (!scores.length) throw new Error('CLIP returned no visual category scores for "' + iconName + '".');
  return scores;
}
