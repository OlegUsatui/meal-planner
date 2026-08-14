import { describe, expect, it } from 'vitest'
import dataset from '../../../public/imported-recipes/lunches-pdf/lunches.json'
import { isIgnoredImportedIngredient, normalizeImportedIngredient } from '../../features/products/import/normalize-imported-product'

describe('bundled lunch PDF dataset', () => {
  it('contains every validated PDF recipe and only canonicalizable ingredients', () => {
    expect(dataset).toHaveLength(137)
    const unknown = dataset.flatMap((recipe) => recipe.ingredients
      .filter((ingredient) => !isIgnoredImportedIngredient(ingredient.name) && !normalizeImportedIngredient(
        ingredient.name,
        ingredient.enteredQuantity,
        ingredient.enteredUnit as 'g' | 'kg' | 'ml' | 'l' | 'pcs',
      ))
      .map((ingredient) => `p.${recipe.sourcePage}: ${ingredient.name}`))
    expect(unknown).toEqual([])
    expect(dataset.every((recipe) => recipe.ingredients.filter((ingredient) => normalizeImportedIngredient(
      ingredient.name,
      ingredient.enteredQuantity,
      ingredient.enteredUnit as 'g' | 'kg' | 'ml' | 'l' | 'pcs',
    )).length >= 3)).toBe(true)
  })
})
