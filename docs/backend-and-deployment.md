# Backend and deployment

Meal Planner uses Vercel Functions as a REST API, Supabase for Auth/Postgres, Cloudflare R2 for recipe images, and Vercel for the Vite PWA.

## Runtime model

- Supabase Auth provides email/password accounts and password reset.
- PostgreSQL stores products, recipes, recipe ingredients, and per-user meal plans.
- Cloudflare R2 stores recipe photo objects using the existing `recipes.image_path` key. `system/...` objects are served from the configured public R2 custom domain; `<user-id>/...` objects are private and returned through short-lived presigned GET URLs.
- Row Level Security exposes system records to authenticated users and restricts personal records to their owner.
- The browser contains only Auth session state, temporary image previews, and the API client. Supabase is the source of truth for application data; R2 is the source of truth for image bytes.
- Authenticated API routes are `GET/POST /api/recipes`, `GET/PATCH/DELETE /api/recipes/:id`, `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id`, `GET /api/meal-plan`, `PUT /api/meal-plan`, `DELETE /api/meal-plan/:id`, and `GET /api/shopping-list`. Paginated recipe catalogue reads accept `page`, `pageSize` (default 24, maximum 100), `query`, `mealType`, `subcategoryId`, and `uncategorized`, and return `{ items, page, pageSize, total, hasNext }`. `POST /api/recipes/upload-url` issues a signed R2 upload URL; `/api/health` is the unauthenticated health check.
- Every protected route requires `Authorization: Bearer <supabase-access-token>`. Runtime Functions never use the service-role key. Supabase RLS authorizes database rows, while the API validates the owner prefix before issuing or saving any private R2 object URL.
- API success responses are `{ data: ... }`; errors are `{ error: { code, message } }` with status `400`, `401`, `403`, `404`, `409`, `422`, or `500`.
- The PWA shell remains installable, but data-changing actions require an internet connection in this first server-backed version.

## System and personal data

System products and recipes have `owner_id = null`; users can read them but cannot modify or archive them. User-created products and recipes have the authenticated user's ID and are private by default. A user's meal plan and derived shopping list are private.

## First-time setup

1. Create a Supabase project.
2. Run `supabase/migrations/20260814000000_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Configure email/password sign-up and the site URL in Supabase Auth.
4. Run the seed command with Supabase and R2 credentials. It uploads the stable system image keys directly to R2:

```sh
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
R2_ACCOUNT_ID=... \
R2_ACCESS_KEY_ID=... \
R2_SECRET_ACCESS_KEY=... \
R2_BUCKET_NAME=meal-planner-images \
npm run seed:supabase
```

The service-role key is only for the one-time seed command. It must never be placed in `VITE_*` variables or committed.

5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Environment Variables.
6. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel Environment Variables for the Functions. Keep `SUPABASE_SERVICE_ROLE_KEY` only in the local seed/migration environment.
7. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_BASE_URL` in Vercel. Never expose the R2 access key or secret in `VITE_*` variables.
8. In the R2 bucket settings, configure CORS for the Vercel origin and local development origin with `PUT`, `GET`, and `HEAD` methods and the `Content-Type` request header. Direct browser uploads use the presigned R2 S3 URL and therefore require this CORS rule.
9. Deploy with build command `npm run build` and output directory `dist`.

The browser does not call Supabase PostgREST or R2 with credentials. For a recipe photo, it requests `/api/recipes/upload-url`, uploads the blob with a direct presigned `PUT`, then sends recipe metadata to `/api/recipes`. Public system recipes use stable R2 CDN URLs; private user recipes receive presigned read URLs.

To move existing Supabase Storage objects without changing database keys, run the idempotent migration after setting both Supabase service-role and R2 credentials:

```sh
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
R2_BUCKET_NAME=meal-planner-images npm run migrate:r2
```

The seed is idempotent by stable system IDs and can be rerun after a clean database migration.

After moving an existing Supabase database to R2, run `npm run migrate:r2` once with the Supabase service-role key and R2 credentials. The database keeps the same `image_path` keys; the migration copies the existing bytes into the matching R2 keys. Until this migration (or a fresh R2-backed seed) is complete, system recipe metadata can load while its public R2 image URLs return missing objects.
