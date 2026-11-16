# AI Prediction Review — Icon Maker PRO

Open this page from the same Live Server origin and browser profile as Icon Maker PRO.

## Use
1. Open \`ai-prediction-review.html\` through Live Server.
2. Select the original \`icon-category-predictions-v13.json\` export.
3. Click **Import predictions** and wait for the import to finish.
4. Review an icon's official Lucide labels, imported predictions, and any existing benchmark evidence.
5. Select the categories you want and click **Save manual categories**.
6. Click **Apply reviewed categories to Gallery** only when you want to update the matching finished Gallery icon.
7. Export a review backup periodically.

## Safety and data handling
- The page uses the existing \`icon-maker-ai-categorization\` IndexedDB database and \`results\` store.
- Imported output is stored separately in \`externalPredictions\`; existing manual choices, benchmark results, and visual scores are preserved.
- Imported similarity scores are not probabilities and are never automatically applied to Gallery projects.
- Manual category selections are saved separately and take priority.
- Applying to Gallery is an explicit action and updates matching finished projects in \`localStorage\`.
- Keep both pages on the same origin and browser profile so they share browser storage.
