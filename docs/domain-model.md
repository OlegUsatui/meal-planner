# Domain model

Supabase is the production source of truth. Personal records belong to one authenticated account; system products/recipes use a null owner and remain read-only to ordinary users.

## Profile

`id`, role, and nullable legacy `onboardingCompletedAt`. The field remains exposed by `GET/PATCH /api/me` for compatibility but does not gate navigation.

## Product

`id`, nullable `ownerId`, normalized name, controlled category, base unit (`g`, `ml`, `pcs`), archive and timestamps. Referenced units are locked. Archived products remain readable but unavailable to new ingredients. Ambiguous legacy categories are retained until manual edit.

## Recipe

`id`, nullable `ownerId`, name, instructions, nullable image metadata, optional nutrition/time, classifications, archive/timestamps, and one-serving ingredients. Personal images may be absent, replaced, or removed. A classification is a unique meal-type/subcategory pair.

`RecipeSummary` is the catalogue/planner projection: ID, name, classifications, preparation-time bounds, archive state, image metadata, owner ID, and system flag. It intentionally contains no instructions, nutrition, ingredients, or timestamps. A full `Recipe` is fetched only for detail or editing.

## MealPlanEntry

Local date (`YYYY-MM-DD`), slot, recipe ID, servings 1–99, and timestamps. `(owner,date,slot)` is unique. Past dates are read-only and archived recipe references remain readable.

## DashboardSummary

Today entries, next entry, seven-day distinct shopping count, personal-content flags, and whether the account has any plan entry.

## Shopping projection

For each entry in inclusive `{from,to?}`, demand equals one-serving ingredient quantity times planned servings. Rows aggregate by product and retain date, slot, recipe, servings, and contribution sources. No shopping state is persisted.

## AccountExportManifestV1

Versioned personal profile/content/plan data, referenced system IDs/names, and short-lived personal-image URLs. System records are not duplicated.
