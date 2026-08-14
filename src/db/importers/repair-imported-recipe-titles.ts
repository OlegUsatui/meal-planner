import type { MealPlannerDatabase } from '../database'
import type { AppSettingsRecord, RecipeRecord } from '../records'

interface TitleSource {
  sourcePage: number
  name: string
  previousNames?: string[]
}

interface Options {
  now?: () => string
  expectedBreakfastCount?: number
  expectedDinnerCount?: number
}

interface Correction {
  recipe: RecipeRecord
  name: string
  normalizedName: string
}

export interface RecipeTitleRepairResult { updated: number }

const MARKER = 'recipe-titles-v3'
const BOOKS = [
  { url: '/imported-recipes/breakfasts-pdf/recipes.json', expected: 200 },
  { url: '/imported-recipes/dinners-pdf/recipes.json', expected: 120 },
]

export async function repairImportedRecipeTitles(
  database: MealPlannerDatabase,
  fetcher: typeof fetch = fetch,
  options: Options = {},
): Promise<RecipeTitleRepairResult> {
  const settings = await database.appSettings.get('app')
  if (settings?.recipeTitleRepairVersion === MARKER) return { updated: 0 }
  const expected = [options.expectedBreakfastCount ?? BOOKS[0].expected, options.expectedDinnerCount ?? BOOKS[1].expected]
  const sources = (await Promise.all(BOOKS.map(async (book, index) => {
    const response = await fetcher(book.url)
    if (!response.ok) invalid(`не вдалося завантажити набір (${response.status})`)
    return parseSources(await response.json(), expected[index])
  }))).flat()
  const aliases = correctionAliases(sources)
  const timestamp = (options.now ?? (() => new Date().toISOString()))()
  let updated = 0

  await database.transaction('rw', [database.recipes, database.appSettings], async () => {
    const recipes = await database.recipes.toArray()
    const corrections = recipes.flatMap((recipe): Correction[] => {
      const source = aliases.get(recipe.normalizedName)
      if (!source) return []
      const normalizedName = normalize(source.name)
      return normalizedName === recipe.normalizedName ? [] : [{ recipe, name: clean(source.name), normalizedName }]
    })
    assertNoConflicts(recipes, corrections)
    for (const correction of corrections) {
      await database.recipes.put({ ...correction.recipe, name: correction.name, normalizedName: correction.normalizedName, updatedAt: timestamp })
    }
    updated = corrections.length
    await database.appSettings.put(nextSettings(settings, timestamp))
  })
  return { updated }
}

function parseSources(value: unknown, expected: number): TitleSource[] {
  if (!Array.isArray(value) || value.length !== expected) invalid(`очікувалося ${expected} рецептів`)
  const sources = value as TitleSource[]
  for (const source of sources) {
    if (!Number.isInteger(source?.sourcePage) || !clean(source?.name ?? '')) invalid('некоректний запис рецепту')
    if (source.previousNames !== undefined && (!Array.isArray(source.previousNames) || source.previousNames.some((name) => !clean(name)))) invalid(`некоректні попередні назви сторінки ${source.sourcePage}`)
  }
  return sources
}

function correctionAliases(sources: TitleSource[]): Map<string, TitleSource> {
  const aliases = new Map<string, TitleSource>()
  const targets = new Set<string>()
  for (const source of sources) {
    const target = normalize(source.name)
    if (targets.has(target)) invalid(`дубльована назва «${source.name}»`)
    targets.add(target)
    for (const previousName of source.previousNames ?? []) {
      const alias = normalize(previousName)
      const existing = aliases.get(alias)
      if (existing && normalize(existing.name) !== target) invalid(`неоднозначна стара назва «${previousName}»`)
      aliases.set(alias, source)
    }
  }
  return aliases
}

function assertNoConflicts(recipes: RecipeRecord[], corrections: Correction[]): void {
  const correctingIds = new Set(corrections.map(({ recipe }) => recipe.id))
  const occupied = new Map(recipes.filter((recipe) => !correctingIds.has(recipe.id)).map((recipe) => [recipe.normalizedName, recipe.id]))
  const targets = new Set<string>()
  for (const correction of corrections) {
    if (occupied.has(correction.normalizedName) || targets.has(correction.normalizedName)) invalid(`конфлікт назви «${correction.name}»`)
    targets.add(correction.normalizedName)
  }
}

function nextSettings(current: AppSettingsRecord | undefined, timestamp: string): AppSettingsRecord {
  return { id: 'app', locale: current?.locale ?? 'uk-UA', currency: current?.currency ?? 'NOK', firstDayOfWeek: 1, onboardingCompleted: current?.onboardingCompleted ?? false, lastOpenedDate: current?.lastOpenedDate ?? null, createdAt: current?.createdAt ?? timestamp, updatedAt: timestamp, lunchPdfImportVersion: current?.lunchPdfImportVersion, breakfastDinnerPdfImportVersion: current?.breakfastDinnerPdfImportVersion, recipeTitleRepairVersion: MARKER }
}

function clean(value: string): string { return value.trim().replace(/\s+/gu, ' ') }
function normalize(value: string): string { return clean(value).toLocaleLowerCase('uk-UA') }
function invalid(reason: string): never { throw new Error(`Некоректне виправлення назв: ${reason}`) }
