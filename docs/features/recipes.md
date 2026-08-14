# Recipes

## 1. Purpose and user value

Maintain reusable dishes that drive meal plans and the derived shopping list. A recipe contains name, photo, one-serving ingredient quantities, nutrition per serving, preparation time, preparation text, and one or more meal-type/subcategory classifications.

## 2. Routes and entry points

- Catalogue: `/recipes`.
- Create: `/recipes/new`.
- Detail: `/recipes/:recipeId`.
- Edit: `/recipes/:recipeId/edit`.
- Entry from primary navigation, planner picker, dashboard, and product usage context.

### Bundled lunch book import

`refs/Велика Книга Корисних Обідів.pdf` is the sole source for the bundled lunch collection. The page-by-page extraction produces 137 validated recipes and 137 dish photos under `public/imported-recipes/lunches-pdf`. Every generated recipe includes its source page, title, per-serving nutrition, preparation time, quantified ingredients, instructions, photo, and approved lunch subcategory.

The browser import is a one-time atomic reset identified by `lunchPdfImportVersion`. It validates the complete dataset and fetches every photo before opening the write transaction. Only then does it clear existing recipes, recipe ingredients, recipe-owned images, and meal-plan entries, and insert the PDF collection. The canonical product catalogue is preserved and reused; missing products are added and referenced archived products are restored. A failed validation or image fetch leaves existing data untouched. Alternatives after `або` and non-quantified salt/seasoning placeholders are excluded from calculated ingredients.

### Bundled breakfast and dinner import

The breakfast PDF contributes 200 unique recipes across the 11 approved breakfast subcategories; divider and duplicate source pages are excluded. The dinner PDF contributes 120 unique recipes across the 11 approved dinner subcategories; one exact duplicate source slide is excluded. Both generated bundles include page provenance, photos, per-serving nutrition, exact or ranged preparation time, ingredients, and instructions.

The additive import validates both complete books and every photo before one transaction appends them. Existing lunches, manual recipes, images, products, and meal-plan entries remain unchanged. Existing products are reused by normalized name and unit. Any duplicate source name or collision with an existing recipe name aborts the complete breakfast/dinner import without partial writes.

Generated breakfast and dinner records retain exact previous OCR titles only as import-repair aliases. The one-time `recipe-titles-v3` repair supersedes the earlier title pass and updates an existing record only when its complete normalized title matches one of those aliases. It changes the recipe name in place, preserving the recipe ID, image, ingredients, archive state, and meal-plan references. User-renamed recipes do not match an alias and remain untouched. Ambiguous aliases are excluded during extraction, and any target-name collision aborts the repair transaction.

## 3. User flows

### Create recipe

1. Enter a unique name, choose one or more categories, add optional nutrition per serving, preparation time, and preparation text.
2. Select an image and review its preview.
3. Add one or more active products with positive quantity and compatible unit.
4. Save the aggregate; image, recipe, and ingredients commit atomically.
5. Navigate to detail with success feedback.

### Browse and open

1. Search active recipes by case-insensitive name.
2. Open a food-first card.
3. Change the transient serving selector to view scaled ingredients.
4. Add to plan or edit.

### Edit and replace image

1. Open editor with original entered quantities/units.
2. Modify fields, ingredients, or photo.
3. Save atomically; future planned requirements and the live shopping list use current recipe data on their next read.

### Archive

1. Choose archive and review how many planned entries reference the recipe.
2. Confirm. Existing entries remain readable; new picker selection is disabled.

## 4. Desktop composition

- Catalogue header with search and primary “Новий рецепт”.
- 3–4 column photo card grid; optional archived toggle is secondary.
- Detail: large 4:3 image/summary column, ingredients and instructions column, actions in header.
- Editor: centered 760 px form; ingredient rows align product, quantity, unit, and remove action.

## 5. Mobile composition

- Full-width search and one/two-column card grid based on minimum width.
- Detail stacks image, title, serving selector, ingredients, instructions, then planning action.
- Editor is a full page. Each ingredient is a labelled mini-card, not a compressed row.
- Image picker supports camera/photo library through browser file input without requiring native APIs.

## 6. Actions and responses

| Action | Response |
| --- | --- |
| Search | Filter active recipes locally without losing query on back navigation |
| Select image | Validate/decode/compress, show local preview, then upload to the authenticated user's Storage path on save |
| Add ingredient | Append empty product/quantity/unit group |
| Select product | Restrict unit options to the product dimension |
| Change servings on detail | Recalculate display only |
| Save | Commit recipe aggregate and image transactionally |
| Add to plan | Open date/slot/servings planner flow |
| Archive | Confirm references, set archive timestamp |

