# Onboarding

## 1. Purpose and user value

Introduce the server-backed product model, explain account persistence, and route the user toward the minimum usable setup: a product, a recipe, then a planned meal. Account creation happens before the application shell.

## 2. Routes and entry points

- Route: `/welcome`.
- First application start redirects here while `AppSettings.onboardingCompleted` is false.
- Settings may reopen the informational screens without resetting completion.

## 3. User flows

### First run

1. User sees the value proposition and three-step setup summary.
2. The auth page explains that data and photos are stored in the user's server account and are available across devices.
3. User selects “Почати”.
4. Completion is persisted and the user moves to `/products/new`.

### Skip setup guidance

1. User chooses “Перейти до застосунку”.
2. Confirmation copy states that setup can be started from empty states.
3. Completion is persisted and the user moves to the dashboard.

## 4. Desktop composition

- Centered two-column hero: food image/motif on the left, title and benefits on the right.
- “Як почати” section with numbered Product → Recipe → Plan cards.
- Persistent account-storage notice with an information icon.
- Primary “Почати” and tertiary “Перейти до застосунку” actions.

## 5. Mobile composition

- Single-column layout with compact 4:3 hero image.
- Benefits and setup steps stack vertically.
- Primary action spans the content width; skip remains a text action.
- Content scrolls normally and respects safe-area insets.

## 6. Actions and responses

| Action | Response |
| --- | --- |
| Start | Persist completion, navigate to product creation |
| Skip | Persist completion, navigate to dashboard |
| Open data explanation | Explain account storage and cross-device access |
| Reopen from Settings | Display content without changing existing data |

## 7. State, models, and storage

- Supabase Auth creates the account and `profiles` row.
- Personal records are authorized by the authenticated user's ID; system recipes are read-only.
- Completion write occurs before navigation; on failure the user remains on the page with retry.

## 8. Validation and business rules

- No form validation is required.
- The app must not claim offline writes or full offline synchronization in this version.
- Dismissing onboarding does not create sample data.

## 9. UI states

- **Loading:** branded skeleton while settings/database opens.
- **Error:** database startup failure uses the application recovery boundary, not a fake onboarding state.
- **Offline:** the shell may be installed, but sign-in and data changes require a connection.
- **Confirmation:** skip does not need a modal; its consequence is non-destructive.
- **Returning view:** when opened from Settings, back returns to Settings and setup actions remain available.

## 10. Accessibility and keyboard

- One page-level heading and ordered list for setup steps.
- Illustration is decorative unless it conveys unique information.
- Focus moves to the heading after route navigation.
- Buttons have explicit text and predictable order.

## 11. Tricky cases

- If settings exist but completion is missing after migration, default to false without resetting other data.
- A failed completion write must not navigate and cause onboarding to reappear unexpectedly.
- Private/incognito limitations may be explained but must not be detected through invasive heuristics.

## 12. Acceptance criteria

- A new database opens onboarding exactly once until the user completes or skips it.
- “Почати” navigates to product creation only after completion is saved.
- Reload after completion opens the dashboard.
- Copy explicitly says data is stored in the account and available across devices.
- Layout is usable at 320 px and keyboard accessible.

## 13. Tests

- Unit: settings default and completion transition.
- Component: start/skip navigation, failed write, expanded explanation, returning mode.
- E2E: fresh database → onboarding → product creation; reload skips onboarding.
- Accessibility: heading structure, button names, focus on route entry.

## 14. Dependencies

- [Product overview](../product-overview.md)
- [Architecture: offline behavior](../architecture.md#offline-and-pwa-behavior)
- [Settings](settings.md)
- [Products](products.md)
