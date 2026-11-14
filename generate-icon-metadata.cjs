
const fs = require("fs");
const path = require("path");

// ==========================================
// 1. SOURCE LOCATIONS
// ==========================================

const ROOT = __dirname;

const ICONS_DIR = path.join(
    ROOT,
    "lucide-metadata-source",
    "icons"
);

const GROUPS_DIR = path.join(
    ROOT,
    "lucide-metadata-source",
    "groups"
);

const TAGS_PATH = path.join(
    ROOT,
    "node_modules",
    "lucide-static",
    "tags.json"
);

const OUTPUT_PATH = path.join(
    ROOT,
    "icon-metadata.json"
);

const tagsDatabase = require(TAGS_PATH);

// Existing alternate icon names.
const customAliases = {
    "smiley": "face-slightly-smiling"
};

// ==========================================
// 2. GENERAL HELPERS
// ==========================================

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function cleanName(name) {
    return name
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[-_]/g, " ")
        .trim();
}

function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    return JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );
}

function getIconFile(iconName) {
    return path.join(
        ICONS_DIR,
        `${iconName}.json`
    );
}

// ==========================================
// 3. LOAD SHARED TAG GROUPS
// ==========================================

const groupDatabase = {};

for (const file of fs.readdirSync(GROUPS_DIR)) {
    if (!file.endsWith(".json")) continue;

    const groupName = file.replace(/\.json$/, "");

    groupDatabase[groupName] = readJson(
        path.join(GROUPS_DIR, file)
    );
}

// ==========================================
// 4. RESOLVE INHERITED METADATA
// ==========================================

const metadataCache = {};

function resolveField(iconName, field, stack = []) {
    const cacheKey = `${iconName}:${field}`;

    if (metadataCache[cacheKey]) {
        return [...metadataCache[cacheKey]];
    }

    if (stack.includes(iconName)) {
        throw new Error(
            `Circular metadata inheritance: ${[...stack, iconName].join(" -> ")}`
        );
    }

    const metadata = readJson(getIconFile(iconName));

    if (!metadata) {
        return [];
    }

    const nextStack = [...stack, iconName];
    const result = [];

    for (const item of metadata[field] || []) {

        // Inherit metadata from another icon.
        if (item.startsWith("$extends:")) {
            const parentName = item.slice("$extends:".length);

            result.push(
                ...resolveField(
                    parentName,
                    field,
                    nextStack
                )
            );

            continue;
        }

        // Expand shared tag groups.
        if (field === "tags" && item.startsWith("$group:")) {
            const groupName = item.slice("$group:".length);
            const group = groupDatabase[groupName];

            if (!group) {
                console.warn(
                    `Missing tag group: ${groupName} (${iconName})`
                );

                continue;
            }

            result.push(
                ...resolveGroupTags(groupName, nextStack)
            );

            continue;
        }

        result.push(item);
    }

    const resolved = unique(result);

    metadataCache[cacheKey] = resolved;

    return [...resolved];
}

function resolveGroupTags(groupName, stack = []) {
    const group = groupDatabase[groupName];

    if (!group) return [];

    const result = [];

    for (const item of group.tags || []) {

        if (item.startsWith("$group:")) {
            const nestedGroup = item.slice("$group:".length);

            result.push(
                ...resolveGroupTags(nestedGroup, stack)
            );

            continue;
        }

        result.push(item);
    }

    return unique(result);
}

// ==========================================
// 5. GENERATE SEARCH TERMS
// ==========================================

