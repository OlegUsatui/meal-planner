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
          { date: '2026-08-14', slot: 'dinner', recipeId: 'recipe-a', recipeName: 'Суп', servings: 4, quantityBase: 400 },
          { date: '2026-08-15', slot: 'lunch', recipeId: 'recipe-b', recipeName: 'Паста', servings: 2, quantityBase: 300 },
        ],
      },
    ])
  })

  it('returns an empty list when no future meals exist', () => {
    expect(buildShoppingList([], [], [], '2026-08-14')).toEqual([])
  })

  it('removes passed meals from today while keeping future meals and snacks', () => {
    const entries = [
      { id: 'breakfast', date: '2026-08-14', slot: 'breakfast' as const, recipeId: 'recipe-a', servings: 1 },
      { id: 'lunch', date: '2026-08-14', slot: 'lunch' as const, recipeId: 'recipe-a', servings: 1 },
      { id: 'dinner', date: '2026-08-14', slot: 'dinner' as const, recipeId: 'recipe-a', servings: 1 },
      { id: 'snack', date: '2026-08-14', slot: 'snack' as const, recipeId: 'recipe-a', servings: 1 },
      { id: 'tomorrow', date: '2026-08-15', slot: 'breakfast' as const, recipeId: 'recipe-a', servings: 1 },
    ]
    const recipes = [{ id: 'recipe-a', name: 'Страва', ingredients: [{ productId: 'pasta', quantityBase: 100 }] }]
    const products = [{ id: 'pasta', name: 'Паста', category: 'Бакалія', baseUnit: 'g' as const }]

    expect(buildShoppingList(entries, recipes, products, '2026-08-14', new Date('2026-08-14T13:00:00'))[0]?.quantityBase).toBe(300)
    expect(buildShoppingList(entries, recipes, products, '2026-08-14', new Date('2026-08-14T18:00:00'))[0]?.quantityBase).toBe(200)
  })
})
