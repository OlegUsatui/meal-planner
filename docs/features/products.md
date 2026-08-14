# Products

## Purpose
Maintain the reusable product catalogue used by recipe ingredients.

## Route and UI
`/products` lists name, category, unit, recipe usage, and actions. `/products/new` and `/products/:id` edit name, category, and base unit. Archived products stay visible when requested and remain readable by existing recipes.

## Import and storage
The bundled catalogue import keeps only name, category, and unit. System product records are stored in Supabase `products` with a null owner; personal products are scoped to the authenticated user. No stock, package, price, purchase, or transaction fields exist.

Bundled PDF imports map OCR variants and measurement fragments from all three recipe books to a controlled Ukrainian catalogue. Existing products are reused by normalized name and base unit, and only genuinely missing canonical products are created. Recipe imports never clear user-created products. Alternative ingredients after `або`, water, salt, non-quantified seasonings, and source-layout fragments are ignored.

## Acceptance
Duplicate active names are rejected, referenced units are locked, archive is non-destructive, and desktop/mobile list and form states expose loading, empty, error, and validation feedback. After the PDF import, OCR fragments, quantity annotations, and alternative ingredients do not appear as catalogue rows.
