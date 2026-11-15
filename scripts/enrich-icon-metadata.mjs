#!/usr/bin/env node
/**
 * Enrich Icon Maker metadata with the official per-icon Lucide JSON descriptors.
 *
 * Usage:
 *   node scripts/enrich-icon-metadata.mjs
 *   node scripts/enrich-icon-metadata.mjs --limit 100
 *   node scripts/enrich-icon-metadata.mjs --dry-run
 *
 * Uses Node.js 18+ (built-in fetch); no npm packages required.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const METADATA_PATH = resolve(ROOT, 'icon-metadata.json');
const SOURCE_BASE = 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/';
const CONCURRENCY = 8;
const CHECKPOINT_EVERY = 40;
const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg, index, all) => arg === '--limit' && all[index + 1]);
const limit = limitArg ? Math.max(1, Number(process.argv[process.argv.indexOf('--limit') + 1]) || 1) : Infinity;
const dryRun = args.has('--dry-run');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchDescriptor(iconName) {
  const url = SOURCE_BASE + encodeURIComponent(iconName) + '.json';
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Icon-Maker-PRO-metadata-enricher/1.0' }
      });
      if (response.status === 404) return { missing: true };
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const descriptor = await response.json();
      if (!descriptor || !Array.isArray(descriptor.tags) || !Array.isArray(descriptor.categories)) {
        throw new Error('Unexpected Lucide metadata format');
      }
      return { descriptor };
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(350 * attempt);
    }
  }
  return { error: lastError?.message || 'Unknown fetch error' };
}

function cleanStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .filter(value => typeof value === 'string')
    .map(value => value.trim())
    .filter(Boolean))];
}

function buildSearchTerms(name, descriptor, oldAi = {}) {
  const aliasNames = (descriptor.aliases || [])
    .map(alias => typeof alias === 'string' ? alias : alias?.name)
    .filter(Boolean);
  const useCases = cleanStrings(descriptor['use-cases']);
  const terms = [
    ...cleanStrings(oldAi.searchTerms),
    ...cleanStrings(descriptor.tags),
    ...aliasNames,
    ...useCases
  ];
  const expanded = [];
  for (const term of terms) {
    expanded.push(term);
    expanded.push(...term.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2));
  }
  return [...new Set(expanded.map(term => term.toLowerCase().trim()).filter(Boolean))]
    .filter(term => term !== name.toLowerCase())
    .slice(0, 100);
}

function buildDescription(name, descriptor, oldAi = {}) {
  const useCases = cleanStrings(descriptor['use-cases']);
  const tags = cleanStrings(descriptor.tags);
  // Prefer contributor-authored use cases; never invent a visual meaning.
  const source = useCases.length ? useCases.slice(0, 3).join('; ') : '';
  const tagSummary = tags.slice(0, 12).join(', ');
  return source || (tagSummary ? name.replace(/[-_]/g, ' ') + ': ' + tagSummary : oldAi.description || name.replace(/[-_]/g, ' '));
}

async function save(data) {
  await writeFile(METADATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function main() {
  const metadata = JSON.parse(await readFile(METADATA_PATH, 'utf8'));
  const names = Object.keys(metadata).sort();
  const targets = names.slice(0, limit);
  let success = 0;
  let missing = 0;
  let failed = 0;
  let processed = 0;
  let cursor = 0;

  console.log('Lucide metadata enrichment');
  console.log('Icons in file: ' + names.length + ' | selected: ' + targets.length);
  console.log('Source: official Lucide per-icon JSON descriptors');
  if (dryRun) console.log('Dry run: files will not be changed.');

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= targets.length) return;
      const name = targets[index];
      const result = await fetchDescriptor(name);
      const old = metadata[name] || {};
      const oldLucide = old.lucide || {};
      const oldAi = old.ai || {};

      if (result.descriptor) {
        const descriptor = result.descriptor;
        const aliases = Array.isArray(descriptor.aliases) ? descriptor.aliases : [];
        const useCases = cleanStrings(descriptor['use-cases']);
        metadata[name] = {
          ...old,
          lucide: {
            ...oldLucide,
            tags: cleanStrings(descriptor.tags),
            aliases,
            categories: cleanStrings(descriptor.categories),
            useCases,
            contributors: cleanStrings(descriptor.contributors),
            deprecated: Boolean(descriptor.deprecated)
          },
          ai: {
            ...oldAi,
            description: buildDescription(name, descriptor, oldAi),
            searchTerms: buildSearchTerms(name, descriptor, oldAi)
          },
          metadataSource: 'lucide-icons/lucide',
          metadataFetchedAt: new Date().toISOString()
        };
        success++;
      } else if (result.missing) {
        missing++;
        // Keep the existing record untouched when Lucide has no descriptor.
      } else {
        failed++;
        console.warn('Failed: ' + name + ' (' + result.error + ')');
      }

      processed++;
      if (processed % 25 === 0 || processed === targets.length) {
        console.log('Progress: ' + processed + '/' + targets.length +
          ' | enriched ' + success + ' | no descriptor ' + missing + ' | failed ' + failed);
      }
      if (!dryRun && processed % CHECKPOINT_EVERY === 0) await queueSave(metadata);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  if (!dryRun) await save(metadata);

  const enrichedCount = Object.values(metadata).filter(item =>
    item?.metadataSource === 'lucide-icons/lucide' &&
    item?.lucide?.tags?.length
  ).length;

  console.log('\nFinished.');
  console.log('Enriched this run: ' + success);
  console.log('Missing official descriptors: ' + missing);
  console.log('Fetch failures (safe to rerun): ' + failed);
  console.log('Total records with official metadata: ' + enrichedCount + '/' + names.length);
  if (failed) console.log('Run the same command again to retry failed icons.');
  if (dryRun) console.log('Dry run complete; no files were written.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
