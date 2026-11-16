import test from 'node:test';
import assert from 'node:assert/strict';
import '../category-engine.js';

const Engine = globalThis.IconCategoryEngine;
const categories = [
  { name: 'Design & layout', description: 'Interface composition, alignment and layout.' },
  { name: 'Development', description: 'Programming, source control and code.' },
  { name: 'Typography', description: 'Text, fonts, letters and punctuation.' },
  { name: 'Photography', description: 'Viewing, cameras and photographic controls.' },
  { name: 'Science', description: 'Scientific concepts and laboratory equipment.' },
  { name: 'Math & symbols', description: 'Mathematics and geometric symbols.' },
  { name: 'Emoji & expressions', description: 'Emoji, facial expressions and reactions.' },
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
  { name: 'Social', description: 'Social relationships, communities and astrology.' },
  { name: 'Security', description: 'Privacy and protection.' },
  { name: 'Shopping', description: 'Stores and products.' },
  { name: 'Sports', description: 'Sports and exercise.' },
  { name: 'Sustainability', description: 'Renewable energy and environmental protection.' },
  { name: 'Time', description: 'Clocks and calendars.' },
  { name: 'Tools', description: 'Tools and repair.' },
  { name: 'Transportation', description: 'Vehicles and transport.' },
  { name: 'Weather', description: 'Weather and climate.' },
  { name: "Accounts & access", description: "Accounts and permissions." },
  { name: "Charts", description: "Charts and data visualization." },
  { name: "Cursors", description: "Pointers and cursors." },
  { name: "Design", description: "Visual design." },
  { name: "Coding & development", description: "Software development." },
  { name: "Emoji", description: "Emoji and emoticons." },
  { name: "File icons", description: "Files and folders." },
  { name: "Finance", description: "Money and banking." },
  { name: "Food & beverage", description: "Food and drinks." },
  { name: "Layout", description: "Interface layout." },
  { name: "Letters & digits", description: "Letters and digits." },
  { name: "Mail", description: "Email and mail." },
  { name: "Mathematics", description: "Mathematics." },
  { name: "Medical", description: "Medical care." },
  { name: "Multimedia", description: "Audio and video media." },
  { name: "Navigation & places", description: "Maps and places." },
  { name: "Notifications", description: "Alerts and notifications." },
  { name: "Seasons", description: "Seasonal concepts." },
  { name: "Shapes", description: "Geometric shapes." },
  { name: "Text formatting", description: "Text formatting." },
  { name: "Time & calendar", description: "Time and calendars." },
  { name: "Travel", description: "Travel and journeys." }
];

assert.ok(Engine, 'shared classifier should expose a global API');
assert.equal(Engine.version, 13);

