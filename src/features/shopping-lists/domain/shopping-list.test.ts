import { describe, expect, it } from 'vitest'
import { buildShoppingList, applyShoppingServingOverrides } from './shopping-list'

describe('derived shopping list', () => {
  it('aggregates future planned recipe demand and ignores past dates', () => {
    const list = buildShoppingList(
      [
        { id: 'entry-past', date: '2026-08-13', slot: 'dinner', recipeId: 'recipe-a' },
        { id: 'entry-a', date: '2026-08-14', slot: 'dinner', recipeId: 'recipe-a' },
        { id: 'entry-b', date: '2026-08-15', slot: 'lunch', recipeId: 'recipe-b' },
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
        quantityBase: 250,
        sources: [
          { date: '2026-08-14', slot: 'dinner', recipeId: 'recipe-a', recipeName: 'Суп', servings: 1, quantityBase: 100 },
          { date: '2026-08-15', slot: 'lunch', recipeId: 'recipe-b', recipeName: 'Паста', servings: 1, quantityBase: 150 },
        ],
      },
    ])
  })

  it('returns an empty list when no future meals exist', () => {
    expect(buildShoppingList([], [], [], '2026-08-14')).toEqual([])
  })

  it('removes passed meals from today while keeping future meals and snacks', () => {
    const entries = [
      { id: 'breakfast', date: '2026-08-14', slot: 'breakfast' as const, recipeId: 'recipe-a' },
      { id: 'lunch', date: '2026-08-14', slot: 'lunch' as const, recipeId: 'recipe-a' },
      { id: 'dinner', date: '2026-08-14', slot: 'dinner' as const, recipeId: 'recipe-a' },
      { id: 'snack', date: '2026-08-14', slot: 'snack' as const, recipeId: 'recipe-a' },
      { id: 'tomorrow', date: '2026-08-15', slot: 'breakfast' as const, recipeId: 'recipe-a' },
    ]
    const recipes = [{ id: 'recipe-a', name: 'Страва', ingredients: [{ productId: 'pasta', quantityBase: 100 }] }]
    const products = [{ id: 'pasta', name: 'Паста', category: 'Бакалія', baseUnit: 'g' as const }]

    expect(buildShoppingList(entries, recipes, products, '2026-08-14', new Date('2026-08-14T13:00:00'))[0]?.quantityBase).toBe(300)
    expect(buildShoppingList(entries, recipes, products, '2026-08-14', new Date('2026-08-14T18:00:00'))[0]?.quantityBase).toBe(200)
  })

  it('recalculates shopping quantities locally without changing the original sources', () => {
    const list = buildShoppingList(
      [{ id: 'entry-a', date: '2026-08-14', slot: 'dinner', recipeId: 'recipe-a' }],
      [{ id: 'recipe-a', name: 'Суп', ingredients: [{ productId: 'pasta', quantityBase: 100 }] }],
      [{ id: 'pasta', name: 'Паста', category: 'Бакалія', baseUnit: 'g' }],
      '2026-08-14',
    )

    const adjusted = applyShoppingServingOverrides(list, { '2026-08-14:dinner:recipe-a': 4 })
    expect(adjusted[0]?.quantityBase).toBe(400)
    expect(adjusted[0]?.sources[0]).toEqual(expect.objectContaining({ quantityBase: 400 }))
    expect(list[0]?.quantityBase).toBe(100)
    expect(list[0]?.sources[0]?.servings).toBe(1)
  })
})
