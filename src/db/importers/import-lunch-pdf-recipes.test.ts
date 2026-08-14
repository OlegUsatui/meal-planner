import { afterEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from '../database'
import { importLunchPdfRecipes } from './import-lunch-pdf-recipes'

const now = '2026-08-14T00:00:00.000Z'

function recipePayload() {
  return [{
    sourcePage: 13,
    name: 'Курка-гриль з кіноа',
    instructions: 'Відваріть кіноа. Обсмажте курку. Подайте разом.',
    caloriesPerServing: 619,
    proteinGramsPerServing: 56,
    fatGramsPerServing: 25,
    carbsGramsPerServing: 47,
    preparationTimeMinutes: 30,
    subcategoryId: 'lunch-chicken-turkey',
    image: '/imported-recipes/lunches-pdf/images/page-013.webp',
    imageWidth: 1200,
    imageHeight: 1200,
    ingredients: [
      { name: 'Куряче філе', enteredQuantity: 180, enteredUnit: 'g' },
      { name: 'Кіноа', enteredQuantity: 40, enteredUnit: 'g' },
    ],
  }]
}

describe('PDF lunch recipe import', () => {
  let database: MealPlannerDatabase | undefined

  afterEach(async () => {
    database?.close()
    await database?.delete()
  })

  it('replaces test recipes and plans atomically while preserving and reusing products', async () => {
    database = new MealPlannerDatabase(`lunch-pdf-import-${crypto.randomUUID()}`)
    await database.products.bulkAdd([
      { id: 'chicken', name: 'Куряче філе', normalizedName: 'куряче філе', category: 'М’ясо та птиця', baseUnit: 'g', archivedAt: null, createdAt: now, updatedAt: now },
      { id: 'manual', name: 'Яблуко', normalizedName: 'яблуко', category: 'Фрукти', baseUnit: 'g', archivedAt: null, createdAt: now, updatedAt: now },
    ])
    await database.imageAssets.add({ id: 'old-image', blob: new Blob(['old']), mimeType: 'image/jpeg', width: 10, height: 10, byteSize: 3, createdAt: now })
    await database.recipes.add({ id: 'old-recipe', name: 'Тест', normalizedName: 'тест', imageAssetId: 'old-image', instructions: 'Тест', caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, classifications: [], archivedAt: null, createdAt: now, updatedAt: now })
    await database.recipeIngredients.add({ id: 'old-ingredient', recipeId: 'old-recipe', productId: 'chicken', quantityBase: 1, enteredQuantity: 1, enteredUnit: 'g' })
    await database.mealPlanEntries.add({ id: 'old-plan', date: '2026-08-15', slot: 'lunch', dateSlot: '2026-08-15:lunch', recipeId: 'old-recipe', servings: 1, createdAt: now, updatedAt: now })

    const fetcher = async (input: RequestInfo | URL) => String(input).endsWith('.json')
      ? new Response(JSON.stringify(recipePayload()), { status: 200, headers: { 'Content-Type': 'application/json' } })
      : new Response(new TextEncoder().encode('new-image'), { status: 200, headers: { 'Content-Type': 'image/webp' } })

    await expect(importLunchPdfRecipes(database!, fetcher as typeof fetch, { now: () => now, id: sequentialIds(), expectedRecipeCount: 1 })).resolves.toEqual({ imported: 1, productsCreated: 1 })

    expect(await database.mealPlanEntries.count()).toBe(0)
    expect(await database.recipes.toArray()).toEqual([
      expect.objectContaining({ name: 'Курка-гриль з кіноа', imageAssetId: 'id-1', preparationTimeMinMinutes: 30, preparationTimeMaxMinutes: 30 }),
    ])
    expect(await database.imageAssets.toArray()).toEqual([
      expect.objectContaining({ id: 'id-1', mimeType: 'image/webp', width: 1200, height: 1200 }),
    ])
    expect(await database.recipeIngredients.toArray()).toEqual(expect.arrayContaining([
      expect.objectContaining({ recipeId: 'id-2', productId: 'chicken', quantityBase: 180 }),
      expect.objectContaining({ recipeId: 'id-2', quantityBase: 40 }),
    ]))
    expect(await database.products.get('manual')).toBeDefined()
    expect(await database.products.count()).toBe(3)
    expect((await database.appSettings.get('app'))?.lunchPdfImportVersion).toBe('lunch-pdf-v1')
  })

  it('keeps existing data when the bundled dataset is invalid', async () => {
    database = new MealPlannerDatabase(`lunch-pdf-invalid-${crypto.randomUUID()}`)
    await database.imageAssets.add({ id: 'old-image', blob: new Blob(['old']), mimeType: 'image/jpeg', width: 10, height: 10, byteSize: 3, createdAt: now })
    await database.recipes.add({ id: 'old-recipe', name: 'Тест', normalizedName: 'тест', imageAssetId: 'old-image', instructions: 'Тест', caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, classifications: [], archivedAt: null, createdAt: now, updatedAt: now })
    const invalid = [{ ...recipePayload()[0], ingredients: [] }]
    const fetcher = async () => new Response(JSON.stringify(invalid), { status: 200, headers: { 'Content-Type': 'application/json' } })

    await expect(importLunchPdfRecipes(database!, fetcher as typeof fetch, { expectedRecipeCount: 1 })).rejects.toThrow('Некоректний PDF-імпорт')
    expect(await database.recipes.get('old-recipe')).toBeDefined()
    expect(await database.imageAssets.get('old-image')).toBeDefined()
  })
})

function sequentialIds(): () => string {
  let id = 0
  return () => `id-${++id}`
}
