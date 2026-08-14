import { normalizeProductName } from '../../features/products/domain/product'
import type { BaseUnit } from '../../features/products/domain/product'
import { normalizeImportedIngredient } from '../../features/products/import/normalize-imported-product'
import type { RecipeClassification } from '../../features/recipes/domain/recipe-taxonomy'
import type { MealPlannerDatabase } from '../database'
import type { AppSettingsRecord, ProductRecord } from '../records'

interface PdfIngredient {
  name: string
  enteredQuantity: number
  enteredUnit: 'g' | 'kg' | 'ml' | 'l' | 'pcs'
}

interface PdfLunchRecipe {
  sourcePage: number
  name: string
  instructions: string
  caloriesPerServing: number
  proteinGramsPerServing: number
  fatGramsPerServing: number
  carbsGramsPerServing: number
  preparationTimeMinutes: number
  subcategoryId: string
  ingredients: PdfIngredient[]
  image: string
  imageWidth: number
  imageHeight: number
}

interface ImportOptions {
  now?: () => string
  id?: () => string
  expectedRecipeCount?: number
}

interface PreparedRecipe extends Omit<PdfLunchRecipe, 'ingredients'> {
  imageBlob: Blob
  imageId: string
  recipeId: string
  ingredients: CanonicalIngredient[]
}

interface CanonicalIngredient {
  name: string
  category: string
  quantity: number
  unit: BaseUnit
}

export interface LunchPdfImportResult {
  imported: number
  productsCreated: number
}

