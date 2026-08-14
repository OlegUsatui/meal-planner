import { normalizeProductName, type BaseUnit, type DisplayUnit } from '../../features/products/domain/product'
import { normalizeImportedIngredient } from '../../features/products/import/normalize-imported-product'
import { isValidRecipeClassification, type RecipeMealType } from '../../features/recipes/domain/recipe-taxonomy'
import type { MealPlannerDatabase } from '../database'
import type { AppSettingsRecord, ProductRecord } from '../records'

interface SourceIngredient { name: string; enteredQuantity: number; enteredUnit: DisplayUnit }
interface SourceRecipe {
  sourcePage: number; mealType: RecipeMealType; name: string; instructions: string
  caloriesPerServing: number; proteinGramsPerServing: number; fatGramsPerServing: number; carbsGramsPerServing: number
  preparationTimeMinMinutes: number; preparationTimeMaxMinutes: number; subcategoryId: string
  ingredients: SourceIngredient[]; image: string; imageWidth: number; imageHeight: number
}
interface CanonicalIngredient { name: string; category: string; quantity: number; unit: BaseUnit }
interface PreparedRecipe extends Omit<SourceRecipe, 'ingredients'> { recipeId: string; imageId: string; imageBlob: Blob; ingredients: CanonicalIngredient[] }
interface Options { now?: () => string; id?: () => string; expectedBreakfastCount?: number; expectedDinnerCount?: number }
export interface MealPdfImportResult { imported: number; productsCreated: number }

const MARKER = 'breakfast-dinner-pdf-v1'
const BOOKS = [
  { url: '/imported-recipes/breakfasts-pdf/recipes.json', mealType: 'breakfast' as const, expected: 200 },
  { url: '/imported-recipes/dinners-pdf/recipes.json', mealType: 'dinner' as const, expected: 120 },
]
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export async function importBreakfastDinnerPdfRecipes(database: MealPlannerDatabase, fetcher: typeof fetch = fetch, options: Options = {}): Promise<MealPdfImportResult> {
  const settings = await database.appSettings.get('app')
  if (settings?.breakfastDinnerPdfImportVersion === MARKER) return { imported: 0, productsCreated: 0 }
  const expected = [options.expectedBreakfastCount ?? BOOKS[0].expected, options.expectedDinnerCount ?? BOOKS[1].expected]
  const sources = (await Promise.all(BOOKS.map(async (book, index) => {
    const response = await fetcher(book.url)
    if (!response.ok) invalid(`не вдалося завантажити ${book.mealType} (${response.status})`)
    return parseDataset(await response.json(), book.mealType, expected[index])
  }))).flat()
  assertUniqueNames(sources)
  const existing = await database.recipes.toArray()
  const existingNames = new Set(existing.map((recipe) => recipe.normalizedName))
  const conflict = sources.find((recipe) => existingNames.has(normalizeName(recipe.name)))
  if (conflict) invalid(`конфлікт назви «${conflict.name}»`)
  const id = options.id ?? (() => crypto.randomUUID())
  const prepared = await Promise.all(sources.map((source) => prepare(source, fetcher, id)))
  const now = options.now ?? (() => new Date().toISOString())
  let productsCreated = 0
  await database.transaction('rw', [database.products, database.recipes, database.recipeIngredients, database.imageAssets, database.appSettings], async () => {
    const timestamp = now()
    const products = await database.products.toArray()
    const byKey = new Map(products.map((product) => [productKey(product.name, product.baseUnit), product]))
    for (const recipe of prepared) {
      const ingredientRecords = []
      for (const ingredient of recipe.ingredients) {
        const key = productKey(ingredient.name, ingredient.unit)
        let product = byKey.get(key)
        if (!product) {
          product = productRecord(id(), ingredient, timestamp)
          await database.products.add(product); byKey.set(key, product); productsCreated += 1
        } else if (product.archivedAt) {
          product = { ...product, archivedAt: null, updatedAt: timestamp }
          await database.products.put(product); byKey.set(key, product)
        }
        ingredientRecords.push({ id: id(), recipeId: recipe.recipeId, productId: product.id, quantityBase: ingredient.quantity, enteredQuantity: ingredient.quantity, enteredUnit: ingredient.unit })
      }
      await database.imageAssets.add({ id: recipe.imageId, blob: recipe.imageBlob, mimeType: recipe.imageBlob.type || 'image/webp', width: recipe.imageWidth, height: recipe.imageHeight, byteSize: recipe.imageBlob.size, createdAt: timestamp })
      await database.recipes.add({ id: recipe.recipeId, name: clean(recipe.name), normalizedName: normalizeName(recipe.name), imageAssetId: recipe.imageId, instructions: clean(recipe.instructions), caloriesPerServing: recipe.caloriesPerServing, proteinGramsPerServing: recipe.proteinGramsPerServing, fatGramsPerServing: recipe.fatGramsPerServing, carbsGramsPerServing: recipe.carbsGramsPerServing, preparationTimeMinMinutes: recipe.preparationTimeMinMinutes, preparationTimeMaxMinutes: recipe.preparationTimeMaxMinutes, classifications: [{ mealType: recipe.mealType, subcategoryId: recipe.subcategoryId }], archivedAt: null, createdAt: timestamp, updatedAt: timestamp })
      await database.recipeIngredients.bulkAdd(ingredientRecords)
    }
    await database.appSettings.put(nextSettings(settings, timestamp))
  })
  return { imported: prepared.length, productsCreated }
}

