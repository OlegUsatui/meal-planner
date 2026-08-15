# Domain model

The app is server-backed. Supabase is the source of truth for products, recipes, images, and meal-plan entries; the shopping list is a read-only projection. Every personal record belongs to an authenticated account. System records have no owner and are read-only for ordinary users; admins may manage them while preserving system ownership.

## Product

`id`, `ownerId` (nullable for system products), `name`, `normalizedName`, `category`, `baseUnit` (`g`, `ml`, `pcs`), archive and timestamps. A product used by a recipe cannot change unit. Archived products remain readable in saved recipes and historical plans, but are unavailable for new recipe ingredients.

## Recipe

Recipes contain `ownerId` (nullable for system recipes), name, one-serving ingredient quantities, optional nutrition per serving, optional minimum/maximum preparation time in minutes, instructions, a Storage image path, archive/timestamps, ingredients, and multiple classifications. Equal time bounds represent an exact duration; different bounds are displayed as a range such as `20–25 хв`. A classification is a unique pair of meal type (`breakfast`, `lunch`, `dinner`, `snack`) and a fixed subcategory ID. System recipes are read-only; personal recipes are private and editable by their owner.

## MealPlanEntry

`date` (`YYYY-MM-DD`), `slot` (`breakfast`, `lunch`, `dinner`, `snack`), `recipeId`, `servings` (1–99), and timestamps. One entry is allowed per `(date, slot)`. Past dates are read-only. Archived recipe references remain visible in historical entries.

## Derived shopping item

For each future plan entry (`date >= today`), ingredient demand is `quantityBase × plannedServings`. Items with the same `productId` are aggregated. Each item exposes product name/category/unit, total base quantity, and source recipe/date/slot rows. No shopping records, checks, prices, package rounding, manual rows, or history are stored.
