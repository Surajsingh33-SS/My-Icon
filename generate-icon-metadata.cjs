
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

    return unique(
        terms
            .map(term => String(term).trim().toLowerCase())
            .filter(Boolean)
    );
}

// ==========================================
// 6. GENERATE DESCRIPTION
// ==========================================

function generateDescription(
    iconName,
    tags,
    useCases
) {
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
