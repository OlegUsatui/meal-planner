# Smart shopping list

## Purpose

Present an explainable shopping projection derived from planned recipe demand, allow a temporary serving adjustment for preparation convenience, and let the shopper mark products as purchased on the current device.

## Routes

- `/shopping?range=7` — default next seven inclusive calendar days.
- URL presets: `today`, `7`, `14`, `all`, and `custom&from=YYYY-MM-DD&to=YYYY-MM-DD`.
- `GET /api/shopping-list?from&to` — inclusive range; omitted `to` means all future plan entries.

## Flows

Choose a preset or valid custom range, adjust one total servings value for the whole list, mark products as purchased, reset purchase marks, review category groups, disclose source contributions, print, share/copy, export CSV, or open the corresponding plan date.

## Desktop UI

Range/actions toolbar, purchase progress, then editorial category sections and expandable item rows with checkboxes.

## Mobile UI

Presets, custom date fields, and actions wrap without horizontal overflow; source disclosures stack for readability at 320 px.

## Actions

Select Today/7/14/All/custom, check or uncheck a product, reset marks for the selected range, retry, disclose sources, print, Web Share with clipboard fallback, export CSV, or plan a meal from the empty state.

## State and storage

The product list is recalculated from plan entries, one-serving recipe ingredients, and products for the requested inclusive range. For the current local date, breakfast is excluded from 09:00, lunch from 13:00, and dinner from 18:00; snacks remain eligible all day, while future dates include every slot. Each range is cached in session memory for 30 seconds; changing range cancels the obsolete request and shows a loading state instead of displaying another range's rows, while a failed refresh of the active range preserves stale rows. Source serving adjustments are UI-only, recalculate aggregate quantities and exports in memory, do not update the meal plan, and reset when the range changes or the page reloads. Purchase marks are the only persisted shopping state: the browser stores product IDs in local storage under the authenticated user and exact range, so marks survive reloads on that device but are not synchronized to another device or sent to the server. Marks remain visible after checking, and reset clears marks for the selected range.

## Validation

`from` is required by the API. `to` is optional and cannot precede `from`; invalid custom client ranges normalize safely. Only compatible base units aggregate. Product IDs no longer present in the loaded range are ignored when calculating progress.

## UI states

Initial loading, ready, empty, stale previous data with retry, full error without cached data, offline banner, and share/export status are distinct.

## Accessibility

Range controls are real buttons with `aria-pressed`; date inputs are labelled; purchase controls are native checkboxes with product-specific labels; the progress uses live semantics; source buttons expose expanded state; status and error messages use live semantics.

## Tricky cases

Demand starts from one-serving quantity. One page-level servings stepper can temporarily scale the entire visible shopping calculation. Groups and names sort with Ukrainian locale. Display promotes `2500 g` to `2,5 кг` and `1500 ml` to `1,5 л`. Every source names date, meal slot, recipe, and its contribution.

## Acceptance criteria

Default request covers today plus six days; All omits `to`; custom state survives reload/back; returning to the page always refreshes the selected range so a newly added plan entry appears without waiting for the cache TTL; stale data remains visible after failure; product marks survive reload on the same device for the exact range; the total servings adjustment updates visible totals without changing the plan and resets after range changes or reload; progress and reset are available; checked rows remain visible; the feature has no manual rows, prices, purchase history, or server-side purchase state.

## Tests

Domain/repository tests cover inclusive ranges, aggregation, source attribution, and unit promotion. Component tests cover presets/custom URL state, grouping, disclosure, empty/stale/retry, local purchase marks, progress, reset, share, and export.

## Dependencies

Meal plan, recipes, products, quantity formatting, shared async states, browser print/share/clipboard, and CSV download.
