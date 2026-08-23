# Meal planner

## Purpose

Plan recipes into dated meal slots while preserving the selected week and surrounding context.

## Routes

- `/plan?date=YYYY-MM-DD` — Monday-first visible week with the seven-column week view.
- `/plan/add?date=YYYY-MM-DD&slot=...` — full-page add/replace flow; replacement also carries `entryId` and `recipeId` context.
- `GET /api/meal-plan?from&to` — inclusive visible-week read. The selected date is stored in the URL and restored when returning to `/plan`.

## Flows

Select an empty slot → open the full-page picker → search/filter an eligible recipe with chips → explicitly select a recipe → add from the action bar. Add and replace save only the selected recipe into the date/slot. Confirmed remove remains in the calendar. Today's richer day-style cards are shown on the dashboard, where all current-day meal actions are also available.

## Desktop UI

The planner uses a seven-day date strip followed by a seven-column weekly calendar. Week cards use a compact vertical editorial layout: 4:3 image or illustrated placeholder, visible two-line recipe title, preparation time/category metadata, and the existing replace/remove action menu. The calendar uses a paper grid, dashed pencil-like boundaries, and warm slot surfaces without changing the underlying meal actions. The week view uses summaries only; full recipe details are loaded only when opening a recipe. Add/replace navigates to a dedicated selection page and returns to the same week/date after saving. The selection page uses the same recipe-card grid and visual hierarchy as the Recipes catalogue; its fixed bottom action bar keeps the primary action visible without a duplicate selected-recipe summary panel.

## Mobile UI

The week calendar keeps the seven columns inside a horizontally scrollable calendar surface without page overflow. Category filters are horizontally scrollable chips, the add action stays above the bottom navigation while scrolling, and the calendar is usable at 320 px. Rich day-style cards are available on the dashboard for today's meals.

## Actions

Change week, return to today, add, replace, remove, open detail from a planned card or the add/replace selection card, search/filter on the selection page, retry a stale read, and recover a missing recipe.

## State and storage

Only the visible inclusive week is requested. The selected date lives in the URL. Visible ranges are cached for 30 seconds with stale-while-refresh UI; changing date or day/week range shows a loading state instead of retaining another range's calendar; recipe cards/pickers reuse five-minute summaries. Writes use the meal-plan repository, preserve one entry per date/slot, and invalidate every meal-plan range plus dashboard and shopping projections.

## Validation

Date and slot must be valid; archived recipes cannot be newly selected. Past slots are read-only.

## UI states

Initial loading, empty week/slot, ready, stale calendar with retry, local action error, offline banner, and missing-recipe state are distinct.

## Accessibility

The selection page has a labelled search, chips with `aria-pressed`, keyboard-safe recipe cards/buttons with selectable and deselectable state, changing subcategory clears the active recipe selection, the action bar is rendered only for an active selection, remove uses shared `ConfirmDialog`, controls have accessible names, and reduced motion is respected.

## Tricky cases

A failed refresh keeps stale calendar data. Replace shows current → new and commits only through “Замінити в плані”. Missing recipe references remain removable and never crash the week.

## Acceptance criteria

The API receives only the visible week; date survives reload/back; add and replace preserve context through `/plan/add` and return to the same date; planned detail returns to the same date.

## Tests

Domain tests cover date ranges and slot rules. Component tests cover responsive add/replace/remove, absence of servings controls, stale data, local errors, menus, and missing recipes. E2E covers desktop/mobile core planning.

## Dependencies

Recipes, meal-plan API/repositories, shared dialog/confirm primitives, dashboard contextual links, and URL routing.
