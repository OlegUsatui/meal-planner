import { afterEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from '../database'
import type { RecipeRecord } from '../records'
import { repairImportedRecipeTitles } from './repair-imported-recipe-titles'

const now = '2026-08-14T00:00:00.000Z'

describe('imported recipe title repair', () => {
  let database: MealPlannerDatabase | undefined
  afterEach(async () => { database?.close(); await database?.delete() })

  it('updates exact OCR aliases in place and preserves manual titles and references', async () => {
    database = new MealPlannerDatabase(`recipe-title-repair-${crypto.randomUUID()}`)
    await database.recipes.bulkAdd([
      recipe('broken', 'Боул з гречкою, яйцем авокадо a'),
      recipe('manual', 'Мій власний сніданок'),
    ])
    await database.mealPlanEntries.add({ id: 'plan', date: '2026-08-15', slot: 'breakfast', dateSlot: '2026-08-15:breakfast', recipeId: 'broken', servings: 2, createdAt: now, updatedAt: now })

    await expect(repairImportedRecipeTitles(database, fetcher([
      source('Боул з гречкою, яйцем і авокадо', ['Боул з гречкою, яйцем авокадо a']),
    ], []), { expectedBreakfastCount: 1, expectedDinnerCount: 0, now: () => now })).resolves.toEqual({ updated: 1 })

    expect(await database.recipes.get('broken')).toMatchObject({ name: 'Боул з гречкою, яйцем і авокадо', normalizedName: 'боул з гречкою, яйцем і авокадо', updatedAt: now })
    expect((await database.recipes.get('manual'))?.name).toBe('Мій власний сніданок')
    expect((await database.mealPlanEntries.get('plan'))?.recipeId).toBe('broken')
    expect((await database.appSettings.get('app'))?.recipeTitleRepairVersion).toBe('recipe-titles-v3')
  })

  it('is idempotent after the repair marker is stored', async () => {
    database = new MealPlannerDatabase(`recipe-title-repair-idempotent-${crypto.randomUUID()}`)
    await database.recipes.add(recipe('broken', 'Стара назва'))
    const load = fetcher([source('Нова назва', ['Стара назва'])], [])
    await repairImportedRecipeTitles(database, load, { expectedBreakfastCount: 1, expectedDinnerCount: 0 })
    await expect(repairImportedRecipeTitles(database, failingFetcher, { expectedBreakfastCount: 1, expectedDinnerCount: 0 })).resolves.toEqual({ updated: 0 })
  })

  it('reruns for databases that already completed the earlier v2 repair', async () => {
    database = new MealPlannerDatabase(`recipe-title-repair-v2-${crypto.randomUUID()}`)
    await database.recipes.add(recipe('broken', 'Стара назва'))
    await database.appSettings.add({ id: 'app', locale: 'uk-UA', currency: 'NOK', firstDayOfWeek: 1, onboardingCompleted: true, lastOpenedDate: null, createdAt: now, updatedAt: now, recipeTitleRepairVersion: 'recipe-titles-v2' })

    await expect(repairImportedRecipeTitles(database, fetcher([source('Нова назва', ['Стара назва'])], []), { expectedBreakfastCount: 1, expectedDinnerCount: 0 })).resolves.toEqual({ updated: 1 })
    expect((await database.recipes.get('broken'))?.name).toBe('Нова назва')
    expect((await database.appSettings.get('app'))?.recipeTitleRepairVersion).toBe('recipe-titles-v3')
  })

  it('does not write when a corrected title conflicts with another recipe', async () => {
    database = new MealPlannerDatabase(`recipe-title-repair-conflict-${crypto.randomUUID()}`)
    await database.recipes.bulkAdd([recipe('broken', 'Стара назва'), recipe('existing', 'Нова назва')])
    await expect(repairImportedRecipeTitles(database, fetcher([source('Нова назва', ['Стара назва'])], []), { expectedBreakfastCount: 1, expectedDinnerCount: 0 })).rejects.toThrow('конфлікт назви')
    expect((await database.recipes.get('broken'))?.name).toBe('Стара назва')
    expect((await database.appSettings.get('app'))?.recipeTitleRepairVersion).toBeUndefined()
  })
})

function recipe(id: string, name: string): RecipeRecord {
  return { id, name, normalizedName: name.toLocaleLowerCase('uk-UA'), imageAssetId: `${id}-image`, instructions: 'Готувати', caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, classifications: [], archivedAt: null, createdAt: now, updatedAt: now }
}

function source(name: string, previousNames: string[]) { return { sourcePage: 1, name, previousNames } }
function fetcher(breakfast: unknown[], dinner: unknown[]): typeof fetch { return (async (input: RequestInfo | URL) => new Response(JSON.stringify(String(input).includes('breakfasts') ? breakfast : dinner))) as typeof fetch }
const failingFetcher = (async () => { throw new Error('must not fetch') }) as typeof fetch
