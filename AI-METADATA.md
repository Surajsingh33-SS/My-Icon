# AI icon metadata enrichment

The AI categorization lab can use Lucide's own per-icon metadata instead of relying only on words derived from icon names.

## Run locally

Requirements: Node.js 18 or newer. No additional packages are needed.

From the repository root:

```bash
node scripts/enrich-icon-metadata.mjs
```

The script downloads the official JSON descriptor for each icon from the Lucide repository and enriches `icon-metadata.json` with:

- Contributor-authored tags
- Official Lucide categories
- Use cases written for the specific icon
- Alias names and contributor credits
- Better descriptions and expanded search terms derived from that source material

It preserves existing AI metadata and unrelated fields. A missing descriptor does not erase existing data. Network failures are reported and can be retried by running the same command again. Progress is checkpointed every 40 icons, so an interrupted run does not discard all completed work.

Optional:

```bash
node scripts/enrich-icon-metadata.mjs --limit 100
node scripts/enrich-icon-metadata.mjs --dry-run
``

The first command enriches only the first 100 names (alphabetically). The dry-run checks availability without writing the JSON file.

## Important

This imports metadata actually published by Lucide; it does not invent tags or use cases. Some icons have no descriptor or have empty use-case lists. Those records remain valid and can be improved later through a separate reviewed process.

After enrichment, open `ai-batch.html` through your local development server and run the AI analysis. The AI lab imports `icon-metadata.json` directly, so no extra app configuration is required.
