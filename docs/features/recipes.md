# Recipes

## 1. Purpose and user value

Maintain reusable dishes that drive meal plans and the derived shopping list. A recipe contains name, optional photo, one-serving ingredient quantities, optional nutrition/time, preparation text, and one or more meal-type/subcategory classifications.

## 2. Routes and entry points

- Catalogue: `/recipes`.
- Create: `/recipes/new`.
- Detail: `/recipes/:recipeId`.
- Entry from primary navigation, planner selection flow, dashboard, and product usage context.

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
2. Optionally select an image file or paste a screenshot with Ctrl+V/Command+V, compose its final 4:3 frame, and review, replace, or remove it.
3. Add one or more active products with positive quantity and compatible unit.
4. Save the aggregate; image, recipe, and ingredients commit atomically.
5. Navigate to detail with success feedback.

### Browse and open

1. Search active recipes by case-insensitive name; search and category filters are sent to the API.
2. Browse 24 recipes per server-paginated page with numbered pagination, previous/next controls, and a visible result range. Search, category filters, and the current page are preserved in the URL.
3. Open a food-first card.
4. When the recipe was opened from the planner, view ingredient quantities scaled to the `planServings` context.
5. Add to plan from the top bar or edit an individual content area.

When opened from the planner with `planDate`, `planSlot`, `planServings`, and `planMode` URL parameters, the catalogue becomes a plan-selection flow. The recipe detail page preserves that context and exposes an add/replace action that returns to the selected plan date after saving.

### Edit and replace image

1. Open the recipe detail and choose the single “Редагувати рецепт” action in the top bar.
2. The poster is replaced in place by one prefilled full-page form containing name, categories, ingredients, nutrition, time, photo, and instructions. No block-level edit actions are exposed in the read view.
3. Choose photo editing from the form. A modal shows the complete source image with the area outside the crop dimmed. Its 4:3 selection can be moved, resized from any corner, or adjusted with proportional zoom; a live preview shows the exact final composition. Reset, apply, cancel, replace, and remove remain local until the complete form is saved.
4. Save the complete aggregate atomically or cancel to return to the unchanged poster. Future planned requirements and the live shopping list use current recipe data on their next read.

### Archive

1. Choose archive and review how many planned entries reference the recipe.
2. Confirm. Existing entries remain readable; new picker selection is disabled.

## 4. Desktop composition

- Catalogue header with search and primary “Новий рецепт”. Category filter buttons wrap onto additional rows without horizontal scrolling when the available width is limited.
- 3–4 column photo card grid; optional archived toggle is secondary.
- Detail read view is one borderless editorial poster rather than a collection of cards. The detail route has no shared page maximum width: its top bar and poster fill the complete main-content width after the sidebar with only a responsive 24–44 px gutter. The poster also fills the remaining viewport height below the top bar; short recipes keep any spare space inside the white editorial canvas, while long content grows the page and scrolls without clipping. From 768 px it closely follows the reference recipe sheet: the first title word is uppercase in a terracotta-to-orange accent, the remaining uppercase title is black, a single outlined nutrition strip capped at 680 px and plain checked ingredient list sit on the left, a large borderless 4:3 image sits on the right with equal inner spacing, preparation time uses a circular accent, and the preparation text spans balanced columns below. Category badges, content eyebrows, product count, estimate copy, per-serving heading, and the serving stepper are not rendered. One visible “Редагувати рецепт” button and the separate overflow menu sit in the top bar; there are no edit controls over the poster or photo. The planner CTA disappears while the full-page editor is active.
- Create: centered 760 px form; ingredient rows align product, quantity, unit, and remove action through the shared `RecipeIngredientRow` component.

## 5. Mobile composition

- Full-width search and one/two-column card grid based on minimum width.
- Detail keeps the same poster language but stacks title, time, photo, nutrition strip, ingredients, and instructions in one column. Instructions remain a single readable column and use the available width instead of being forced into a second column. Nutrition values remain on one line; below the wide desktop breakpoint the strip uses a 2×2 grid, then switches to one column on narrow mobile screens to preserve the complete labels. The poster is at least as tall as the viewport area above the fixed bottom navigation, and longer content scrolls normally. The single edit action and plan-context action stay in the top bar.
- The full-page editor remains readable on mobile. Each ingredient is a labelled mini-card, not a compressed row; create and detail editors reuse the same ingredient row and shared form-field semantics.
- Photo editing opens as a touch-friendly full-height modal on mobile. The source, crop frame, live preview, zoom, and apply action remain reachable without precise pointer input.
- Image picker supports camera/photo library through browser file input without requiring native APIs.

