# Settings and account

## Purpose

Manage account credentials, session, app information, data portability, and account deletion from one safe location.

## Routes

- `/settings` — authenticated settings.
- `/more` — mobile entry to Settings, Products, and account actions.
- `GET /api/account/export` and `DELETE /api/account` — portability and deletion.

## Flows

Change email/password, sign out, inspect PWA/connectivity/version, export personal data, or enter the separated dangerous zone.

## Desktop UI

Grouped settings cards inside the desktop shell, with dangerous actions visually separated at the end.

## Mobile UI

Settings are reachable through “Ще” in at most two taps. Sections stack and retain 44 px controls at 320 px.

## Actions

Update email/password, sign out, create ZIP export, and delete account after reauthentication plus typed confirmation.

## State and storage

Credentials/session are owned by Supabase Auth. Export manifest is versioned and generated on demand. The client stores no deletion flag or export archive.

## Validation

Credential fields use Auth rules. Deletion requires the current password and exact phrase `ВИДАЛИТИ АКАУНТ`; DELETE accepts only a JWT issued within five minutes.

## UI states

Idle, submitting, success, localized auth/API error, offline information, export progress, reauthentication error, and retryable partial deletion are explicit.

## Accessibility

Sections use headings/labels, status messages are live, the destructive dialog initially focuses Cancel, focus is trapped/restored, and delete remains disabled until both guards pass.

## Tricky cases

`AccountExportManifestV1` includes personal records, referenced system IDs/names, and short-lived private-image URLs. `fflate` creates `data.json` plus personal photos; system records are not duplicated. Deletion removes personal R2 objects before caller-only `delete_own_account()` and reports retryable partial failures.

## Acceptance criteria

Settings are mobile-reachable in two taps; export is a readable ZIP; deletion rejects stale JWTs or wrong phrases; successful deletion signs out; partial failures do not masquerade as success.

## Tests

Component tests cover credential updates, navigation, export, confirmation guards, and errors. API tests cover manifest shape, JWT freshness, R2 cleanup, idempotency, and protected RPC behavior.

## Dependencies

Supabase Auth, profiles, R2 storage, `fflate`, PWA registration, online-status primitive, and shared confirmation dialog.
