# Meal Planner

Responsive server-backed PWA for planning meals, recipes, products, and a derived shopping list. The interface is Ukrainian and quantities use metric units.

## Current milestone

Implemented:

- React + strict TypeScript application shell;
- responsive desktop sidebar and mobile bottom navigation;
- installable offline PWA shell;
- Supabase Auth, PostgreSQL, Storage, and Row Level Security;
- shared system and private user product/recipe catalogues, meal planning, and archival;
- unit, repository, component, and desktop/mobile browser tests.

Meal calendar and the live shopping list are derived from persisted recipes, products, and plan entries.

## Requirements

- Node 22.19 or another version matching `package.json#engines`.
- npm 11 recommended for dependency installation.

Create `.env.local` from [`.env.example`](.env.example) and add the Supabase URL and anonymous browser key before running the app.

With nvm:

```sh
nvm use
npm install
```

## Commands

```sh
npm run start
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run seed:supabase
```

Use `npm run start` for local development with the API routes enabled, then open
<http://localhost:3000>. The Vite port printed during startup is an internal
port and should not be opened directly. Use `npm run dev` only for frontend
work that does not require `/api/*` routes.

For backend schema, seed import, Supabase Auth, Storage, and Vercel deployment, see [`docs/backend-and-deployment.md`](docs/backend-and-deployment.md).

Playwright requires Chromium once per machine:

```sh
npx playwright install chromium
```

## Documentation

Start with [`docs/README.md`](docs/README.md) and follow the repository rules in [`AGENTS.md`](AGENTS.md).
