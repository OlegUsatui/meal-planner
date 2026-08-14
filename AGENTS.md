# Repository guidance for humans and AI assistants

This file is the operating contract for work in Meal Planner. The repository is designed as a local-first React and TypeScript PWA. Product behavior is specified under `docs/`; implementation must not silently diverge from it.

## Before changing code

1. Read the relevant sections of `docs/architecture.md`, `docs/domain-model.md`, `docs/business-rules.md`, and `docs/ai-context.md`.
2. Read the owning document under `docs/features/` for any user-visible change.
3. Inspect the target implementation, its nearest unit or component tests, and the route or storage contract that owns the behavior.
4. Check `git status` and preserve unrelated user changes.
5. Define the smallest behavior change, its edge cases, and its focused verification command before editing.
6. If the documentation and implementation disagree, stop and resolve which behavior is intended before proceeding.

## Requirements discovery

- Do not implement behavior while a material product, data, accessibility, or migration decision remains ambiguous.
- Resolve discoverable facts from documentation, source, tests, and existing conventions before asking questions.
- Ask for a product decision when multiple reasonable behaviors remain. Present concrete choices and their consequences.
- Define testable acceptance criteria before implementation.
- Do not silently invent requirements, fallback behavior, data migrations, or destructive recovery paths.
- If implementation reveals a new contradiction, stop, record it, and request clarification.

## TDD policy

- For every behavior change, write or update a focused test before changing the implementation.
- Start with a failing test that describes observable behavior, implement the smallest change that makes it pass, then refactor while green.
- Add regression tests for bug fixes.
- Test calculations and state transitions at unit level, React interactions at component level, repository integration against an isolated IndexedDB database, and only shell-dependent user journeys in Playwright.
- Documentation-only, configuration-only, and dependency-only changes are exempt from test-first implementation, but still require proportionate validation.
- Keep tests deterministic. Do not use sleeps, arbitrary timeouts, the current wall clock without injection, or external services.

## Engineering best practices

- Keep one feature or behavior change per pull request and avoid unrelated refactors.
- New or substantially changed React components should stay below 200 lines; hooks, repositories, and pure domain modules should stay below 200 lines. Split by responsibility or document an intentional exception.
- Use strict, explicit TypeScript types, discriminated unions, branded identifiers where useful, and `unknown` instead of `any`.
- Never weaken TypeScript, ESLint, accessibility, or test settings to make a change pass.
- Keep state at the narrowest useful scope: component state for transient UI, feature hooks for feature orchestration, and application providers only for truly cross-feature concerns.
- Keep business rules in pure domain functions. React components render state and emit user intent; hooks coordinate flows; repositories own persistence; Dexie adapters own IndexedDB details.
- Do not call Dexie tables directly from React components.
- Keep storage records at the storage boundary and map them to domain models when shapes, defaults, or versions differ.
- Treat dates as local calendar dates in `YYYY-MM-DD` form unless an event requires an instant. Store instants as ISO 8601 UTC strings.
- Prefer semantic HTML and shared accessible UI primitives. Preserve labels, focus order, validation messages, keyboard access, and reduced-motion preferences.
- Measure before adding caching, memoization, virtualisation, or other performance complexity.
- Never log recipe photos, user-entered content, database dumps, or other personal data in production.

## Architecture boundaries

- `src/app/` owns application bootstrap, router, providers, shell, global error boundaries, PWA registration, and top-level navigation.
- `src/features/` owns business capabilities. Each feature may contain `components/`, `hooks/`, `domain/`, `repositories/`, `types/`, and colocated tests.
- `src/shared/` contains genuinely reusable UI primitives, formatting, generic validation, test utilities, and cross-feature types. Do not use it as a dumping ground.
- `src/db/` owns the Dexie database, persisted record types, versioned schemas, migrations, transactions, and repository adapters.
- Feature code may depend on `shared` and repository interfaces. Shared code must not depend on a feature. Domain calculations must not import React or Dexie.
- Cross-feature workflows must be coordinated through explicit services or use cases, not by importing another feature's internal component or store.

## React and storage rules

- Use functional components and hooks. Avoid class components unless required by a boundary library.
- Keep side effects in hooks, services, or repository adapters; never perform storage writes during render.
- Use stable keys based on entity identifiers, not array indexes.
- Model async UI explicitly with idle, loading, success, empty, and error states where applicable.
- Group multi-record mutations that must succeed together in one Dexie transaction.
- Inventory consumption and shopping purchase confirmation must be idempotent and transactionally guarded.
- Every IndexedDB schema change requires a version bump, migration tests, and an update to `docs/database-schema.md`.
- Do not delete referenced domain records. Follow the documented archive policy and retain historical readability.

## Change and verification rules

- Update the owning `docs/features/*.md` whenever a feature's route, UI structure, state, validation, storage behavior, accessibility contract, or edge case changes.
- Update `docs/domain-model.md`, `docs/database-schema.md`, or `docs/business-rules.md` with any corresponding contract change.
- Add or update the nearest focused tests before implementation.
- Run focused tests during development, then `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run build` before handoff when those scripts exist.
- Run Playwright only for flows that require the real application shell, routing, responsive navigation, service worker, or browser IndexedDB integration.
- Do not run repository-wide format or auto-fix commands to clean up unrelated files.
- Do not add a dependency until the existing platform and shared utilities have been inspected; document the need and tradeoff.

## Safe editing

- Keep changes local, reviewable, and reversible.
- Never use destructive Git commands to discard user work.
- Never commit secrets, local database exports, user images, `.env` files, or registry tokens.
- Confirm exact targets before deleting data or changing a database migration.
- Settings that clear local data require an explicit destructive confirmation and must not masquerade as ordinary navigation.

## Feature documentation

- Every business directory under `src/features/` must have a matching document under `docs/features/`.
- Feature documents use this structure: purpose; routes; flows; desktop UI; mobile UI; actions; state and storage; validation; UI states; accessibility; tricky cases; acceptance criteria; tests; dependencies.
- Add a feature document before or together with a new feature implementation.
- Documentation is part of the behavior contract and must change in the same pull request as the behavior.

