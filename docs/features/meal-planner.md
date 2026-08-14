# Meal planner

## Purpose and route

`/plan` is a responsive weekly calendar for assigning recipes to breakfast, lunch, dinner, and snack slots.

## Desktop and mobile UI

Desktop shows seven day columns with four meal slots each. Planned meals are photo cards with recipe name and servings; empty slots expose an add action. Mobile shows a horizontal seven-day selector and the four full-width slots of the selected day. Navigation supports previous/next week and returning to today.

## Flows

Adding or replacing opens a searchable active-recipe picker with servings from 1 to 99 and subcategory filtering. The picker includes recipes classified for that slot plus legacy unclassified recipes; snack uses its own recipe category. Clicking a meal card opens recipe details with categories, photo, preparation time, per-serving and planned-total nutrition, scaled ingredients, and instructions. A separate card menu provides replace and confirmed delete actions. Past dates remain read-only.

## State and storage

`MealPlanRepository` persists date, slot, recipe ID, servings, and timestamps. `(date, slot)` remains unique. Active recipes populate the picker; archived recipes referenced by existing entries are loaded by ID and remain readable.

## Accessibility and states

Dialogs close via their close control, `Escape`, or backdrop, trap keyboard focus, and restore focus to the originating card. The page provides loading/error states, missing-recipe fallback, empty-picker guidance, visible focus, and keyboard-operable controls.

## Acceptance and tests

Tests cover Monday-first week boundaries, navigation helpers, seven days/four slots, add/replace/delete, recipe details, nutrition and ingredient scaling, archived references, read-only past dates, and desktop/mobile layout contracts.

The calendar uses `/api/meal-plan` for entries and `/api/recipes` for selectable recipes. Both calls carry the Supabase access token through the shared API client; loading failures remain visible as a retryable plan error instead of an empty calendar.