## 6. Actions and responses

| Action | Response |
| --- | --- |
| Search and categories | Query the server with pagination filters without losing the current query on back navigation |
| Select or paste image | File selection or an image pasted with Ctrl+V/Command+V opens the local 4:3 crop editor; apply validates, decodes, crops, and compresses the result before uploading to the authenticated user's Storage path when the complete recipe form is saved |
| Add ingredient | Append empty product/quantity/unit group |
| Select product | Restrict unit options to the product dimension |
| Edit recipe | Replace the poster with one prefilled aggregate form; a single save commits all changed recipe fields and returns to the poster |
| Add to plan | Open date/slot/servings planner flow |
| Archive | Confirm references, set archive timestamp |

## 7. State, models, and storage

- Owns `Recipe`, `RecipeIngredient`, and recipe `ImageAsset` lifecycle.
- Reads active `Product` records for ingredient selection.
- Reads plan entries when calculating archive impact.
- The aggregate edit draft, photo modal state, and object URLs are UI-only until the complete form is saved. In planner context, ingredient display and the plan mutation use the immutable `planServings` URL value; the recipe detail does not expose a separate serving control.
- Search query, meal section, subcategory, current page, and planner selection context live in URL parameters. Planner context uses `planDate`, `planSlot`, `planServings`, and `planMode` for recoverable navigation and direct links.

## 8. Validation and business rules

- Name: trimmed, 1–160 characters.
- Photo: optional for personal recipes. When supplied it is cropped to a 4:3 frame, must be decodable, compressed to WebP with a maximum 1600 px long side, and no larger than 2 MB. Catalogue, detail, picker, day-plan, and week-plan surfaces render that same 4:3 composition without applying a second crop. Missing images use the branded placeholder; legacy non-4:3 files are centered inside the 4:3 media frame until they are re-edited.
- Nutrition fields are optional non-negative numbers per serving.
- Preparation time is optional. Exact time uses one field; an explicit range switch reveals the second bound. Values are whole minutes from 0 to 1440.
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
- **Image editor:** the full source stays visible behind a dimmed overlay. The locked 4:3 frame supports pointer/touch movement, corner resizing, zoom, reset, live final preview, apply, and cancel. Pasting a new screenshot while the modal is open replaces only the local editor source and resets its crop; failed processing keeps the editor open and the draft intact.
- **Full-page edit:** one prefilled form exposes save/cancel actions; failed persistence keeps the complete draft and exposes an inline error.
- **Quota/storage error:** preserve draft and current preview, explain upload failure, retry or choose a smaller image.
- **Missing image integrity error:** neutral placeholder and non-destructive repair prompt.
- **Catalogue request error:** keep the page visible with a retry action rather than showing an empty catalogue.
- **Detail request error:** show a retry action instead of leaving the recipe detail in a permanent loading state.
- **Archive confirmation:** names planned references and historical behavior.

## 10. Accessibility and keyboard

- Search has visible label or accessible name and clear button.
- Recipe card link name is recipe title; decorative thumbnail avoids duplicate announcement.
- Image input has instructions, accepted formats, preview alt, error association, and a visible Ctrl+V/Command+V hint. Non-image clipboard content is ignored so normal text paste is not intercepted.
- Image editor exposes labelled zoom controls, keyboard-operable shared buttons, arrow-key movement for the selected frame, a labelled 4:3 crop region, a live final preview, and a cancel action that preserves the existing image. Recipe photo and archive flows use the shared dialog focus and Escape behavior.
- Ingredient groups use fieldsets/legends or equivalent semantic grouping; remove names the product/row.
- The single edit button has a visible label; the editor retains semantic fieldsets, labels, error descriptions, keyboard order, and focus-to-first-error behavior.

