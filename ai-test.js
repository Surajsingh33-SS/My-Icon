
import { pipeline, env } from '@huggingface/transformers';
import { CATEGORY_DATA } from './category-data.js';
import ICON_METADATA from './icon-metadata.json';

// ==========================================
// 1. CONFIGURATION
// ==========================================

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';

const MODEL_ID = 'all-MiniLM-L6-v2';

let extractor = null;
let categoryEmbeddings = [];
let isLoading = false;

const status = document.getElementById('status');
const testArea = document.getElementById('test-area');

// ==========================================
// 2. OFFICIAL LUCIDE CATEGORY MAPPING
// ==========================================

const LUCIDE_CATEGORY_MAP = {
    'accessibility': 'Accessibility',
    'account': 'Accounts & access',
    'animals': 'Animals',
    'arrows': 'Arrows',
    'buildings': 'Buildings',
    'charts': 'Charts',
    'communication': 'Communication',
    'connectivity': 'Connectivity',
    'cursors': 'Cursors',
    'design': 'Design',
    'development': 'Coding & development',
    'devices': 'Devices',
    'emoji': 'Emoji',
    'files': 'File icons',
    'finance': 'Finance',
    'food-beverage': 'Food & beverage',
    'gaming': 'Gaming',
    'home': 'Home',
    'layout': 'Layout',
    'letters-digits': 'Letters & digits',
    'mail': 'Mail',
    'math': 'Mathematics',
    'medical': 'Medical',
    'multimedia': 'Multimedia',
    'nature': 'Nature',
    'navigation': 'Navigation & places',
    'notifications': 'Notifications',
    'people': 'People',
    'photography': 'Photography',
    'science': 'Science',
    'seasons': 'Seasons',
    'security': 'Security',
    'shapes': 'Shapes',
    'shopping': 'Shopping',
    'social': 'Social',
    'sports': 'Sports',
    'sustainability': 'Sustainability',
    'text': 'Text formatting',
    'time': 'Time & calendar',
    'tools': 'Tools',
    'transportation': 'Transportation',
    'travel': 'Travel',
    'weather': 'Weather'
};

