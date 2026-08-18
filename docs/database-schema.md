# Database schema

Production uses Supabase PostgreSQL. The base schema and RLS policies are in `supabase/migrations/20260814000000_initial_schema.sql`; admin roles are added by `20260815000000_admin_roles.sql`; `20260815010000_ux_profiles_optional_images.sql` adds onboarding completion, nullable recipe images, and caller-only account deletion.

`profiles` references Supabase Auth users and stores `role` (`user` or `admin`). The `is_admin()` security-definer function is used by RLS; role changes are intentionally performed by a trusted database operator. `products` and `recipes` use nullable `owner_id`: null means shared system data, while a UUID means private user data. Admins can manage all products and recipes without changing their ownership. `recipe_ingredients` references recipes and products. `meal_plan_entries` is owned by a user and enforces one entry per `(owner_id, date_slot)`; admin access does not bypass this boundary. Recipe image metadata is stored on `recipes`; `image_path` is also the object key in Cloudflare R2. No database migration is needed for the R2 move.

The `20260818000000_propagate_product_base_unit` migration adds the authenticated `update_product_base_unit` security-definer function. It updates a product and all linked recipe ingredients in one transaction, preserving numeric quantities while replacing `entered_unit` and `quantity_base` with the new unit semantics.

After applying `20260815000000_admin_roles.sql`, promote the first administrator from a trusted SQL session:

```sql
update public.profiles set role = 'admin' where id = 'USER_UUID_HERE';
```

The idempotent `npm run seed:supabase` command reads the verified bundled JSON and WebP files, uploads system images, and upserts 457 system recipes with stable IDs. It does not touch user-owned records.

The legacy Dexie schema below remains for isolated tests and compatibility with old local backups; production repositories use Supabase.

Dexie schema version 6 stores `products`, `recipes`, `recipeIngredients`, `mealPlanEntries`, `imageAssets`, and `appSettings`.

`products` stores only identity/category/unit and archive/timestamps. `mealPlanEntries` stores `id`, `date`, `slot`, unique `dateSlot`, `recipeId`, `servings`, and timestamps. There are no inventory or shopping tables.

Migration v2 intentionally deletes `inventoryTransactions`, `shoppingLists`, `shoppingListItems`, and `planMutations`; removes obsolete product package/price fields; strips cooked/revision fields from meal plans; and keeps valid products, recipes, images, ingredients, and plan references. Migration v3 removes `baseServings` from recipes and adds nullable per-serving nutrition and preparation-time fields. Migration v4 adds recipe classifications and assigns an empty classification array to legacy recipes. The live shopping list is never written to IndexedDB.

Migration v5 replaces `preparationTimeMinutes` with nullable `preparationTimeMinMinutes` and `preparationTimeMaxMinutes`. Existing exact durations are copied into both bounds. Migration v6 makes `imageAssetId` nullable while preserving every existing image reference.

`appSettings.lunchPdfImportVersion` guards the approved one-time PDF catalogue reset. Before any write, the importer validates all 137 recipe records and loads all 137 images. Its transaction clears recipes, recipe ingredients, recipe-owned images, and meal-plan entries, while preserving the product catalogue and unrelated image assets. This data reset does not change table keys or indexes and therefore does not require a Dexie schema-version bump.

`appSettings.breakfastDinnerPdfImportVersion` guards the additive breakfast/dinner import. It validates 200 unique breakfasts, 120 unique dinners, all images, classifications, and name collisions before writing. The transaction appends recipes and missing canonical products without deleting existing recipes, images, or meal-plan entries. A collision with any existing recipe name aborts the import.

`appSettings.recipeTitleRepairVersion` guards the one-time `recipe-titles-v3` correction, which supersedes the earlier title pass after additional OCR aliases were verified. The repair reads verified titles and their unambiguous historical OCR aliases from the bundled breakfast/dinner datasets, then updates exact alias matches in one transaction. Recipe IDs and all dependent records remain unchanged; manual names that do not exactly match an alias are preserved. A corrected-name collision aborts the transaction.
