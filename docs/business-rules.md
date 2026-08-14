# Business rules

- Product input requires name, category, and base unit only. Names are normalized for duplicate detection.
- The bundled lunch collection is extracted only from `refs/Велика Книга Корисних Обідів.pdf`, one recipe page at a time. A complete import contains 137 recipes with photos, nutrition, preparation time, quantified ingredients, instructions, and lunch subcategories.
- The bundled breakfast and dinner collections come only from their PDFs under `refs/`: 200 unique breakfast recipes and 120 unique dinner recipes. Divider pages and duplicate source slides are excluded. They are appended atomically after complete validation and never remove existing recipes or plan entries. An existing-name collision aborts the whole additive import.
- Bundled recipe imports canonicalize product aliases before persistence. The first listed ingredient is used when the source offers alternatives; subsequent `або` alternatives, water, salt, non-quantified `за смаком` rows, and OCR layout fragments do not contribute to the shopping projection.
- The approved PDF reset validates the entire bundle before atomically replacing recipes and clearing their plan entries. Products are preserved and reused. Any validation or image-loading error aborts before old recipes are changed.
- Recipe ingredients use compatible metric units and positive quantities.
- Preparation time stores a minimum and maximum from 0 to 1440 minutes. Both values must be present together and the minimum cannot exceed the maximum.
- Meal plans have four slots, one recipe per date/slot, and 1–99 servings. Past dates cannot be added, replaced, or removed; replacements/removals require confirmation.
- The shopping list is recalculated on every read from products, recipes, and plan entries. It includes dates from today onward, scales quantities by servings, aggregates by product, and reports source recipes/dates.
- Archived recipes remain visible through existing plan entries but cannot be selected for new plan entries. Archived products remain readable by recipes.