// Controlled concept vocabulary supplements official tags and use cases.
// Each expansion is tied to a meaningful word, so unrelated icons do not
// inherit broad, generic keywords.
const RELATED_SEARCH_TERMS = {
    add: ["create", "new", "plus", "insert", "append"],
    alert: ["warning", "caution", "attention", "notice"],
    archive: ["storage", "backup", "old files", "store"],
    arrow: ["direction", "navigate", "navigation"],
    audio: ["sound", "music", "volume", "listen", "speaker"],
    bag: ["shopping bag", "purchase", "retail"],
    bank: ["banking", "finance", "money", "payment"],
    book: ["reading", "read", "library", "publication", "pages"],
    calendar: ["date", "schedule", "planner", "appointment", "event"],
    camera: ["photograph", "photography", "snapshot", "capture", "picture"],
    chart: ["graph", "analytics", "statistics", "data visualization", "report"],
    check: ["done", "complete", "completed", "success", "approved", "confirm"],
    circle: ["round", "circular", "ellipse", "shape"],
    clipboard: ["copy", "paste", "notes", "board"],
    clock: ["time", "watch", "duration", "schedule"],
    close: ["exit", "dismiss", "cancel", "remove", "clear"],
    cloud: ["online storage", "internet", "sync", "weather"],
    code: ["programming", "developer", "software", "source code", "script"],
    comment: ["chat", "feedback", "reply", "discussion", "message"],
    copy: ["duplicate", "clone", "replicate", "clipboard"],
    credit: ["card", "payment", "billing", "checkout", "finance"],
    database: ["data", "storage", "records", "server", "backend"],
    delete: ["remove", "erase", "discard", "trash", "bin"],
    download: ["export", "save file", "retrieve"],
    edit: ["modify", "change", "update", "pencil", "write"],
    email: ["mail", "envelope", "inbox", "message", "correspondence"],
    eye: ["view", "visibility", "preview", "show", "visible"],
    file: ["document", "attachment", "paper", "record"],
    filter: ["refine", "adjust", "narrow results"],
    folder: ["directory", "files", "collection", "organize"],
    gear: ["settings", "preferences", "configuration", "options", "tune"],
    globe: ["world", "earth", "international", "website", "language"],
    heart: ["love", "favorite", "like", "health", "wellness"],
    home: ["house", "homepage", "main page", "residence", "dashboard"],
    image: ["photo", "picture", "photograph", "graphic", "visual"],
    info: ["information", "details", "about", "help", "description"],
    key: ["password", "access", "authentication", "security", "credential"],
    link: ["url", "hyperlink", "connection", "attach"],
    lock: ["secure", "security", "private", "protected", "locked"],
    location: ["place", "map", "address", "position", "geolocation"],
    mail: ["email", "envelope", "inbox", "message"],
    map: ["location", "navigation", "directions", "place", "geography"],
    menu: ["navigation", "hamburger menu", "sidebar", "options"],
    message: ["chat", "conversation", "comment", "text", "communication"],
    mic: ["microphone", "recording", "voice", "audio", "speech"],
    minus: ["subtract", "decrease", "remove", "negative", "less"],
    moon: ["night", "dark mode", "sleep", "lunar"],
    music: ["audio", "song", "sound", "track", "playlist"],
    pencil: ["edit", "write", "draw", "modify"],
    phone: ["telephone", "call", "contact", "mobile", "communication"],
    play: ["start", "begin", "run", "media", "video"],
    plus: ["add", "create", "new", "increase", "positive"],
    printer: ["print", "paper", "document", "hard copy"],
    refresh: ["reload", "retry", "sync", "update", "rotate"],
    save: ["store", "download", "disk", "preserve"],
    search: ["find", "lookup", "look up", "discover", "magnifier", "magnifying glass"],
    send: ["submit", "dispatch", "deliver", "forward", "outgoing message"],
    settings: ["preferences", "configuration", "options", "controls", "customize", "gear", "cog"],
    share: ["send", "forward", "distribute", "social", "share link"],
    shield: ["protection", "security", "safe", "defense", "privacy"],
    shopping: ["cart", "basket", "store", "purchase", "checkout", "retail"],
    star: ["favorite", "rating", "bookmark", "featured", "important"],
    sun: ["day", "light", "brightness", "weather", "light mode"],
    tag: ["label", "category", "keyword", "classification"],
    text: ["typography", "writing", "font", "word", "content"],
    trash: ["delete", "remove", "discard", "bin", "garbage", "waste", "rubbish"],
    unlock: ["open lock", "access", "unlocked", "release"],
    upload: ["import", "attach", "send file", "transfer", "submit"],
    user: ["person", "profile", "account", "avatar", "member", "individual", "contact"],
    video: ["movie", "film", "recording", "media", "playback"],
    wallet: ["money", "cash", "payment", "finance", "purse"],
    wifi: ["wireless", "internet", "network", "connection", "signal"]
};

