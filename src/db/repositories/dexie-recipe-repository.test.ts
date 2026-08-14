import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from '../database'
import { DexieRecipeRepository } from './dexie-recipe-repository'

describe('DexieRecipeRepository', () => {
  let database: MealPlannerDatabase
  let repository: DexieRecipeRepository

  beforeEach(async () => {
    database = new MealPlannerDatabase(`recipe-test-${crypto.randomUUID()}`)
    await database.products.add({ id: 'rice', name: 'Рис', normalizedName: 'рис', category: 'Крупи', baseUnit: 'g', archivedAt: null, createdAt: '2026-08-11T00:00:00.000Z', updatedAt: '2026-08-11T00:00:00.000Z' })
    repository = new DexieRecipeRepository(database, { now: () => '2026-08-11T00:00:00.000Z', id: (() => { let n = 0; return () => `id-${++n}` })() })
  })

  afterEach(async () => { database.close(); await database.delete() })

  it('saves a recipe, image, and normalized ingredient atomically', async () => {
    const recipe = await repository.create({
      name: 'Рисова миска', instructions: 'Зварити рис.', caloriesPerServing: 400, proteinGramsPerServing: 10, fatGramsPerServing: 5, carbsGramsPerServing: 70, preparationTimeMinMinutes: 30, preparationTimeMaxMinutes: 30,
      classifications: [{ mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }],
      image: { blob: new Blob(['image'], { type: 'image/webp' }), mimeType: 'image/webp', width: 1200, height: 800, byteSize: 5 },
      ingredients: [{ productId: 'rice', enteredQuantity: 0.2, enteredUnit: 'kg' }],
    })

    expect(recipe).toMatchObject({ id: 'id-1', name: 'Рисова миска', classifications: [{ mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }], image: { mimeType: 'image/webp' }, ingredients: [expect.objectContaining({ productId: 'rice', quantityBase: 200, productName: 'Рис' })] })
    expect(await database.recipes.count()).toBe(1)
    expect(await database.imageAssets.count()).toBe(1)
    expect(await database.recipeIngredients.count()).toBe(1)
  })
})
