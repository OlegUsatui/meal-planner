import { describe, expect, it } from 'vitest'
import { mergeImportedIngredients } from './merge-imported-ingredients'

describe('mergeImportedIngredients', () => {
  it('merges only rows for the same product and keeps distinct products separate', () => {
    expect(mergeImportedIngredients([
      { product_id: 'sesame', quantity_base: 5, entered_quantity: 5, entered_unit: 'g' },
      { product_id: 'sesame', quantity_base: 3, entered_quantity: 3, entered_unit: 'g' },
      { product_id: 'sesame-oil', quantity_base: 10, entered_quantity: 10, entered_unit: 'ml' },
    ])).toEqual([
      { product_id: 'sesame', quantity_base: 8, entered_quantity: 8, entered_unit: 'g' },
      { product_id: 'sesame-oil', quantity_base: 10, entered_quantity: 10, entered_unit: 'ml' },
    ])
  })
})
