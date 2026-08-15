# Backend and deployment

Meal Planner uses Vercel Functions as a REST API, Supabase for Auth/Postgres, Cloudflare R2 for recipe images, and Vercel for the Vite PWA.

## Runtime model

- Supabase Auth provides email/password accounts and password reset.
- PostgreSQL stores products, recipes, recipe ingredients, and per-user meal plans.
- Cloudflare R2 stores recipe photo objects using the existing `recipes.image_path` key. `system/...` objects are served from the configured public R2 custom domain; `<user-id>/...` objects are private and returned through short-lived presigned GET URLs.
- Row Level Security exposes system records to authenticated users, restricts personal records to their owner, and grants product/recipe management to profiles with `role = 'admin'`.
- The browser contains only Auth session state, temporary image previews, and the API client. Supabase is the source of truth for application data; R2 is the source of truth for image bytes.
- Authenticated API routes include `GET /api/me`, the existing product/recipe/plan/shopping routes, and admin-only `DELETE /api/products/:id?permanent=true` and `DELETE /api/recipes/:id?permanent=true`. Default DELETE remains archive. Paginated recipe reads additionally accept admin-only `includeArchived`; upload URLs choose owner or `system/` R2 paths server-side.
- Every protected route requires `Authorization: Bearer <supabase-access-token>`. Runtime Functions never use the service-role key. Supabase RLS authorizes database rows, while the API validates the owner prefix before issuing or saving any private R2 object URL.
- API success responses are `{ data: ... }`; errors are `{ error: { code, message } }` with status `400`, `401`, `403`, `404`, `409`, `422`, or `500`.
- The PWA shell remains installable, but data-changing actions require an internet connection in this first server-backed version.

## System and personal data

System products and recipes have `owner_id = null`; ordinary users can read them but cannot modify or archive them. Admins can manage system records and all user-owned products and recipes while preserving each record's existing `owner_id`. User-created products and recipes remain private by default. A user's meal plan and derived shopping list remain private.

Permanent deletion is rejected when a product is referenced by recipe ingredients or a recipe is referenced by a meal-plan entry; archive is the safe fallback.

## First-time setup

1. Create a Supabase project.
2. Run `supabase/migrations/20260814000000_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Run `supabase/migrations/20260815000000_admin_roles.sql`.
4. Configure email/password sign-up and the site URL in Supabase Auth.
5. Run the seed command with Supabase and R2 credentials. It uploads the stable system image keys directly to R2:

```sh
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
R2_ACCOUNT_ID=... \
R2_ACCESS_KEY_ID=... \
R2_SECRET_ACCESS_KEY=... \
R2_BUCKET_NAME=meal-planner-images \
npm run seed:supabase
```

The service-role key is only for the one-time seed command. It must never be placed in `VITE_*` variables or committed. To promote the first admin, run `update public.profiles set role = 'admin' where id = 'USER_UUID_HERE';` from a trusted SQL session.

6. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Environment Variables.
7. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel Environment Variables for the Functions. Keep `SUPABASE_SERVICE_ROLE_KEY` only in the local seed/migration environment.
8. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_BASE_URL` in Vercel. Never expose the R2 access key or secret in `VITE_*` variables.
9. In the R2 bucket settings, configure CORS for the Vercel origin and local development origin with `PUT`, `GET`, and `HEAD` methods and the `Content-Type` request header. Direct browser uploads use the presigned R2 S3 URL and therefore require this CORS rule.
10. Deploy with build command `npm run build` and output directory `dist`.

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
