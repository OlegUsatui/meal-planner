# Design system

Meal Planner uses a Nordic editorial visual language: Newsreader for display headings and Manrope for interface copy. Semantic colours are canvas `#F6F2EA`, surface `#FFFFFF`, ink `#202421`, muted `#5F665F`, forest primary `#365846`, terracotta accent `#9E443A`, soft accent `#F3DDD7`, and border `#D8D3C8`. Text and controls must meet WCAG 2.2 AA contrast.

Spacing follows a 4/8 px rhythm. Standard radii are 12, 20, and 28 px. Touch targets are at least 44 by 44 px. Shadows are restrained and never the sole boundary. Lucide icons replace text glyphs and always have either a visible label or an accessible name.

Shared primitives own buttons, fields, async comboboxes, dialogs/drawers, menus, toasts, banners, skeletons, empty/error states, confirmations, and date-range controls. Every interactive element has visible focus; motion respects `prefers-reduced-motion`; loading, empty, stale, offline, error, and success states use consistent copy and placement.

Planner and shopping views prioritize date, recipe, servings, product, quantity, and unit. Avoid language implying stock, cooking completion, or purchases because shopping remains a read-only demand projection.