function parseDataset(value: unknown, mealType: 'breakfast' | 'dinner', expected: number): SourceRecipe[] {
  if (!Array.isArray(value) || value.length !== expected) invalid(`очікувалося ${expected} рецептів ${mealType}`)
  const recipes = value as SourceRecipe[]
  for (const recipe of recipes) {
    const classification = { mealType: recipe?.mealType, subcategoryId: recipe?.subcategoryId }
    const nutrition = [recipe?.caloriesPerServing, recipe?.proteinGramsPerServing, recipe?.fatGramsPerServing, recipe?.carbsGramsPerServing]
    if (recipe?.mealType !== mealType || !Number.isInteger(recipe?.sourcePage) || !clean(recipe?.name ?? '') || !clean(recipe?.instructions ?? '')) invalid(`неповні дані ${mealType}, сторінка ${recipe?.sourcePage ?? '?'}`)
    if (!nutrition.every((item) => Number.isFinite(item) && item >= 0) || !validTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)) invalid(`некоректні КБЖУ/час, сторінка ${recipe.sourcePage}`)
    if (!isValidRecipeClassification(classification) || !Array.isArray(recipe.ingredients) || !recipe.ingredients.length || !recipe.image || recipe.imageWidth < 1 || recipe.imageHeight < 1) invalid(`некоректний рецепт, сторінка ${recipe.sourcePage}`)
    if (recipe.ingredients.some((item) => !clean(item?.name ?? '') || !Number.isFinite(item?.enteredQuantity) || item.enteredQuantity <= 0 || !['g', 'kg', 'ml', 'l', 'pcs'].includes(item.enteredUnit))) invalid(`некоректний інгредієнт, сторінка ${recipe.sourcePage}`)
  }
  return recipes
}

async function prepare(source: SourceRecipe, fetcher: typeof fetch, id: () => string): Promise<PreparedRecipe> {
  const ingredients = canonicalIngredients(source.ingredients)
  if (!ingredients.length) invalid(`не вдалося уніфікувати інгредієнти сторінки ${source.sourcePage}`)
  const response = await fetcher(source.image)
  if (!response.ok) invalid(`не вдалося завантажити фото сторінки ${source.sourcePage}`)
  const imageBlob = await response.blob()
  if (!imageBlob.type.startsWith('image/') || imageBlob.size < 1 || imageBlob.size > MAX_IMAGE_BYTES) invalid(`некоректне фото сторінки ${source.sourcePage}`)
  return { ...source, ingredients, imageBlob, imageId: id(), recipeId: id() }
}

function canonicalIngredients(items: SourceIngredient[]): CanonicalIngredient[] {
  const result = new Map<string, CanonicalIngredient>()
  for (const item of items) {
    const normalized = normalizeImportedIngredient(item.name, item.enteredQuantity, item.enteredUnit)
    if (!normalized) continue
    const key = productKey(normalized.name, normalized.unit); const current = result.get(key)
    if (current) current.quantity = round(current.quantity + normalized.quantity); else result.set(key, normalized)
  }
  return [...result.values()]
}

function assertUniqueNames(recipes: SourceRecipe[]) { const seen = new Set<string>(); for (const recipe of recipes) { const name = normalizeName(recipe.name); if (seen.has(name)) invalid(`дубльована назва «${recipe.name}»`); seen.add(name) } }
function validTime(minimum: number, maximum: number) { return Number.isInteger(minimum) && Number.isInteger(maximum) && minimum > 0 && minimum <= maximum && maximum <= 1440 }
function productKey(name: string, unit: BaseUnit) { return `${normalizeProductName(name)}:${unit}` }
function normalizeName(value: string) { return clean(value).toLocaleLowerCase('uk-UA') }
function clean(value: string) { return value.trim().replace(/\s+/gu, ' ') }
function round(value: number) { return Math.round(value * 1000) / 1000 }
function productRecord(id: string, ingredient: CanonicalIngredient, timestamp: string): ProductRecord { return { id, name: ingredient.name, normalizedName: normalizeProductName(ingredient.name), category: ingredient.category, baseUnit: ingredient.unit, archivedAt: null, createdAt: timestamp, updatedAt: timestamp } }
function nextSettings(current: AppSettingsRecord | undefined, timestamp: string): AppSettingsRecord { return { id: 'app', locale: current?.locale ?? 'uk-UA', currency: current?.currency ?? 'NOK', firstDayOfWeek: 1, onboardingCompleted: current?.onboardingCompleted ?? false, lastOpenedDate: current?.lastOpenedDate ?? null, createdAt: current?.createdAt ?? timestamp, updatedAt: timestamp, lunchPdfImportVersion: current?.lunchPdfImportVersion, breakfastDinnerPdfImportVersion: MARKER } }
function invalid(reason: string): never { throw new Error(`Некоректний PDF-імпорт: ${reason}`) }