// Keep this vocabulary aligned with the browser search engine. These forms
// cover common irregular plurals and avoid destructive rules for words like
// "analysis", "series", "status", and "glass".
const SEARCH_IRREGULAR_FORMS = {
    people: ["person"], person: ["people", "persons"], persons: ["person", "people"],
        bus: ["buses"], buses: ["bus"], class: ["classes"], classes: ["class"],
        glass: ["glasses"], glasses: ["glass"], dress: ["dresses"], dresses: ["dress"],
        address: ["addresses"], addresses: ["address"], process: ["processes"], processes: ["process"],
    men: ["man"], man: ["men"], women: ["woman"], woman: ["women"],
    children: ["child"], child: ["children"], mice: ["mouse"], mouse: ["mice"],
    geese: ["goose"], goose: ["geese"], teeth: ["tooth"], tooth: ["teeth"],
    feet: ["foot"], foot: ["feet"], leaves: ["leaf"], leaf: ["leaves"],
    knives: ["knife"], knife: ["knives"], wolves: ["wolf"], wolf: ["wolves"],
    shelves: ["shelf"], shelf: ["shelves"], lives: ["life"], life: ["lives"],
    wives: ["wife"], wife: ["wives"], indices: ["index"], index: ["indices"],
    matrices: ["matrix"], matrix: ["matrices"], vertices: ["vertex"], vertex: ["vertices"],
    analyses: ["analysis"], analysis: ["analyses"], bases: ["basis"], basis: ["bases"],
    crises: ["crisis"], crisis: ["crises"], theses: ["thesis"], thesis: ["theses"],
    diagnoses: ["diagnosis"], diagnosis: ["diagnoses"], statuses: ["status"], status: ["statuses"],
    series: ["series"], species: ["species"], news: ["news"]
};

function getSearchWordVariants(value) {
    const word = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
    if (!word) return [];
    const irregular = SEARCH_IRREGULAR_FORMS[word];
    const variants = new Set([word, ...(irregular || [])]);
    if (irregular) return [...variants];

    if (word.length >= 3) {
        const looksPlural = word.endsWith("ies") ||
            /(ches|shes|xes|zes|sses)$/.test(word) ||
            (word.endsWith("s") && !/(ss|us|is)$/.test(word));

        if (word.endsWith("ies")) variants.add(word.slice(0, -3) + "y");
        else if (/(ches|shes|xes|zes|sses)$/.test(word)) variants.add(word.slice(0, -2));
        else if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) variants.add(word.slice(0, -1));

        if (!looksPlural) {
            if (/[^aeiou]y$/.test(word)) variants.add(word.slice(0, -1) + "ies");
            else if (/(ch|sh|x|z)$/.test(word)) variants.add(word + "es");
            else if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) variants.add(word + "es");
            else if (!/(s|ss|us|is)$/.test(word)) variants.add(word + "s");
        }
    }
    return [...variants];
}

function expandRelatedSearchTerms(values) {
    const expanded = [...values];
    for (const value of values) {
        const normalized = String(value || "").toLowerCase()
            .replace(/[^a-z0-9]+/g, " ").trim();
        for (const word of normalized.split(/\s+/).filter(Boolean)) {
            const variants = getSearchWordVariants(word);
            expanded.push(...variants);
            for (const variant of variants) {
                if (RELATED_SEARCH_TERMS[variant]) expanded.push(...RELATED_SEARCH_TERMS[variant]);
            }
            if (RELATED_SEARCH_TERMS[word]) expanded.push(...RELATED_SEARCH_TERMS[word]);
        }
    }
    return unique(expanded.map(value => String(value).trim().toLowerCase())
        .filter(value => value.length > 1));
}

