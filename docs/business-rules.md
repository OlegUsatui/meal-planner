# Business rules

- New products require a normalized unique name, controlled taxonomy category, and base unit. Legacy category values stay deprecated until manually edited.
- Changing a product base unit keeps every linked ingredient's numeric value, replaces its displayed unit with the new base unit, and updates normalized shopping quantities atomically after explicit confirmation.
- Recipe ingredients require active products, positive compatible metric quantities, and no duplicate product IDs.
- Personal recipe photos are optional. Removing one nulls all metadata; an existing photo is preserved unless explicitly replaced/removed.
- Nutrition is optional and non-negative. Exact preparation time uses equal bounds; range bounds are 0–1440 minutes and minimum cannot exceed maximum.
- Recipes require name, instructions, at least one ingredient, and at least one valid classification. Archived products cannot be newly selected.
- A plan has four slots and one recipe per local date/slot. Past entries cannot be added, replaced, or removed.
- Meal-plan reads are inclusive `from/to`; planner UI requests only the visible week.
- Shopping is recalculated for inclusive `{from,to?}` from one serving of each planned recipe, aggregates by product, and remains read-only. Temporary source serving adjustments are UI-only.
- Account export contains personal records/images plus system references. Account deletion requires recent reauthentication and the exact phrase `ВИДАЛИТИ АКАУНТ`; it never deletes system records.
- Administrators may manage shared catalog records, but cannot access another account’s plan or shopping projection.
