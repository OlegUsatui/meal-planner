# Smart shopping list

## Purpose

Present a read-only, explainable shopping projection derived from planned recipe demand.

## Routes

- `/shopping?range=7` — default next seven inclusive calendar days.
- URL presets: `today`, `7`, `14`, `all`, and `custom&from=YYYY-MM-DD&to=YYYY-MM-DD`.
- `GET /api/shopping-list?from&to` — inclusive range; omitted `to` means all future plan entries.

## Flows

Choose a preset or valid custom range, review category groups, disclose source contributions, print, share/copy, export CSV, or open the corresponding plan date.

## Desktop UI

Range/actions toolbar followed by editorial category sections and expandable item rows.

## Mobile UI

Presets, custom date fields, and actions wrap without horizontal overflow; source disclosures stack for readability at 320 px.

## Actions

Select Today/7/14/All/custom, retry, disclose sources, print, Web Share with clipboard fallback, export CSV, or plan a meal from the empty state.

## State and storage

The list stores nothing. It is recalculated from plan entries, recipe ingredients, products, and servings for the requested inclusive range. Each range is cached in session memory for 30 seconds; changing range cancels the obsolete request, preserves previous rows during transition/error, and never persists private list data.

## Validation

`from` is required by the API. `to` is optional and cannot precede `from`; invalid custom client ranges normalize safely. Only compatible base units aggregate.

## UI states

Initial loading, ready, empty, stale previous data with retry, full error without cached data, offline banner, and share/export status are distinct.

## Accessibility

Range controls are real buttons with `aria-pressed`; date inputs are labelled; source buttons expose expanded state; status and error messages use live semantics.

## Tricky cases

Demand is one-serving quantity × planned servings. Groups and names sort with Ukrainian locale. Display promotes `2500 g` to `2,5 кг` and `1500 ml` to `1,5 л`. Every source names date, meal slot, recipe, servings, and its contribution.

## Acceptance criteria

Default request covers today plus six days; All omits `to`; custom state survives reload/back; stale data remains visible after failure; the feature has no checks, manual rows, prices, purchase history, or persisted purchase state.

## Tests

Domain/repository tests cover inclusive ranges, aggregation, source attribution, and unit promotion. Component tests cover presets/custom URL state, grouping, disclosure, empty/stale/retry, share, and export.

## Dependencies

Meal plan, recipes, products, quantity formatting, shared async states, browser print/share/clipboard, and CSV download.