## 11. Tricky cases

- Browser image decoding or quota failure must not orphan a Blob.
- Replacing the same image must not revoke preview before save/cancel completes.
- Recipe edits immediately change derived demand for future planned dates on the next shopping-list read.
- Current recipe edits also change unconsumed historical/future plan display; immutable versions are explicitly outside v1.
- Only one aggregate editor can be active; cancelling discards its unsaved draft and restores the unchanged poster.
- Bundled title corrections never replace a user-entered title unless it exactly matches a recorded OCR alias.
- Archiving a recipe does not remove it from existing slots.
- Object URLs must be revoked to prevent memory leaks.

## 12. Acceptance criteria

- A valid personal recipe with ingredients persists atomically with or without a photo; a missing photo renders the branded placeholder.
- Invalid or incompatible ingredient rows identify the exact field and block save.
- Planner-context ingredient quantities are scaled from `planServings` without editing stored recipe values.
- Recipe edits affect the live future shopping projection without creating or rewriting snapshots.
- A manageable recipe exposes exactly one edit button. It opens a prefilled aggregate form without changing the route; one save persists all changes and cancel restores the read-only poster.
- Photo changes use a separate accessible modal inside the aggregate editor and do not persist until the complete form is saved.
- Pasting the first image from the clipboard opens the same crop editor during both recipe creation and detail editing; cancel leaves the previously staged or saved image unchanged.
- Every recipe image surface uses the same 4:3 composition; changing viewport or card type does not introduce a different crop. Legacy non-4:3 source assets fill the canonical frame with a centered cover fit, while new uploads are normalized to 4:3 in the photo editor.
- `/recipes/:recipeId/edit` is not a supported route; `/recipes/new` remains the create flow.
- Archived recipes remain historically readable and disappear from new-plan selection.
- Catalogue requests return at most 24 recipes and expose total/next-page metadata; server filters match the visible category/search state. Pagination exposes numbered pages, a result range, accessible current/disabled states, and normalizes a page beyond the available range.
- A failed detail request is recoverable through an explicit retry action.
- No out-of-scope metadata fields appear.

## 13. Tests

- Unit: recipe validation, duplicate products, serving scaling, compatible units.
- Component: catalogue states, image preview/editor/error, dynamic ingredient groups, detail scaling, single aggregate detail editor, photo modal, archive confirmation.
- Repository: transactional aggregate save, image replacement cleanup, rollback, affected-date mutation recording.
- E2E: create a product-backed recipe without a photo, plan it, edit an ingredient, and observe the live shopping-list update.
- Accessibility: form grouping, image errors, focus after dynamic add/remove.

## 14. Dependencies

- [Products](products.md)
- [Meal planner](meal-planner.md)
- [Domain model: Recipe](../domain-model.md#recipe)
- [Business rules: serving scaling](../business-rules.md#serving-scaling)
- [Design system: photography](../design-system.md#photography)

Recipe data is loaded through the authenticated `/api/recipes` repository client. Catalogue reads use `page`, `pageSize`, `query`, `mealType`, `subcategoryId`, `uncategorized`, `systemOnly`, and admin-only `includeArchived` query parameters and return lightweight `RecipeSummary` items in `{ items, page, pageSize, total, hasNext }`. Summary payloads contain no instructions, nutrition, or ingredients. Detail uses `/api/recipes/:id` and returns the complete aggregate. Catalogue/detail reads use the authenticated session memory cache for five minutes, cancel superseded searches, and show a loading state for a newly selected tab instead of displaying recipes from another filter; current-tab data remains visible during a background refresh failure. Recipe writes invalidate catalogue, matching detail, dashboard, and shopping queries. Administrators can edit/archive any recipe, including system recipes, and can request permanent deletion; permanent deletion is blocked when a meal-plan entry references the recipe. The full-page editor submits one aggregate recipe update contract. System image updates use server-selected `system/...` R2 paths; personal images use private presigned R2 URLs. Creating or editing a photo requests `/api/recipes/upload-url`, uploads directly to R2 with `PUT`, and then saves metadata through the recipe endpoint. The browser Supabase client is not used for recipe data.