// ==========================================
// 3. GENERAL HELPERS
// ==========================================

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function readableName(name) {
    return name
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function cosineSimilarity(a, b) {
    let score = 0;

    for (let i = 0; i < a.length; i++) {
        score += a[i] * b[i];
    }

    return score;
}

function getMetadata(iconName) {
    return ICON_METADATA[iconName] || null;
}

// ==========================================
// 4. MAP OFFICIAL CATEGORIES
// ==========================================

function getOfficialCategorySuggestions(iconName) {
    const metadata = getMetadata(iconName);

    if (!metadata) return [];

    const lucideCategories =
        metadata.lucide?.categories || [];

    return unique(
        lucideCategories.map(slug =>
            LUCIDE_CATEGORY_MAP[slug]
        )
    ).filter(category =>
        CATEGORY_DATA.some(item => item.name === category)
    );
}

// ==========================================
// 5. BUILD ICON DESCRIPTION
// ==========================================

function getIconDescription(iconName) {
    const metadata = getMetadata(iconName);

    if (!metadata) {
        return `Lucide icon named ${readableName(iconName)}.`;
    }

    const lucide = metadata.lucide || {};
    const ai = metadata.ai || {};

    return [
        `Icon named ${readableName(iconName)}.`,
        ai.description || '',

        lucide.tags?.length
            ? `Tags: ${lucide.tags.join(', ')}.`
            : '',

        lucide.categories?.length
            ? `Official Lucide categories: ${lucide.categories.join(', ')}.`
            : '',

        ai.searchTerms?.length
            ? `Search terms: ${ai.searchTerms.join(', ')}.`
            : '',

        lucide.useCases?.length
            ? `Use cases: ${lucide.useCases.join(', ')}.`
            : ''

    ].filter(Boolean).join(' ');
}

// ==========================================
// 6. LOAD AI MODEL
// ==========================================

async function createAI() {
    if (extractor || isLoading) return;

    const loadButton =
        document.getElementById('load-ai-button');

    isLoading = true;
    loadButton.disabled = true;

    status.textContent = 'Starting local AI model...';

    try {
        extractor = await pipeline(
            'feature-extraction',
            MODEL_ID,
            {
                dtype: 'q4',

                progress_callback: (progress) => {
                    const file =
                        progress.file || 'Preparing model';

                    const stage =
                        progress.status || 'Loading';

                    let message =
                        `Loading AI model: ${stage} — ${file}`;

                    if (typeof progress.progress === 'number') {
                        message +=
                            ` (${progress.progress.toFixed(1)}%)`;
                    }

                    status.textContent = message;
                }
            }
        );

        status.textContent =
            'AI model loaded. Preparing categories...';

        const categoryDescriptions =
            CATEGORY_DATA.map(category =>
                `${category.name}. ${category.description}`
            );

        const categoryOutput = await extractor(
            categoryDescriptions,
            {
                pooling: 'mean',
                normalize: true
            }
        );

        categoryEmbeddings =
            categoryOutput.tolist();

        loadButton.textContent = 'AI Loaded';

        document.getElementById(
            'analyze-button'
        ).disabled = false;

        status.textContent =
            `AI ready! ${categoryEmbeddings.length} categories loaded.`;

    } catch (error) {
        extractor = null;
        categoryEmbeddings = [];

        loadButton.disabled = false;

        status.textContent =
            `AI loading failed: ${error.message}`;

    } finally {
        isLoading = false;
    }
}

// ==========================================
// 7. GET QUERY EMBEDDING
// ==========================================

async function getQueryEmbedding(iconName) {
    const description =
        getIconDescription(iconName);

    const output = await extractor(
        description,
        {
            pooling: 'mean',
            normalize: true
        }
    );

    return output.tolist()[0];
}

// ==========================================
// 8. AI CATEGORY MATCHING
// ==========================================

function getCategoryResults(queryEmbedding) {
    return CATEGORY_DATA.map((category, index) => ({
        name: category.name,

        score: cosineSimilarity(
            queryEmbedding,
            categoryEmbeddings[index]
        )

    })).sort((a, b) => b.score - a.score);
}

// ==========================================
// 9. COMBINE OFFICIAL + AI SUGGESTIONS
// ==========================================

function getCombinedSuggestions(
    officialCategories,
    aiResults
) {
    const officialSet = new Set(officialCategories);

    // These are review candidates, not confirmed categories.
    const reviewCandidates = aiResults
        .filter(item => !officialSet.has(item.name))
        .slice(0, 5);

    return {
        official: officialCategories,
        ai: reviewCandidates
    };
}

// ==========================================
// 10. RESULT DISPLAY
// ==========================================

function createResultRow(
    title,
    score,
    description = ''
) {
    const row = document.createElement('div');

    row.style.cssText = `
        padding: 10px;
        margin: 7px 0;
        border: 1px solid #888;
        border-radius: 8px;
    `;

    const heading =
        document.createElement('strong');

    heading.textContent = title;

    const scoreText =
        document.createElement('div');

    scoreText.textContent =
        `Similarity: ${score.toFixed(4)}`;

    row.append(heading, scoreText);

    if (description) {
        const detail =
            document.createElement('div');

        detail.textContent = description;
        detail.style.marginTop = '4px';

        row.appendChild(detail);
    }

    return row;
}

function createMetadataSection(title, values) {
    const section =
        document.createElement('section');

    section.style.marginBottom = '18px';

    const heading =
        document.createElement('h3');

    heading.textContent = title;

    section.appendChild(heading);

    if (!values || values.length === 0) {
        const empty =
            document.createElement('p');

        empty.textContent =
            'No information available.';

        section.appendChild(empty);

        return section;
    }

    const list =
        document.createElement('p');

    list.textContent = values.join(', ');

    section.appendChild(list);

    return section;
}

// ==========================================
// 11. DISPLAY ICON METADATA
// ==========================================

function displayIconMetadata(
    iconName,
    resultsArea
) {
    const metadata = getMetadata(iconName);

    const heading =
        document.createElement('h2');

    heading.textContent = 'Icon metadata';

    resultsArea.appendChild(heading);

    if (!metadata) {
        const message =
            document.createElement('p');

        message.textContent =
            'No metadata found.';

        resultsArea.appendChild(message);

        return;
    }

    const lucide = metadata.lucide || {};
    const ai = metadata.ai || {};

    const description =
        document.createElement('p');

    description.textContent =
        ai.description || 'No description available.';

    resultsArea.appendChild(description);

    resultsArea.appendChild(
        createMetadataSection(
            'Official Lucide categories',
            lucide.categories
        )
    );

    resultsArea.appendChild(
        createMetadataSection(
            'Official Lucide tags',
            lucide.tags
        )
    );

    resultsArea.appendChild(
        createMetadataSection(
            'Search terms',
            ai.searchTerms
        )
    );

    resultsArea.appendChild(
        createMetadataSection(
            'Official use cases',
            lucide.useCases
        )
    );

    resultsArea.appendChild(
        createMetadataSection(
            'Contributors',
            lucide.contributors
        )
    );

    resultsArea.appendChild(
        createMetadataSection(
            'Aliases',
            (lucide.aliases || []).map(alias =>
                alias.name
            )
        )
    );
}

// ==========================================
// 12. DISPLAY CATEGORY SUGGESTIONS
// ==========================================

function displayCategorySuggestions(
    combined,
    aiResults,
    resultsArea
) {
    const heading =
        document.createElement('h2');

    heading.textContent =
        'Icon Maker category suggestions';

    resultsArea.appendChild(heading);

    resultsArea.appendChild(
        createMetadataSection(
            'Official Lucide category mapping',
            combined.official
        )
    );

    const aiHeading =
        document.createElement('h3');

    aiHeading.textContent =
        'Additional AI suggestions';

    resultsArea.appendChild(aiHeading);

    if (combined.ai.length === 0) {
        const empty =
            document.createElement('p');

        empty.textContent =
            'No additional AI suggestions passed the current threshold.';

        resultsArea.appendChild(empty);

    } else {
        combined.ai.forEach((item, index) => {
            resultsArea.appendChild(
                createResultRow(
                    `${index + 1}. ${item.name}`,
                    item.score
                )
            );
        });
    }

    const allHeading =
        document.createElement('h3');

    allHeading.textContent =
        'Complete AI ranking';

    resultsArea.appendChild(allHeading);

    aiResults.forEach((item, index) => {
        resultsArea.appendChild(
            createResultRow(
                `${index + 1}. ${item.name}`,
                item.score
            )
        );
    });
}

// ==========================================
// 13. ANALYZE ICON
// ==========================================

async function runTest() {
    const input =
        document.getElementById('icon-name');

    const resultsArea =
        document.getElementById('results');

    const iconName =
        input.value.trim().toLowerCase();

    if (!extractor) {
        resultsArea.textContent =
            'Please load the AI model first.';

        return;
    }

    if (!iconName) {
        resultsArea.textContent =
            'Enter an icon name first.';

        return;
    }

    if (!getMetadata(iconName)) {
        resultsArea.textContent =
            `Icon "${iconName}" was not found in the metadata database.`;

        return;
    }

    resultsArea.textContent =
        'Analyzing icon...';

    try {
        const queryEmbedding =
            await getQueryEmbedding(iconName);

        const aiResults =
            getCategoryResults(queryEmbedding);

        const officialCategories =
            getOfficialCategorySuggestions(iconName);

        const combined =
            getCombinedSuggestions(
                officialCategories,
                aiResults
            );

        resultsArea.innerHTML = '';

        displayIconMetadata(
            iconName,
            resultsArea
        );

        displayCategorySuggestions(
            combined,
            aiResults,
            resultsArea
        );

    } catch (error) {
        resultsArea.textContent =
            `Analysis failed: ${error.message}`;
    }
}

// ==========================================
// 14. CREATE TEST PAGE UI
// ==========================================

testArea.hidden = false;

testArea.innerHTML = `
    <button
        id="load-ai-button"
        style="padding:10px;margin:10px 0;"
    >
        Load AI Model
    </button>

    <h2>Test an icon</h2>

    <input
        id="icon-name"
        type="text"
        placeholder="Example: file-text"
        style="padding:10px;width:min(300px,90%);"
    >

    <button
        id="analyze-button"
        style="padding:10px;"
        disabled
    >
        Analyze icon
    </button>

    <div
        id="results"
        style="margin-top:20px;"
    ></div>
`;

// ==========================================
// 15. EVENT LISTENERS
// ==========================================

document.getElementById(
    'load-ai-button'
).addEventListener(
    'click',
    createAI
);

document.getElementById(
    'analyze-button'
).addEventListener(
    'click',
    runTest
);

document.getElementById(
    'icon-name'
).addEventListener(
    'keydown',
    event => {
        if (event.key === 'Enter') {
            runTest();
        }
    }
);

// ==========================================
// 16. START
// ==========================================

status.textContent =
    'Ready. Click Load AI Model to begin.';
