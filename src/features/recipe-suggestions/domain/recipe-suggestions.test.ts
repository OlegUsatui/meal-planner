import { describe, expect, it } from 'vitest'
import { hasIngredientMatch, normalizeProductIds } from './recipe-suggestions'

describe('recipe suggestion domain', () => {
  it('trims and deduplicates selected product ids', () => {
    expect(normalizeProductIds([' product-1 ', 'product-2', 'product-1'])).toEqual(['product-1', 'product-2'])
  })

  it('rejects an empty or malformed selection', () => {
    expect(() => normalizeProductIds([])).toThrow('product-ids-required')
    expect(() => normalizeProductIds(['product-1', '  '])).toThrow('invalid-product-id')
  })

  it('matches a recipe when at least one ingredient is selected', () => {
    expect(hasIngredientMatch(['product-1', 'product-2'], ['product-3', 'product-2'])).toBe(true)
    expect(hasIngredientMatch(['product-1'], ['product-3'])).toBe(false)
  })
})