function top(name, metadata = {}, options = {}) {
  return Engine.classify(name, metadata, {}, {
    categoryData: categories,
    threshold: 0.30,
    maxSuggestions: 43,
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

test('text-only classification ignores previously saved visual scores when explicitly disabled', () => {
  const metadata = { lucide: { tags: ['wireless network'] } };
  const existing = {
    visualScores: [{ name: 'Animals', score: 0.99 }],
    manualCategories: ['My Manual Category'],
    reviewedAt: '2026-01-01T00:00:00.000Z'
  };
  const result = Engine.classify('custom-mark', metadata, existing, {
    categoryData: categories,
    embeddingScores: [],
    visualScores: [],
    threshold: 0.52
  });
  assert.ok(result.suggestions.some(item => item.name === 'Connectivity'));
  assert.equal(result.suggestions.some(item => item.name === 'Animals'), false);
  assert.deepEqual(existing.manualCategories, ['My Manual Category']);
});


test('zodiac metadata maps to Social and Emoji rather than being blanket-suppressed', () => {
  const result = top('zodiac-gemini', {
    lucide: {
      categories: ['social', 'emoji'],
      tags: ['twins', 'duality', 'communication', 'air', 'adaptability', 'astrology', 'star sign', 'horoscope']
    }
  }, {
    embeddingScores: [{ name: 'Nature', score: 0.99 }, { name: 'Weather', score: 0.95 }],
    visualScores: [],
    threshold: 0.30
  });
  assert.ok(result.categories.includes('Social'));
  assert.ok(result.categories.includes('Emoji'));
  assert.equal(result.categories.includes('Notifications'), false);
  assert.equal(result.categories.includes('Nature'), false);
  assert.equal(result.categories.includes('Weather'), false);
});

test('does not add People as a secondary category for wrench icons', () => {
  const result = top('wrench', {
    lucide: { tags: ['repair', 'maintenance'], aliases: ['spanner'] },
    ai: { searchTerms: ['tool', 'mechanic', 'repair'] }
  });
  assert.equal(result.suggestions.some(item => item.name === 'People'), false);
  assert.ok(result.suggestions.some(item => item.name === 'Tools'));
});

test('curated wind-arrow meanings retain intentional secondary categories', () => {
  const result = top('wind-arrow-up');
  assert.deepEqual([...result.secondaryCategories].sort(), ['Sustainability', 'Weather']);
});

test('confidence is an evidence score and avoids inflated near-100 scores from one name hit', () => {
  const result = top('wrench');
  const tools = result.suggestions.find(item => item.name === 'Tools');
  assert.ok(tools);
  assert.ok(tools.confidence < 0.60, 'single name evidence should not look almost certain');
});


test('zodiac family limits suggestions to relevant social and expressive categories', () => {
  for (const name of ['zodiac-cancer', 'zodiac-pisces', 'zodiac-aquarius', 'zodiac-virgo', 'zodiac-scorpio']) {
    const result = top(name, {
      lucide: { categories: ['social', 'emoji'] }
    }, {
      embeddingScores: categories.map(item => ({ name: item.name, score: 0.99 })),
      visualScores: [],
      threshold: 0.30
    });
    assert.ok(result.categories.includes('Social'), name);
    assert.ok(result.categories.includes('Emoji'), name);
    assert.equal(result.categories.some(category => ['Nature', 'Weather', 'Animals'].includes(category)), false, name);
  }
});

test('zap and zap-off are assigned to electrical devices rather than weather', () => {
  for (const name of ['zap', 'zap-off']) {
    const result = top(name);
    assert.equal(result.suggestions[0]?.name, 'Devices');
    assert.equal(result.suggestions.some(item => item.name === 'Weather'), false);
    assert.equal(result.suggestions[0]?.signals.curatedRule, 'Lightning/power indicator.');
  }
});

test('wind-arrow icons retain precise Arrows plus Weather and Sustainability discovery', () => {
  for (const name of ['wind-arrow-up', 'wind-arrow-down']) {
    const result = top(name);
    assert.equal(result.primaryCategory, 'Arrows');
    assert.deepEqual([...result.secondaryCategories].sort(), ['Sustainability', 'Weather']);
  }
  const wind = top('wind');
  assert.equal(wind.primaryCategory, 'Weather');
  assert.ok(wind.categories.includes('Sustainability'));
  assert.equal(wind.categories.includes('Arrows'), false);
});

test('worm is kept in Animals without weak unrelated secondary suggestions', () => {
  const result = top('worm');
  assert.deepEqual(result.categories, ['Animals']);
});

test('generic workflow is not assigned a weak connectivity category', () => {
  const result = top('workflow');
  assert.deepEqual(result.suggestions, []);
});


test('maps Lucide official categories into a richer Icon Maker taxonomy', () => {
  const result = top('eye', { lucide: { categories: ['accessibility', 'photography', 'design', 'security'] } });
  assert.deepEqual(result.officialCategories, ['Accessibility', 'Photography', 'Design', 'Security']);
  assert.equal(result.suggestions.some(item => item.name === 'Devices'), false);
});

test('maps finance and layout official categories without semantic drift', () => {
  const currency = top('euro', { lucide: { categories: ['finance'] } });
  assert.ok(currency.categories.includes('Finance'));
  assert.equal(currency.primaryCategory, 'Finance');
  assert.equal(currency.categories.includes('Arrows'), false);
  const expand = top('expand', { lucide: { categories: ['arrows', 'layout'] } });
  assert.ok(expand.categories.includes('Arrows'));
  assert.ok(expand.categories.includes('Layout'));
  assert.equal(expand.categories.includes('Business'), false);
});

test('recognizes emoji family as expressions rather than forcing generic People', () => {
  const result = top('face-grinning', { lucide: { categories: ['emoji'], tags: ['happy', 'laugh', 'broad smile'] } });
  assert.ok(result.categories.includes('Emoji'));
});

test('maps exclamation mark to typography and communication, not People', () => {
  const result = top('exclamation-mark', { lucide: { categories: ['letters-digits', 'text', 'notifications'] } });
  assert.ok(result.categories.includes('Letters & digits'));
  assert.ok(result.categories.includes('Notifications'));
  assert.equal(result.categories.includes('People'), false);
});


test('prefers precise canonical categories over overlapping legacy category labels', () => {
  const result = top('file-pdf', {
    lucide: { categories: ['files'] },
    ai: { searchTerms: ['document', 'pdf', 'file type'] }
  });
  assert.ok(result.categories.includes('File icons'));
  assert.equal(result.categories.includes('Files'), false);

  const layout = top('expand', {
    lucide: { categories: ['layout'] }
  });
  assert.ok(layout.categories.includes('Layout'));
  assert.equal(layout.categories.includes('Design & layout'), false);

  const text = top('exclamation-mark', {
    lucide: { categories: ['letters-digits', 'text'] }
  });
  assert.ok(text.categories.includes('Letters & digits'));
  assert.ok(text.categories.includes('Text formatting'));
  assert.equal(text.categories.includes('Typography'), false);
});

test('keeps legacy category labels available when no canonical replacement is supplied', () => {
  const legacyOnly = [
    { name: 'Files', description: 'Files and documents.' },
    { name: 'Typography', description: 'Text, letters and punctuation.' }
  ];
  const result = Engine.classify('file-pdf', {
    lucide: { tags: ['pdf document'] }
  }, {}, { categoryData: legacyOnly, threshold: 0.30 });
  assert.ok(result.categories.includes('Files'));
});

test('eye modifiers avoid arrow and device false positives', () => {
  for (const name of ['eye-closed', 'eye-dashed', 'eye-off']) {
    const result = top(name, { lucide: { tags: ['hide', 'conceal', 'mask', 'hidden', 'invisible'] }, ai: { searchTerms: ['eye', 'hide', 'privacy', 'conceal'] } });
    assert.equal(result.categories.includes('Arrows'), false, name);
    assert.equal(result.categories.includes('Devices'), false, name);
  }
});