function generateSearchTerms(
    iconName,
    tags,
    useCases,
    aliases
) {
    const terms = [
        cleanName(iconName),
        iconName,
        ...tags,
        ...useCases,
        ...aliases.map(alias => alias.name)
    ];

    return expandRelatedSearchTerms(
        terms.map(term => String(term).trim().toLowerCase()).filter(Boolean)
    );
}

// ==========================================
// Curated descriptions clarify icons whose names or common uses are ambiguous.
// Keep these visual-first: describe what is drawn, then list reasonable meanings
// without treating every possible use as a category assignment.
const CURATED_ICON_DESCRIPTIONS = {
    "activity": "A single continuous pulse-like line with sharp peaks and dips. Commonly represents activity, a heartbeat or vital-sign trace, live monitoring, and system status. It is a symbolic waveform, not a full numerical chart.",
    "brain": "A side-view outline of a human brain with distinct folded lobes. Represents the human brain, thinking, cognition, memory, neuroscience, and mental processes. It does not by itself depict artificial intelligence or electronic circuitry.",
    "brain-circuit": "A human brain outline combined with electronic circuit traces and connection nodes. Represents artificial intelligence, neural networks, machine learning, computational thinking, and the connection between biology and technology.",
    "brain-cog": "A human brain outline paired with a mechanical gear. Represents cognitive processing, intelligent systems, brain-related settings, neuroscience tools, and the configuration of AI or thinking systems.",
    "badge-check": "A certification-style badge or seal containing a check mark. Represents verified status, approval, authenticity, credentials, certification, and trusted identity. It is distinct from a simple standalone check mark.",
    "circle-help": "A question mark centered inside a circular outline. Represents help, FAQs, guidance, support, uncertainty, and information about how something works.",
    "file-question": "A document or file symbol marked with a question mark. Represents an unknown file, document-related help, file information, missing details, or a question about a document.",
    "cloud": "A simple outline of a cloud with no rain or other weather detail. Depending on interface context, it can represent cloud computing, online storage, synchronization, internet services, or a general cloud/weather concept; the shape alone does not specify which one.",
    "cloud-rain": "A cloud with falling raindrops beneath it. Primarily represents rain, rainy weather, precipitation, and weather forecasts rather than online cloud storage.",
    "layers": "Several offset, overlapping flat shapes or sheets forming a stack. Represents layers, stacking order, grouped visual elements, depth, and layer-based design or editing interfaces.",
    "house": "A simple house silhouette with a roof and building body. Represents a home, residential building, household, or home navigation. It is a physical place symbol rather than a generic office building.",
    "settings": "A toothed gear symbol used as an interface control. Represents settings, preferences, configuration, options, and system controls.",
    "cog": "A mechanical toothed wheel or gear. Represents a mechanism, engineering, machinery, and—when used in an interface—settings or configuration.",
    "shield-check": "A shield outline containing a check mark. Represents protection, security verification, safe status, and confirmed protection; the shield is the primary visual meaning.",
    "file-check": "A document or file symbol containing a check mark. Represents a reviewed, approved, validated, or completed document or file.",
    "cloud-check": "A cloud symbol containing a check mark. Represents successful cloud synchronization, cloud backup completion, or a confirmed online-storage state.",
    "message-circle-question": "A circular speech or message bubble containing a question mark. Represents asking a question, customer support, help conversations, and questions sent through chat.",
    "user-check": "A person or user silhouette paired with a check mark. Represents a confirmed user, verified account, approved member, or successful user validation.",
    "calendar-check": "A calendar page containing a check mark. Represents a confirmed date, scheduled event, completed calendar task, or approved appointment.",
    "lock-keyhole": "A closed padlock with a visible keyhole. Represents locked access, privacy, restricted entry, and protected information.",
    "database": "A stack of horizontal cylindrical database layers. Represents structured data storage, databases, records, and backend data systems; it is not simply a generic stack of visual layers."
};

// 6. GENERATE DESCRIPTION
// ==========================================

