# Architecture

Meal Planner is a React/TypeScript PWA with a Supabase backend. `src/app` owns shell, routes, auth gating, and providers; `src/features` owns product, recipe, meal-plan, shopping, and account capabilities; `src/supabase` owns server repositories; `src/db` retains legacy local backup/import code for compatibility and isolated domain tests; `src/shared` contains reusable UI and formatting.

Repositories isolate Supabase from React. Domain calculations are pure. The shopping repository reads products, recipes, ingredients, and the current user's plan and returns a derived projection without writes or cache state. Authenticated users can read system records and their own records; RLS is the server-side authorization boundary.
