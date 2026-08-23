# Today dashboard

## Purpose

Provide a useful daily starting point without forcing users to create personal content before planning a meal.

## Routes

- `/` — mobile-first “Сьогодні”.
- `GET /api/dashboard?today=YYYY-MM-DD` — today entries, next entry, seven-day shopping count, personal-content flags, and whether any plan entry exists.

## Flows

The user reviews four interactive meal slots, opens a planned recipe with date/slot context, fills an empty slot in the planner, or opens the seven-day shopping preview. Meal replacement and removal remain available in the weekly planner. The setup checklist appears only before the first plan entry; a personal product or recipe is always secondary.

## Desktop UI

The desktop composition uses the persistent sidebar, an editorial daily header, full day-style meal cards with recipe image, metadata and nutrition, a daily nutrition summary for one serving of each planned dish, and shopping preview. Empty slots retain the planner action; dashboard meal cards do not expose replace or remove actions.

## Mobile UI

At 320 px the page is a single column with bottom navigation, 44 px targets, no horizontal overflow, and full-width day-style meal cards with compact recipe metadata and an open-recipe action.

## Actions

Open the weekly plan, open a planned detail, add to an empty slot, review the daily nutrition summary, retry a failed refresh, or open the seven-day shopping list. Replace and remove actions are performed from the weekly plan.

## State and storage

The dashboard is server-backed and derived from profile, meal plan, recipes, and shopping demand. It stores no duplicate dashboard data. The summary query is fresh for 30 seconds, while full recipe details for today's entries use the catalogue/detail cache shared by the meal cards and daily nutrition summary. Meal-plan actions invalidate meal-plan, dashboard, and shopping queries.

## Validation

`today` is a local `YYYY-MM-DD` calendar date. Invalid dates are rejected by the endpoint.

## UI states

Initial loading, empty slots, filled slots, stale content with retry, full error without cached content, offline banner, and unavailable-recipe recovery remain distinguishable.

## Accessibility

The page has one `h1`, semantic links/buttons, visible focus, route focus management, meaningful loading/status text, keyboard-accessible recipe cards and controls, and no color-only state.

## Tricky cases

A refresh error must not erase previously rendered content. A missing or archived recipe reference remains recoverable and cannot crash the dashboard.

## Acceptance criteria

The request uses the browser-local date; plan links preserve that date; detail links preserve date/slot and return to `/`; dashboard cards open recipe details and do not mutate the meal plan; the nutrition summary sums per-serving values once per planned dish and shows `—` for incomplete metrics; the setup card disappears after any plan entry.

## Tests

Component and domain tests cover loading, empty, filled, stale/retry, full recipe cards, daily nutrition totals, missing nutrition values, absence of plan controls on dashboard cards, contextual links, missing recipes, and weekly-plan meal mutations. API/repository tests cover the seven-day boundary and content flags.

## Dependencies

Meal planner, recipes, shopping-list projection, authenticated profile, shared async states, and the application shell.
