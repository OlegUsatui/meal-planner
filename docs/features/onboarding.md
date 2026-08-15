# Onboarding

## Purpose

Help a new user plan one useful system recipe before teaching optional catalogue management.

## Routes

- `/welcome?returnTo=...` — required first-run flow.
- `/welcome?info=1` — informational Settings entry that never changes completion.
- `GET/PATCH /api/me` — reads and idempotently writes onboarding completion.

## Flows

Value introduction → date and meal slot → eligible system-recipe picker → servings → first plan entry → scaled shopping preview. Skip completes onboarding without creating content and returns to the requested safe route.

## Desktop UI

Centered editorial card with a dialog recipe picker and a persistent sense of progress.

## Mobile UI

Single-column layout at 320 px; the recipe picker becomes a full-height drawer and primary action remains reachable without horizontal scrolling.

## Actions

Start, select date/slot/recipe/servings, retry a failed read/write, finish, or skip. Personal product and recipe creation are not prerequisites.

## State and storage

`profiles.onboarding_completed_at` is the server authority. Draft selections are transient. Completion is written only after the plan entry saves or after explicit Skip. The picker requests `systemOnly=true` summaries once per session; the selected full recipe is fetched only before rendering the shopping preview.

## Validation

Date uses `YYYY-MM-DD`; slot is a supported meal slot; recipe must be eligible and system-backed; servings are a whole number from 1 to 99.

## UI states

Profile loading, picker loading, empty system catalogue, recoverable error, saving, and success preview are explicit. Failed writes retain the user’s selections.

## Accessibility

One page heading, explicit labels, 44 px targets, focus trap/restore in the picker, Escape handling, visible focus, and polite status updates.

## Tricky cases

Repeated PATCH calls are idempotent. Info mode cannot mark a profile complete. Unsafe `returnTo` values are ignored. A plan-write error cannot complete onboarding.

## Acceptance criteria

A new account can plan its first meal without creating a product or recipe; skip reaches the dashboard; the requested route is restored after completion; shopping preview uses selected servings.

## Tests

Component tests cover start, skip, retry, picker, servings, success, and info mode. API/repository tests cover default incomplete and idempotent transition.

## Dependencies

Authenticated profile, system recipes, meal-plan repository, shopping calculation, responsive dialog/drawer, and route guard.
