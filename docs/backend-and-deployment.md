# Backend and deployment

Meal Planner uses Supabase for the server boundary and Vercel for the Vite PWA.

## Runtime model

- Supabase Auth provides email/password accounts and password reset.
- PostgreSQL stores products, recipes, recipe ingredients, and per-user meal plans.
- Supabase Storage bucket `recipe-images` stores system and personal recipe photos.
- Row Level Security exposes system records to authenticated users and restricts personal records to their owner.
- The browser contains only session state and temporary image previews. The source of truth is Supabase.
- The PWA shell remains installable, but data-changing actions require an internet connection in this first server-backed version.

## System and personal data

System products and recipes have `owner_id = null`; users can read them but cannot modify or archive them. User-created products and recipes have the authenticated user's ID and are private by default. A user's meal plan and derived shopping list are private.

## First-time setup

1. Create a Supabase project.
2. Run `supabase/migrations/20260814000000_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Configure email/password sign-up and the site URL in Supabase Auth.
4. Run the seed command with the project URL and service-role key:

```sh
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run seed:supabase
```

The service-role key is only for the one-time seed command. It must never be placed in `VITE_*` variables or committed.

5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Environment Variables.
6. Deploy with build command `npm run build` and output directory `dist`.

The seed is idempotent by stable system IDs and can be rerun after a clean database migration.
