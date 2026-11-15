import test from 'node:test';
import assert from 'node:assert/strict';
import './category-engine.js';

const Engine = globalThis.IconCategoryEngine;
const categories = [
  { name: 'Accessibility', description: 'Accessibility and assistive technology.' },
  { name: 'Animals', description: 'Animals, pets and wildlife.' },
  { name: 'Arrows', description: 'Direction and movement.' },
  { name: 'Audio & music', description: 'Music and sound.' },
  { name: 'Buildings', description: 'Buildings and structures.' },
  { name: 'Business', description: 'Finance and commerce.' },
  { name: 'Communication', description: 'Messages and calls.' },
  { name: 'Connectivity', description: 'Internet and wireless networks.' },
  { name: 'Devices', description: 'Computers and electronics.' },
  { name: 'Files', description: 'Files and documents.' },
  { name: 'Food & drink', description: 'Food and beverages.' },
  { name: 'Gaming', description: 'Games and controllers.' },
  { name: 'Health', description: 'Medical care and wellness.' },
  { name: 'Home', description: 'Household objects and furniture.' },
  { name: 'Maps & travel', description: 'Maps and journeys.' },
  { name: 'Media', description: 'Images, photos and video.' },
  { name: 'Nature', description: 'Plants and environment.' },
  { name: 'People', description: 'People and profiles.' },
  { name: 'Security', description: 'Privacy and protection.' },
  { name: 'Shopping', description: 'Stores and products.' },
  { name: 'Sports', description: 'Sports and exercise.' },
  { name: 'Time', description: 'Clocks and calendars.' },
  { name: 'Tools', description: 'Tools and repair.' },
  { name: 'Transportation', description: 'Vehicles and transport.' },
  { name: 'Weather', description: 'Weather and climate.' }
];

assert.ok(Engine, 'shared classifier should expose a global API');
assert.equal(Engine.version, 6);

function top(name, metadata = {}, options = {}) {
  return Engine.classify(name, metadata, {}, {
    categoryData: categories,
    threshold: 0.52,
    maxSuggestions: 8,
    ...options
  });
}

test('recognizes distinct icon concepts from names', () => {
  const cases = [
    ['dog', 'Animals'],
    ['wifi', 'Connectivity'],
    ['file-pdf', 'Files'],
    ['coffee', 'Food & drink'],
    ['shield-check', 'Security'],
    ['calendar-days', 'Time'],
    ['car-front', 'Transportation'],
    ['camera', 'Media'],
    ['accessibility', 'Accessibility']
  ];
  for (const [name, expected] of cases) {
    const result = top(name);
    assert.ok(result.suggestions.some(item => item.name === expected),
      name + ' should suggest ' + expected + '; got ' + result.suggestions.map(x => x.name).join(', '));
  }
});

test('uses contributor tags, aliases and use cases as distinct evidence sources', () => {
  const result = top('custom-mark', {
    lucide: {
      tags: ['wireless network'],
      aliases: [{ name: 'wifi signal' }],
      useCases: ['connect to the internet']
    },
    ai: { description: 'A connection indicator.' }
  });
  const connectivity = result.suggestions.find(item => item.name === 'Connectivity');
  assert.ok(connectivity);
  assert.ok(connectivity.evidence.some(item => item.source === 'Lucide tags'));
  assert.ok(connectivity.evidence.some(item => item.source === 'aliases'));
});

test('maps official categories and ignores Lucide $extends relationships', () => {
  const result = top('user-round', {
    lucide: { categories: ['account', '$extends:user', '$group:people'] }
  });
  assert.deepEqual(result.officialCategories, ['People']);
  assert.deepEqual(result.officialCategoryValues, ['account']);
  assert.equal(result.suggestions[0].name, 'People');
});

test('does not create a category from weak embedding-only similarity', () => {
  const result = top('unrelated-mark', {}, {
    embeddingScores: [{ name: 'Animals', score: 0.55 }],
    visualScores: []
  });
  assert.equal(result.suggestions.some(item => item.name === 'Animals'), false);
});

test('uses independent model agreement only when both signals are strong', () => {
  const result = top('unrelated-mark', {}, {
    embeddingScores: [{ name: 'Animals', score: 0.72 }],
    visualScores: [{ name: 'Animals', score: 0.48 }]
  });
  assert.equal(result.suggestions[0]?.name, 'Animals');
  assert.equal(result.suggestions[0]?.role, 'primary');
});

test('exposes primary and secondary categories without changing the suggestion shape', () => {
  const result = top('arrow-left-right');
  assert.equal(result.primaryCategory, result.suggestions[0]?.name ?? null);
  assert.ok(Array.isArray(result.secondaryCategories));
  for (const item of result.suggestions) {
    assert.equal(typeof item.confidence, 'number');
    assert.ok(Array.isArray(item.evidence));
    assert.ok(['primary', 'secondary'].includes(item.role));
  }
});

test('manual review fields are not modified by the classifier', () => {
  const manual = { manualCategories: ['Custom'], metadataEdits: { description: 'User text' } };
  const before = structuredClone(manual);
  top('dog', {}, manual);
  assert.deepEqual(manual, before);
});
