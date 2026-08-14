# Settings

## 1. Purpose and user value

Explain fixed preferences and provide account/session controls for the server-backed Meal Planner. The legacy local backup flow is no longer part of the production settings UI.

## 2. Routes and entry points

- Route: `/settings`.
- Entry from desktop sidebar footer or compact application menu.
- Secondary links to `/welcome?mode=info` and browser/PWA information.

## 3. User flows

### Review preferences

1. Open Settings.
2. See current interface language, currency, unit system, server persistence model, and app version.
3. Reopen onboarding explanation if desired.

### Account session

1. Open “Небезпечна зона”.
2. Choose “Видалити всі локальні дані”.
3. Dialog enumerates recipes, photos, plans, products, and settings that will be deleted and explains there is no backup.
4. User types the exact Ukrainian confirmation phrase `ВИДАЛИТИ ВСЕ`.
5. Confirm button becomes available.
6. App closes/deletes IndexedDB and relevant app caches, reloads, and returns to onboarding.

### Backup and restore (legacy)

1. Choose “Завантажити копію” to save a versioned JSON backup containing all domain records and recipe photos.
2. Choose “Відновити з файлу” and select a Meal Planner JSON backup.
3. Confirm the destructive replacement warning.
4. The validated backup replaces all local tables in one transaction; malformed files do not change existing data.

## 4. Desktop composition

- Narrow 720 px settings column.
- Sections: Application, Language and formats, Data and offline use, About, Dangerous zone.
- Fixed values appear as read-only rows with explanation rather than controls that imply unsupported choices.
- Dangerous zone is visually separated at the bottom.

## 5. Mobile composition

- One-column sections with full-width rows.
- Destructive flow uses full-screen or safely sized dialog above the keyboard.
- Confirmation action remains visible but cannot overlap typed phrase.

## 6. Actions and responses

| Action | Response |
| --- | --- |
| Reopen onboarding | Open informational mode without changing completion |
| Export backup | Download a versioned JSON file with records and images |
| Restore backup | Validate and atomically replace all local records after confirmation |
| View local-data details | Explain browser storage and lack of sync |
| Clear data | Require exact phrase, delete database/caches, reload onboarding |
| Navigate back | Return to prior page or dashboard |

## 7. State, models, and storage

- Reads the authenticated session and application/build version.
- Locale `uk-UA`, currency `NOK`, metric units, and Monday week start are fixed in v1.
- Storage usage may use `navigator.storage.estimate()` as approximate read-only information when available.
- Clear operation affects all database tables and application-controlled caches.

## 8. Validation and business rules

- Supabase is the source of truth for recipes, products, plans, and photos.
- Restore requires explicit confirmation and fully replaces local data; it never merges or silently overwrites.
- No setting suggests multi-language, multi-currency, or cloud sync support.
- Confirmation phrase match is exact after trimming outer whitespace; it is otherwise case-sensitive.
- Destructive operation does not start until explicit confirmation.
- Failure to clear one storage layer must be reported accurately; do not claim success or partially navigate to onboarding without recovery guidance.
- Clearing browser data outside the app remains outside application control and is explained.

## 9. UI states

- **Loading:** settings skeleton during database open.
- **Storage estimate unavailable:** omit numeric usage and retain explanation.
- **Offline:** normal behavior.
- **Clear confirmation:** destructive content, phrase field, disabled confirm until match.
- **Clearing:** blocking progress; prevent duplicate action and navigation.
- **Partial/failure:** error with retry/reload guidance and no false success.
- **Success:** hard reload into a new database and onboarding.
- **Backup error:** report export/import failure without changing existing records.

## 10. Accessibility and keyboard

- Settings sections use headings and description lists/semantic groups.
- Read-only rows are not disabled form controls.
- Dangerous action uses explicit verb and consequence.
- Dialog initial focus is on its heading or explanation, not destructive confirm.
- Error and progress are announced; focus returns safely on cancellation.

## 11. Tricky cases

- Service worker/cache APIs may be unavailable; database deletion remains primary and errors are handled separately.
- Open object URLs and database connections must close before deletion.
- Other open tabs may hold the database; show a blocking-tab message and retry rather than silently fail.
- The app does not offer backup before clearing because backup/export is outside v1; warning must be unambiguous.
- Reopening onboarding must not reset completion or data.

## 12. Acceptance criteria

- Settings accurately display Ukrainian, NOK, metric units, and Monday as fixed v1 behavior.
- Reopened onboarding does not modify records.
- A backup round-trip preserves recipes, products, plans, ingredients, settings, and photos.
- Invalid backups are rejected without changing existing records.
- Data clearing is impossible without the exact phrase and explicit action.
- Successful clear removes all domain records/images and returns to first-run onboarding.
- Failed/blocked clear does not claim success or silently discard a subset.
- Screen is usable with keyboard and at 320 px.

## 13. Tests

- Unit: confirmation phrase predicate and fixed settings defaults.
- Component: sections, unsupported estimate, confirmation, clearing/error/success states.
- Repository/integration: close and delete database, verify every table empty after reopen.
- E2E: seed data, cancel clear, confirm clear, verify onboarding and empty database.
- Accessibility: destructive dialog naming, focus, progress, and error announcement.

## 14. Dependencies

- [Onboarding](onboarding.md)
- [Architecture: error and recovery](../architecture.md#error-and-recovery-boundaries)
- [Database: data clearing](../database-schema.md#data-clearing)
- [Domain model: AppSettings](../domain-model.md#appsettings)