const DATASET_URL = '/imported-recipes/lunches-pdf/lunches.json'
const IMPORT_MARKER = 'lunch-pdf-v1'
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export async function importLunchPdfRecipes(
  database: MealPlannerDatabase,
  fetcher: typeof fetch = fetch,
  options: ImportOptions = {},
): Promise<LunchPdfImportResult> {
  const settings = await database.appSettings.get('app')
  if (settings?.lunchPdfImportVersion === IMPORT_MARKER) return { imported: 0, productsCreated: 0 }

  const expectedRecipeCount = options.expectedRecipeCount ?? 137
  const now = options.now ?? (() => new Date().toISOString())
  const id = options.id ?? (() => crypto.randomUUID())
  const response = await fetcher(DATASET_URL)
  if (!response.ok) throw new Error(`Не вдалося завантажити PDF-імпорт обідів (${response.status})`)
  const sources = await parseDataset(response, expectedRecipeCount)
  const prepared = await prepareRecipes(sources, fetcher, id)

  let productsCreated = 0
  await database.transaction(
    'rw',
    [database.products, database.recipes, database.recipeIngredients, database.mealPlanEntries, database.imageAssets, database.appSettings],
    async () => {
      const timestamp = now()
      const products = await database.products.toArray()
      const productByKey = new Map(products.map((product) => [productKey(product.name, product.baseUnit), product]))
      const recipeImageIds = (await database.recipes.toArray()).map((recipe) => recipe.imageAssetId)

      await database.mealPlanEntries.clear()
      await database.recipeIngredients.clear()
      await database.recipes.clear()
      await database.imageAssets.bulkDelete(recipeImageIds)

      for (const recipe of prepared) {
        const ingredientRecords = []
        for (const ingredient of recipe.ingredients) {
          const key = productKey(ingredient.name, ingredient.unit)
          let product = productByKey.get(key)
          if (!product) {
            product = productRecord(id(), ingredient, timestamp)
            await database.products.add(product)
            productByKey.set(key, product)
            productsCreated += 1
          } else if (product.archivedAt) {
            product = { ...product, archivedAt: null, updatedAt: timestamp }
            await database.products.put(product)
            productByKey.set(key, product)
          }
          ingredientRecords.push({
            id: id(),
            recipeId: recipe.recipeId,
            productId: product.id,
            quantityBase: ingredient.quantity,
            enteredQuantity: ingredient.quantity,
            enteredUnit: ingredient.unit,
          })
        }

        await database.imageAssets.add({
          id: recipe.imageId,
          blob: recipe.imageBlob,
          mimeType: recipe.imageBlob.type || 'image/webp',
          width: recipe.imageWidth,
          height: recipe.imageHeight,
          byteSize: recipe.imageBlob.size,
          createdAt: timestamp,
        })
        await database.recipes.add({
          id: recipe.recipeId,
          name: cleanText(recipe.name),
          normalizedName: normalizeRecipeName(recipe.name),
          imageAssetId: recipe.imageId,
          instructions: cleanText(recipe.instructions),
          caloriesPerServing: recipe.caloriesPerServing,
          proteinGramsPerServing: recipe.proteinGramsPerServing,
          fatGramsPerServing: recipe.fatGramsPerServing,
          carbsGramsPerServing: recipe.carbsGramsPerServing,
          preparationTimeMinMinutes: recipe.preparationTimeMinutes,
          preparationTimeMaxMinutes: recipe.preparationTimeMinutes,
          classifications: [{ mealType: 'lunch', subcategoryId: recipe.subcategoryId } as RecipeClassification],
          archivedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        await database.recipeIngredients.bulkAdd(ingredientRecords)
      }

      await database.appSettings.put(nextSettings(settings, timestamp))
    },
  )

  return { imported: prepared.length, productsCreated }
}

async function parseDataset(response: Response, expectedRecipeCount: number): Promise<PdfLunchRecipe[]> {
  const value: unknown = await response.json()
  if (!Array.isArray(value) || value.length !== expectedRecipeCount) invalidDataset(`очікувалося ${expectedRecipeCount} рецептів`)
  const recipes = value as PdfLunchRecipe[]
  const pages = new Set<number>()
  const names = new Set<string>()
  for (const recipe of recipes) {
    const normalizedName = normalizeRecipeName(recipe?.name ?? '')
    if (!Number.isInteger(recipe?.sourcePage) || pages.has(recipe.sourcePage)) invalidDataset('дубль або некоректний номер сторінки')
    if (!normalizedName || names.has(normalizedName)) invalidDataset('порожня або дубльована назва')
    if (!cleanText(recipe?.instructions ?? '') || !validNutrition(recipe) || !validTime(recipe?.preparationTimeMinutes)) invalidDataset(`неповні дані сторінки ${recipe?.sourcePage ?? '?'}`)
    if (!recipe?.subcategoryId || !recipe?.image || !validDimension(recipe.imageWidth) || !validDimension(recipe.imageHeight)) invalidDataset(`неповне фото/категорія сторінки ${recipe?.sourcePage ?? '?'}`)
    if (!Array.isArray(recipe?.ingredients) || !recipe.ingredients.length) invalidDataset(`немає інгредієнтів на сторінці ${recipe?.sourcePage ?? '?'}`)
    pages.add(recipe.sourcePage)
    names.add(normalizedName)
  }
  return recipes
}

async function prepareRecipes(sources: PdfLunchRecipe[], fetcher: typeof fetch, id: () => string): Promise<PreparedRecipe[]> {
  return Promise.all(sources.map(async (source) => {
    const ingredients = canonicalIngredients(source.ingredients)
    if (!ingredients.length) invalidDataset(`не вдалося уніфікувати інгредієнти сторінки ${source.sourcePage}`)
    const imageResponse = await fetcher(source.image)
    if (!imageResponse.ok) invalidDataset(`не вдалося завантажити фото сторінки ${source.sourcePage}`)
    const imageBlob = await imageResponse.blob()
    if (!imageBlob.type.startsWith('image/') || imageBlob.size < 1 || imageBlob.size > MAX_IMAGE_BYTES) invalidDataset(`некоректне фото сторінки ${source.sourcePage}`)
    return { ...source, ingredients, imageBlob, imageId: id(), recipeId: id() }
  }))
}

function canonicalIngredients(items: PdfIngredient[]): CanonicalIngredient[] {
  const result = new Map<string, CanonicalIngredient>()
  for (const item of items) {
    if (!item || !Number.isFinite(item.enteredQuantity) || item.enteredQuantity <= 0) continue
    const normalized = normalizeImportedIngredient(item.name, item.enteredQuantity, item.enteredUnit)
    if (!normalized) continue
    const key = productKey(normalized.name, normalized.unit)
    const existing = result.get(key)
    if (existing) existing.quantity = round(existing.quantity + normalized.quantity)
    else result.set(key, normalized)
  }
  return [...result.values()]
}

function productRecord(id: string, ingredient: CanonicalIngredient, timestamp: string): ProductRecord {
  return {
    id,
    name: ingredient.name,
    normalizedName: normalizeProductName(ingredient.name),
    category: ingredient.category,
    baseUnit: ingredient.unit,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function nextSettings(current: AppSettingsRecord | undefined, timestamp: string): AppSettingsRecord {
  return {
    id: 'app',
    locale: current?.locale ?? 'uk-UA',
    currency: current?.currency ?? 'NOK',
    firstDayOfWeek: 1,
    onboardingCompleted: current?.onboardingCompleted ?? false,
    lastOpenedDate: current?.lastOpenedDate ?? null,
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
    lunchPdfImportVersion: IMPORT_MARKER,
  }
}

function validNutrition(recipe: PdfLunchRecipe): boolean {
  return [recipe?.caloriesPerServing, recipe?.proteinGramsPerServing, recipe?.fatGramsPerServing, recipe?.carbsGramsPerServing]
    .every((value) => Number.isFinite(value) && value >= 0)
}

function validTime(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 1440
}

function validDimension(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function productKey(name: string, unit: BaseUnit): string {
  return `${normalizeProductName(name)}:${unit}`
}

function normalizeRecipeName(name: string): string {
  return cleanText(name).toLocaleLowerCase('uk-UA')
}

function cleanText(value: string): string {
  return value.trim().replace(/\s+/gu, ' ')
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function invalidDataset(reason: string): never {
  throw new Error(`Некоректний PDF-імпорт: ${reason}`)
}
