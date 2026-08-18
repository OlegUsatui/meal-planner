# Products

## Purpose

Maintain reusable ingredient names, categories, and base units for recipes and shopping calculations.

## Routes

- `/products?q=&category=&archived=true&page=` — server-paginated catalogue with URL-backed state.
- `/products/new` and `/products/:productId` — create/edit/detail.

## Flows

Search with 300 ms debounce, filter by category/archive state, create or edit, archive, and restore. Existing recipe references remain readable.

## Desktop UI

Catalogue table/list, labelled filters, result range, pagination, and primary create action.

## Mobile UI

Equivalent card presentation with full-width filters and 44 px actions; no horizontal overflow at 320 px.

## Actions

Search, filter, paginate, create, edit, archive, restore, and admin-only permanent delete when unreferenced.

## State and storage

Query/category/archive/page live in the URL. Products are server-backed; archived products remain referenced but are excluded from new ingredient choices. Catalogue/detail reads reuse the five-minute authenticated session cache and cancel superseded searches. Create/update/archive/restore/delete invalidates product catalogues, recipe ingredient pickers, recipes, meal plans, shopping lists, and dashboard data.

## Validation

Names are trimmed and normalized for duplicates. A referenced base unit can be changed after explicit confirmation; numeric ingredient values stay unchanged and the new unit propagates to all linked recipes atomically. New values use the controlled taxonomy: Овочі та зелень; Фрукти; М’ясо та птиця; Риба та морепродукти; Молочні продукти; Яйця; Крупи та макарони; Бобові; Горіхи та насіння; Рослинний білок; Соуси та олії; Спеції та зелень; Інше.

## UI states

Loading, empty catalogue, no filtered results, request error, inline validation, archived badge, deprecated legacy category, and restore error are explicit.

## Accessibility

Search and filters have labels, filter state uses native controls, pagination exposes current/disabled state, and destructive actions use accessible dialogs.

## Tricky cases

Ambiguous legacy categories are never rewritten automatically; edit shows the old value as deprecated until manually replaced. A referenced unit change previews the affected recipe count and example transformation, then updates all linked ingredient units atomically. Archive is non-destructive.

## Acceptance criteria

URL state restores after reload/back; active ingredient pickers exclude archived products; archived records restore; controlled taxonomy applies only to new/manual edits.

## Tests

Domain tests cover normalization/taxonomy. Component tests cover URL filters, validation, archive/restore, referenced-unit confirmation, and legacy values. Repository tests cover pagination, atomic unit propagation, and rollback on failure.

## Dependencies

Recipes, shopping aggregation, authenticated API, shared pagination/dialogs, and importer taxonomy.
