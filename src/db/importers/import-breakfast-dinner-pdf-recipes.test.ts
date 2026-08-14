import { afterEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from '../database'
import { importBreakfastDinnerPdfRecipes } from './import-breakfast-dinner-pdf-recipes'

const now = '2026-08-14T00:00:00.000Z'

function source(mealType: 'breakfast' | 'dinner', sourcePage: number, name: string) {
  return [{ sourcePage, mealType, name, instructions: 'Приготуйте та подайте.', caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 50, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, subcategoryId: mealType === 'breakfast' ? 'breakfast-eggs' : 'dinner-fish', ingredients: [{ name: 'Яйця', enteredQuantity: 2, enteredUnit: 'pcs' }], image: `/imported-recipes/${mealType}s-pdf/images/page-${sourcePage}.webp`, imageWidth: 1200, imageHeight: 1200 }]
}

describe('breakfast and dinner PDF import', () => {
  let database: MealPlannerDatabase | undefined
  afterEach(async () => { database?.close(); await database?.delete() })

  it('atomically appends both books while preserving existing recipes and plans', async () => {
    database = new MealPlannerDatabase(`meal-pdf-import-${crypto.randomUUID()}`)
    await database.imageAssets.add({ id: 'old-image', blob: new Blob(['old']), mimeType: 'image/webp', width: 10, height: 10, byteSize: 3, createdAt: now })
    await database.recipes.add({ id: 'lunch', name: 'Обід', normalizedName: 'обід', imageAssetId: 'old-image', instructions: 'Готувати', caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, classifications: [{ mealType: 'lunch', subcategoryId: 'lunch-wok' }], archivedAt: null, createdAt: now, updatedAt: now })
    await database.mealPlanEntries.add({ id: 'plan', date: '2026-08-15', slot: 'lunch', dateSlot: '2026-08-15:lunch', recipeId: 'lunch', servings: 1, createdAt: now, updatedAt: now })
    const fetcher = createFetcher(source('breakfast', 13, 'Сніданок'), source('dinner', 17, 'Вечеря'))

    await expect(importBreakfastDinnerPdfRecipes(database, fetcher, { expectedBreakfastCount: 1, expectedDinnerCount: 1, now: () => now, id: sequentialIds() })).resolves.toEqual({ imported: 2, productsCreated: 1 })
    expect(await database.recipes.count()).toBe(3)
    expect(await database.mealPlanEntries.get('plan')).toBeDefined()
    expect(await database.recipes.where('normalizedName').equals('вечеря').first()).toMatchObject({ preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25 })
    expect((await database.appSettings.get('app'))?.breakfastDinnerPdfImportVersion).toBe('breakfast-dinner-pdf-v1')
  })

  it('does not write anything when a source name conflicts with an existing recipe', async () => {
    database = new MealPlannerDatabase(`meal-pdf-conflict-${crypto.randomUUID()}`)
    await database.imageAssets.add({ id: 'old-image', blob: new Blob(['old']), mimeType: 'image/webp', width: 10, height: 10, byteSize: 3, createdAt: now })
    await database.recipes.add({ id: 'manual', name: 'Сніданок', normalizedName: 'сніданок', imageAssetId: 'old-image', instructions: 'Готувати', caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, classifications: [], archivedAt: null, createdAt: now, updatedAt: now })
    const fetcher = createFetcher(source('breakfast', 13, 'Сніданок'), source('dinner', 17, 'Вечеря'))
    await expect(importBreakfastDinnerPdfRecipes(database, fetcher, { expectedBreakfastCount: 1, expectedDinnerCount: 1 })).rejects.toThrow('конфлікт назви')
    expect(await database.recipes.count()).toBe(1)
    expect(await database.imageAssets.count()).toBe(1)
  })

  it('rejects a source ingredient without a positive quantity before writing', async () => {
    database = new MealPlannerDatabase(`meal-pdf-invalid-ingredient-${crypto.randomUUID()}`)
    const breakfast = source('breakfast', 13, 'Сніданок')
    breakfast[0].ingredients.push({ name: 'Банан', enteredQuantity: 0, enteredUnit: 'pcs' })
    const fetcher = createFetcher(breakfast, source('dinner', 17, 'Вечеря'))

    await expect(importBreakfastDinnerPdfRecipes(database, fetcher, { expectedBreakfastCount: 1, expectedDinnerCount: 1 })).rejects.toThrow('інгредієнт')
    expect(await database.recipes.count()).toBe(0)
  })
})

function createFetcher(breakfast: unknown, dinner: unknown): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/breakfasts-pdf/recipes.json')) return new Response(JSON.stringify(breakfast), { status: 200 })
    if (url.endsWith('/dinners-pdf/recipes.json')) return new Response(JSON.stringify(dinner), { status: 200 })
    return new Response(new TextEncoder().encode('image'), { status: 200, headers: { 'Content-Type': 'image/webp' } })
  }) as typeof fetch
}

function sequentialIds(): () => string { let value = 0; return () => `id-${++value}` }
