# Meal planner

## Purpose

Plan recipes into dated meal slots while preserving the selected week and surrounding context.

## Routes

- `/plan?date=YYYY-MM-DD` — Monday-first visible week.
- `/plan/add?date=YYYY-MM-DD&slot=...` — full-page add/replace flow; replacement also carries `entryId`, `recipeId`, and `servings` context.
- `GET /api/meal-plan?from&to` — inclusive visible-week read.

## Flows

Select an empty slot → open the full-page picker → search/filter an eligible recipe with chips → explicitly select a recipe → add from the action bar. New entries use two servings by default; replacements preserve the existing serving count. Existing cards expose a servings selector for future dates; saving a new value updates the meal-plan entry and recalculates the shopping projection. Confirmed remove remains in the calendar.

## Desktop UI

Seven-column week calendar. Add/replace navigates to a dedicated selection page and returns to the same week/date after saving. The selection page uses the same recipe-card grid and visual hierarchy as the Recipes catalogue; its fixed bottom action bar keeps the primary action visible without a duplicate selected-recipe summary panel.

## Mobile UI

Date strip plus one selected day, visible “Сьогодні” action, and a dedicated full-height mobile selection page. Category filters are horizontally scrollable chips, the add action stays above the bottom navigation while scrolling, and the calendar is usable at 320 px without horizontal page overflow.

## Actions

Change week/day, return to today, add, replace, remove, change servings, open detail, search/filter on the selection page, retry a stale read, and recover a missing recipe.

## State and storage

Only the visible inclusive week is requested. The selected date lives in the URL. Visible ranges are cached for 30 seconds with stale-while-refresh UI; recipe cards/pickers reuse five-minute summaries. Writes use the meal-plan repository, preserve one entry per date/slot, and invalidate every meal-plan range plus dashboard and shopping projections.

## Validation

Date and slot must be valid; servings are an integer from 1 to 99; archived recipes cannot be newly selected. Past slots are read-only.

## UI states

Initial loading, empty week/slot, ready, stale calendar with retry, local action error, offline banner, and missing-recipe state are distinct.

## Accessibility

The selection page has a labelled search, chips with `aria-pressed`, keyboard-safe recipe cards/buttons with selectable and deselectable state, changing subcategory clears the active recipe selection, the action bar is rendered only for an active selection, remove uses shared `ConfirmDialog`, controls have accessible names, and reduced motion is respected.

## Tricky cases

A failed refresh keeps stale calendar data. Replace shows current → new and commits only through “Замінити в плані”. Missing recipe references remain removable and never crash the week.

## Acceptance criteria

The API receives only the visible week; date survives reload/back; add and replace preserve context through `/plan/add` and return to the same date; changing servings on a future card persists 1–99 servings and refreshes shopping totals for the active ranges; planned detail returns to the same date.

## Tests

Domain tests cover date ranges and slot rules. Component tests cover responsive add/replace/remove, servings changes, stale data, local errors, menus, and missing recipes. E2E covers desktop/mobile core planning.

## Dependencies

Recipes, meal-plan API/repositories, shared dialog/confirm primitives, dashboard contextual links, and URL routing.
