# Shopping list

## Purpose and route
`/shopping` shows a live, read-only list derived from products, recipes, and future meal-plan entries.

## Calculation
Entries with `date >= today` are included. Each recipe ingredient is stored for one serving and scaled by `plannedServings`; equal product IDs are aggregated in base units. Rows show product name, category, total quantity, unit, and source recipes/dates.

## States
The page exposes loading, error, and empty states. The empty state links to `/plan` and explains that the list appears after planning recipes. There are no checks, purchases, manual rows, snapshots, prices, package rounding, or shopping storage.

The shopping list is read from the authenticated `/api/shopping-list` endpoint. The API derives the list from the current user's future meal plan and shared catalog data, preserving the existing read-only behavior.
