# Meal Planner documentation

Meal Planner is a server-backed meal planning PWA. This directory is the source of truth for product behavior, domain rules, UI structure, persistence, and verification.

## Recommended reading order

1. [Product overview](product-overview.md)
2. [AI context and locked decisions](ai-context.md)
3. [Domain model](domain-model.md)
4. [Business rules](business-rules.md)
5. [Architecture](architecture.md)
6. [Database schema](database-schema.md)
7. [Backend and deployment](backend-and-deployment.md)
8. [Design system](design-system.md)
9. [Responsive layout](responsive-layout.md)
10. [Testing strategy](testing-strategy.md)
11. The relevant feature document

## Product and technical documents

| Document | Authority |
| --- | --- |
| [Product overview](product-overview.md) | Goals, audience, navigation, MVP boundaries |
| [Architecture](architecture.md) | Application layers, dependency direction, offline architecture |
| [Domain model](domain-model.md) | Entities, relationships, lifecycle, invariants |
| [Database schema](database-schema.md) | Supabase tables, RLS, Storage, and legacy local migrations |
| [Business rules](business-rules.md) | Products, servings, plan and derived-list calculations |
| [Design system](design-system.md) | Visual tokens, components, interaction and accessibility |
| [Responsive layout](responsive-layout.md) | Breakpoints and desktop/mobile composition |
| [AI context](ai-context.md) | Compact locked context and non-goals for agents |
| [Testing strategy](testing-strategy.md) | TDD approach, test layers, fixtures and quality gates |

## Feature documents

| Feature | Document |
| --- | --- |
| Today and near-term overview | [Dashboard](features/dashboard.md) |
| Monthly meal planning | [Meal planner](features/meal-planner.md) |
| Recipe management | [Recipes](features/recipes.md) |
| Product catalogue | [Products](features/products.md) |
| Live derived shopping list | [Shopping lists](features/shopping-lists.md) |
| Local preferences and data reset | [Settings](features/settings.md) |

## Documentation ownership

- Product intent belongs in `product-overview.md`.
- A domain concept is defined once in `domain-model.md`; feature files link to it rather than redefining it.
- Calculation semantics belong in `business-rules.md`.
- Persisted fields and migrations belong in `database-schema.md`.
- Each observable UI flow and its acceptance criteria belong in the owning feature document.
- Cross-feature visual behavior belongs in `design-system.md` or `responsive-layout.md`.
- Any implementation that changes these contracts must update the relevant documents in the same change.

## Current status

- Stage: meal planner and live shopping list implemented.
- Intended stack: React, TypeScript, Vite PWA, React Router, Supabase Auth/Postgres/Storage.
- Data model: authenticated accounts, shared read-only system recipes, private user recipes and plans.
- Language and formats: Ukrainian UI and metric units.
- Delivery targets: responsive desktop, tablet, and mobile browsers with an installable PWA shell; server data changes require connectivity.
- Implemented now: responsive shell, PWA build, Supabase auth/repositories, RLS schema, categorized system recipes, meal planner, and a live derived shopping list.