function generateDescription(
    iconName,
    tags,
    useCases
) {
    const curated = CURATED_ICON_DESCRIPTIONS[iconName];
    if (curated) return curated;

    const readableName = cleanName(iconName);

    if (useCases.length) {
        return [
            `Icon named ${readableName}.`,
            `Use cases: ${useCases.join(", ")}.`
        ].join(" ");
    }

    return [
        `Icon named ${readableName}.`,
        tags.length
            ? `Related concepts: ${tags.join(", ")}.`
            : ""
    ].filter(Boolean).join(" ");
}

// ==========================================
// 7. BUILD ONE ICON RECORD
// ==========================================

function createIconRecord(iconName) {
    const official = readJson(
        getIconFile(iconName)
    ) || {};

    const tags = resolveField(iconName, "tags");
    const categories = resolveField(iconName, "categories");
    const contributors = resolveField(iconName, "contributors");
    const useCases = resolveField(iconName, "use-cases");

    const aliases = official.aliases || [];

    const description = generateDescription(
        iconName,
        tags,
        useCases
    );

    const searchTerms = generateSearchTerms(
        iconName,
        tags,
        useCases,
        aliases
    );

    return {
        name: iconName,

        metadataName: iconName,

        lucide: {
            categories,
            tags,
            contributors,
            useCases,
            aliases
        },

        ai: {
            description,
            searchTerms,
            suggestedCategories: []
        },

        manual: {
            categories: []
        },

        deprecated: official.deprecated === true,
        deprecationReason: official.deprecationReason || null,
        toBeRemovedInVersion: official.toBeRemovedInVersion || null
    };
}

// ==========================================
// 8. GENERATE THE COMPLETE DATABASE
// ==========================================

const iconDatabase = {};

const iconNames = Object.keys(tagsDatabase).sort();

let missingMetadata = 0;

for (const iconName of iconNames) {
    const metadataPath = getIconFile(iconName);

    if (!fs.existsSync(metadataPath)) {
        missingMetadata++;

        console.warn(
            `Official metadata missing: ${iconName}`
        );
    }

    iconDatabase[iconName] = createIconRecord(iconName);
}

// ==========================================
// 9. ADD CUSTOM ALIASES
// ==========================================

for (const [alias, original] of Object.entries(customAliases)) {
    if (!iconDatabase[original]) {
        console.warn(
            `Alias target not found: ${alias} -> ${original}`
        );

        continue;
    }

    const originalRecord = iconDatabase[original];

    iconDatabase[alias] = {
        ...JSON.parse(JSON.stringify(originalRecord)),

        name: alias,
        metadataName: original
    };
}

// ==========================================
// 10. WRITE OUTPUT
// ==========================================

fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(iconDatabase, null, 2),
    "utf8"
);

// ==========================================
// 11. REPORT
// ==========================================

console.log("\n=================================");
console.log("ICON METADATA GENERATED");
console.log("=================================");

console.log(
    "Total icon records:",
    Object.keys(iconDatabase).length
);

console.log(
    "Missing official metadata:",
    missingMetadata
);

const termCounts = Object.values(iconDatabase).map(record =>
    (record.ai?.searchTerms || []).length
);
const averageTerms = termCounts.length
    ? Math.round(termCounts.reduce((sum, count) => sum + count, 0) / termCounts.length)
    : 0;
const lowCoverage = Object.values(iconDatabase)
    .filter(record => (record.ai?.searchTerms || []).length < 8)
    .map(record => record.name);

console.log("Average generated search terms:", averageTerms);
console.log("Icons with fewer than 8 search terms:", lowCoverage.length);
if (lowCoverage.length) {
    console.log("Low-coverage examples:", lowCoverage.slice(0, 30).join(", "));
}

console.log(
    "Shared tag groups:",
    Object.keys(groupDatabase).length
);

console.log(
    "Output:",
    OUTPUT_PATH
);

for (const name of [
    "file",
    "file-text",
    "smiley",
    "brain",
    "layers",
    "user-round",
    "camera",
    "cloud-rain",
    "shopping-cart"
]) {
    console.log(`\n--- ${name} ---`);

    console.log(
        JSON.stringify(
            iconDatabase[name] || "Not found",
            null,
            2
        )
    );
}

console.log("\nGeneration complete!");
