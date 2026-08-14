# Testing strategy

Unit tests cover product validation, serving scaling, date cutoff, aggregation, empty plans, archived references, and duplicate date-slot protection. Repository tests use isolated IndexedDB databases and verify minimal product writes, meal-plan persistence, and derived shopping reads. Component tests cover product forms, calendar actions, shopping states, and responsive shell navigation. Playwright covers the end-to-end flow from products and recipes through multiple plan dates to the aggregated shopping list.
