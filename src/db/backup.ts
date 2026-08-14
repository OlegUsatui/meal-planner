import type { MealPlannerDatabase } from './database'
import type { AppSettingsRecord, ImageAssetRecord, MealPlanEntryRecord, ProductRecord, RecipeIngredientRecord, RecipeRecord } from './records'

const BACKUP_VERSION = 1
type SerializedImage = Omit<ImageAssetRecord, 'blob'> & { blob: string }
export interface MealPlannerBackup {
  format: 'meal-planner-backup'
  version: 1
  exportedAt: string
  products: ProductRecord[]
  recipes: RecipeRecord[]
  recipeIngredients: RecipeIngredientRecord[]
  mealPlanEntries: MealPlanEntryRecord[]
  imageAssets: SerializedImage[]
  appSettings: AppSettingsRecord[]
}

export async function exportBackup(database: MealPlannerDatabase): Promise<string> {
  const [products, recipes, recipeIngredients, mealPlanEntries, imageAssets, appSettings] = await Promise.all([
    database.products.toArray(), database.recipes.toArray(), database.recipeIngredients.toArray(), database.mealPlanEntries.toArray(), database.imageAssets.toArray(), database.appSettings.toArray(),
  ])
  const serializedImages = await Promise.all(imageAssets.map(async (image) => ({ ...image, blob: await blobToBase64(image.blob) })))
  const backup: MealPlannerBackup = { format: 'meal-planner-backup', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), products, recipes, recipeIngredients, mealPlanEntries, imageAssets: serializedImages, appSettings }
  return JSON.stringify(backup)
}

export async function importBackup(database: MealPlannerDatabase, input: string | Blob): Promise<void> {
  const text = typeof input === 'string' ? input : await input.text()
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new Error('Некоректна резервна копія: файл не є JSON') }
  const backup = validateBackup(parsed)
  const images = backup.imageAssets.map((image) => ({ ...image, blob: base64ToBlob(image.blob, image.mimeType) }))
  await database.transaction('rw', [database.products, database.recipes, database.recipeIngredients, database.mealPlanEntries, database.imageAssets, database.appSettings], async () => {
    await Promise.all([database.products.clear(), database.recipes.clear(), database.recipeIngredients.clear(), database.mealPlanEntries.clear(), database.imageAssets.clear(), database.appSettings.clear()])
    await database.products.bulkAdd(backup.products)
    await database.recipes.bulkAdd(backup.recipes)
    await database.recipeIngredients.bulkAdd(backup.recipeIngredients)
    await database.mealPlanEntries.bulkAdd(backup.mealPlanEntries)
    await database.imageAssets.bulkAdd(images)
    await database.appSettings.bulkAdd(backup.appSettings)
  })
}

function validateBackup(value: unknown): MealPlannerBackup {
  if (!value || typeof value !== 'object') throw new Error('Некоректна резервна копія')
  const candidate = value as Partial<MealPlannerBackup>
  const arrays = [candidate.products, candidate.recipes, candidate.recipeIngredients, candidate.mealPlanEntries, candidate.imageAssets, candidate.appSettings]
  if (candidate.format !== 'meal-planner-backup' || candidate.version !== BACKUP_VERSION || arrays.some((items) => !Array.isArray(items))) throw new Error('Некоректна резервна копія')
  return candidate as MealPlannerBackup
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await new Response(blob).arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBlob(value: string, mimeType: string): Blob {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
}
