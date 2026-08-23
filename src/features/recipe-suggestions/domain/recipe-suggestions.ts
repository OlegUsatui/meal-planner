export function normalizeProductIds(productIds: readonly string[]): string[] {
  if (!productIds.length) throw new Error('product-ids-required')
  if (productIds.some((productId) => !productId.trim())) throw new Error('invalid-product-id')
  return [...new Set(productIds.map((productId) => productId.trim()))]
}

export function hasIngredientMatch(selectedProductIds: readonly string[], ingredientProductIds: readonly string[]): boolean {
  const selected = new Set(selectedProductIds)
  return ingredientProductIds.some((productId) => selected.has(productId))
}
