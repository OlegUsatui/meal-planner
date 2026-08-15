# Today dashboard

## Purpose

Provide a useful daily starting point without forcing users to create personal content before planning a meal.

## Routes

- `/` — mobile-first “Сьогодні”.
- `GET /api/dashboard?today=YYYY-MM-DD` — today entries, next entry, seven-day shopping count, personal-content flags, and whether any plan entry exists.

## Flows

The user reviews four meal slots, opens a planned recipe with date/slot/servings context, fills an empty slot in the planner, or opens the seven-day shopping preview. The setup checklist appears only before the first plan entry; a personal product or recipe is always secondary.

## Desktop UI

The desktop composition uses the persistent sidebar, an editorial daily header, a meal grid, next-meal summary, and shopping preview.

## Mobile UI

At 320 px the page is a single column with bottom navigation, 44 px targets, no horizontal overflow, and contextual actions adjacent to the relevant card.

## Actions

Open plan at today, open a planned detail, add to an empty slot, retry a failed refresh, or open the seven-day shopping list.

## State and storage

The dashboard is server-backed and derived from profile, meal plan, recipes, and shopping demand. It stores no duplicate dashboard data. Its session-memory query is fresh for 30 seconds, refetches stale data on focus, and retains the last successful summary during a background error.

## Validation

`today` is a local `YYYY-MM-DD` calendar date. Invalid dates are rejected by the endpoint.

## UI states

Initial loading, empty slots, filled slots, stale content with retry, full error without cached content, offline banner, and unavailable-recipe recovery remain distinguishable.

## Accessibility

The page has one `h1`, semantic links/buttons, visible focus, route focus management, meaningful loading/status text, and no color-only state.

## Tricky cases

A refresh error must not erase previously rendered content. A missing or archived recipe reference remains recoverable and cannot crash the dashboard.

## Acceptance criteria

The request uses the browser-local date; plan links preserve that date; detail links preserve date/slot/servings and return context; the setup card disappears after any plan entry.

## Tests

Component tests cover loading, empty, filled, stale/retry, missing recipes, and contextual links. API/repository tests cover the seven-day boundary and content flags.

## Dependencies

Meal planner, recipes, shopping-list projection, authenticated profile, shared async states, and the application shell.