## 7. State, models, and storage

- Owns `Recipe`, `RecipeIngredient`, and recipe `ImageAsset` lifecycle.
- Reads active `Product` records for ingredient selection.
- Reads plan entries when calculating archive impact.
- Form draft, object URL, and transient serving selection are UI-only.
- Search query may live in URL `?q=` for recoverable navigation.

## 8. Validation and business rules

- Name: trimmed, 1–160 characters.
- Photo: required, decodable image MIME type, compressed to a maximum 1600 px long side at 0.82 quality and rejected if its processed WebP exceeds 2 MB.
- Nutrition fields are optional non-negative numbers per serving.
- Preparation time is optional and uses whole-minute `from`/`to` bounds from 0 to 1440. Both bounds are required together; an exact duration repeats the same value.
- New and edited recipes require at least one valid classification. One recipe may belong to several meal types or subcategories; duplicate pairs are rejected.
- The taxonomy is fixed from the approved breakfast, lunch, and dinner references. `snack` initially contains the single `Перекуси` subcategory. Informational PDF sections are not recipe categories.
- Legacy recipes migrated with no classifications remain visible under `Без категорії` and in every meal picker until edited.
- Instructions: trimmed, 1–10,000 characters.
- At least one ingredient.
- Product cannot repeat; quantity must be positive and unit compatible.
- An archived product cannot be newly selected but remains visible in an existing recipe until replaced.
- Save is all-or-nothing. Replaced images are not removed until the new aggregate commits.
- v1 has no difficulty, tags, categories, steps, URL import, or AI generation.

## 9. UI states

- **Empty catalogue:** food-forward explanation and “Створити перший рецепт”.
- **No search results:** preserve query and offer clear-search action.
- **No products:** creation form explains dependency and links to product creation while preserving draft/return context where supported.
- **Loading:** card/detail/form skeletons.
- **Image processing:** preview placeholder with progress; form fields remain available.
- **Quota/storage error:** preserve draft and current preview, explain upload failure, retry or choose a smaller image.
- **Missing image integrity error:** neutral placeholder and non-destructive repair prompt.
- **Archive confirmation:** names planned references and historical behavior.

## 10. Accessibility and keyboard

- Search has visible label or accessible name and clear button.
- Recipe card link name is recipe title; decorative thumbnail avoids duplicate announcement.
- Image input has instructions, accepted formats, preview alt, and error association.
- Ingredient groups use fieldsets/legends or equivalent semantic grouping; remove names the product/row.
- Serving selector announces updated quantities in a restrained polite live region.

## 11. Tricky cases

- Browser image decoding or quota failure must not orphan a Blob.
- Replacing the same image must not revoke preview before save/cancel completes.
- Recipe edits immediately change derived demand for future planned dates on the next shopping-list read.
- Current recipe edits also change unconsumed historical/future plan display; immutable versions are explicitly outside v1.
- Bundled title corrections never replace a user-entered title unless it exactly matches a recorded OCR alias.
- Archiving a recipe does not remove it from existing slots.
- Object URLs must be revoked to prevent memory leaks.

## 12. Acceptance criteria

- A valid recipe with image and ingredients persists atomically and survives reload offline.
- Invalid or incompatible ingredient rows identify the exact field and block save.
- Serving selector scales all ingredient quantities without editing stored recipe values.
- Recipe edits affect the live future shopping projection without creating or rewriting snapshots.
- Archived recipes remain historically readable and disappear from new-plan selection.
- No out-of-scope metadata fields appear.

## 13. Tests

- Unit: recipe validation, duplicate products, serving scaling, compatible units.
- Component: catalogue states, image preview/error, dynamic ingredient groups, detail scaling, archive confirmation.
- Repository: transactional aggregate save, image replacement cleanup, rollback, affected-date mutation recording.
- E2E: create a product-backed recipe with a photo, plan it, edit an ingredient, and observe the live shopping-list update.
- Accessibility: form grouping, image errors, focus after dynamic add/remove.

## 14. Dependencies

- [Products](products.md)
- [Meal planner](meal-planner.md)
- [Domain model: Recipe](../domain-model.md#recipe)
- [Business rules: serving scaling](../business-rules.md#serving-scaling)
- [Design system: photography](../design-system.md#photography)

Recipe data is loaded through the authenticated `/api/recipes` repository client. System recipe images use stable public Cloudflare R2 URLs; personal recipe images use private presigned R2 URLs. Creating or editing a photo requests `/api/recipes/upload-url`, uploads directly to R2 with `PUT`, and then saves metadata through the recipe endpoint. The browser Supabase client is not used for recipe data.
