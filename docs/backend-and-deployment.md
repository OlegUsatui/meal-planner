# Backend and deployment

Meal Planner uses Vercel Functions as a REST API, Supabase for Auth/Postgres/Storage, and Vercel for the Vite PWA.

## Runtime model

- Supabase Auth provides email/password accounts and password reset.
- PostgreSQL stores products, recipes, recipe ingredients, and per-user meal plans.
- Supabase Storage bucket `recipe-images` stores system and personal recipe photos.
- Row Level Security exposes system records to authenticated users and restricts personal records to their owner.
- The browser contains only Auth session state, temporary image previews, and the API client. The source of truth is Supabase.
- Authenticated API routes are `GET/POST /api/recipes`, `GET/PATCH/DELETE /api/recipes/:id`, `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id`, `GET /api/meal-plan`, `PUT /api/meal-plan`, `DELETE /api/meal-plan/:id`, and `GET /api/shopping-list`. `POST /api/recipes/upload-url` issues a signed Storage upload URL; `/api/health` is the unauthenticated health check.
- Every protected route requires `Authorization: Bearer <supabase-access-token>`. Runtime Functions never use the service-role key. RLS continues to enforce access to rows and Storage objects.
- API success responses are `{ data: ... }`; errors are `{ error: { code, message } }` with status `400`, `401`, `403`, `404`, `409`, `422`, or `500`.
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
6. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel Environment Variables for the Functions. Keep `SUPABASE_SERVICE_ROLE_KEY` only in the local seed command environment.
7. Deploy with build command `npm run build` and output directory `dist`.

The browser does not call Supabase PostgREST or Storage directly. For a recipe photo, the browser requests `/api/recipes/upload-url`, uploads the file with `POST` and `FormData` to the returned signed URL, then sends recipe metadata to `/api/recipes`. Recipe list responses use one Storage `createSignedUrls` batch, so the seeded catalogue does not create hundreds of parallel signing requests.

The seed is idempotent by stable system IDs and can be rerun after a clean database migration.
