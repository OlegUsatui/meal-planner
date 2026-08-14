import { describe, expect, it } from 'vitest'
import { buildShoppingList } from './shopping-list'

describe('derived shopping list', () => {
  it('aggregates future planned recipe demand and ignores past dates', () => {
    const list = buildShoppingList(
      [
        { id: 'entry-past', date: '2026-08-13', slot: 'dinner', recipeId: 'recipe-a', servings: 2 },
        { id: 'entry-a', date: '2026-08-14', slot: 'dinner', recipeId: 'recipe-a', servings: 4 },
        { id: 'entry-b', date: '2026-08-15', slot: 'lunch', recipeId: 'recipe-b', servings: 2 },
      ],
      [
        { id: 'recipe-a', name: 'Суп', ingredients: [{ productId: 'pasta', quantityBase: 100 }] },
        { id: 'recipe-b', name: 'Паста', ingredients: [{ productId: 'pasta', quantityBase: 150 }] },
      ],
      [{ id: 'pasta', name: 'Паста', category: 'Бакалія', baseUnit: 'g' }],
      '2026-08-14',
    )

    expect(list).toEqual([
      {
        productId: 'pasta',
        productName: 'Паста',
        category: 'Бакалія',
        baseUnit: 'g',
        quantityBase: 700,
        sources: [
          { date: '2026-08-14', slot: 'dinner', recipeId: 'recipe-a', recipeName: 'Суп', quantityBase: 400 },
          { date: '2026-08-15', slot: 'lunch', recipeId: 'recipe-b', recipeName: 'Паста', quantityBase: 300 },
        ],
      },
    ])
  })

  it('returns an empty list when no future meals exist', () => {
    expect(buildShoppingList([], [], [], '2026-08-14')).toEqual([])
  })
})
