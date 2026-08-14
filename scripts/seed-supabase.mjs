import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { FIT_KITCHEN_CATALOG } from '../src/features/products/import/fit-kitchen-catalog.ts'
import { normalizeImportedIngredient } from '../src/features/products/import/normalize-imported-product.ts'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRoleKey) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.')

const client = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const root = process.cwd()
const now = new Date().toISOString()
const productMap = new Map()

function normalizeName(value) { return value.trim().replace(/\s+/gu, ' ').toLocaleLowerCase('uk-UA') }
function productKey(name, unit) { return `${normalizeName(name)}:${unit}` }
function productId(name, unit) { return `seed-product:${normalizeName(name).replace(/[^\p{L}\p{N}]+/gu, '-')}:${unit}` }

async function loadJson(relativePath) { return JSON.parse(await readFile(path.join(root, relativePath), 'utf8')) }

async function upsertProducts(items) {
  const rows = []
  for (const item of items) {
    const key = productKey(item.name, item.baseUnit)
    if (productMap.has(key)) continue
    const row = { id: productId(item.name, item.baseUnit), owner_id: null, name: item.name.trim(), normalized_name: normalizeName(item.name), category: item.category, base_unit: item.baseUnit, archived_at: null, created_at: now, updated_at: now }
    productMap.set(key, row); rows.push(row)
  }
  if (rows.length) await insertOrThrow('products', rows)
}

async function normalizeIngredients(items) {
  const result = []
  for (const item of items) {
    const normalized = normalizeImportedIngredient(item.name, item.enteredQuantity, item.enteredUnit)
    if (!normalized) continue
    const key = productKey(normalized.name, normalized.unit)
    if (!productMap.has(key)) {
      const row = { id: productId(normalized.name, normalized.unit), owner_id: null, name: normalized.name, normalized_name: normalizeName(normalized.name), category: normalized.category, base_unit: normalized.unit, archived_at: null, created_at: now, updated_at: now }
      productMap.set(key, row)
      await insertOrThrow('products', [row])
    }
    result.push({ product_id: productMap.get(key).id, quantity_base: normalized.quantity, entered_quantity: item.enteredQuantity, entered_unit: item.enteredUnit })
  }
  return result
}

async function seedCollection(file, mealType) {
  const recipes = await loadJson(file)
  for (const source of recipes) {
    const id = `seed:${mealType}:${source.sourcePage}`
    const imagePath = `system/${id.replaceAll(':', '-')}.webp`
    const imageFile = path.join(root, 'public', source.image.replace(/^\//u, ''))
    const image = await readFile(imageFile)
    const ingredients = await normalizeIngredients(source.ingredients)
    if (!ingredients.length) throw new Error(`No ingredients after normalization for ${source.name}`)
    const min = source.preparationTimeMinutes ?? source.preparationTimeMinMinutes
    const max = source.preparationTimeMinutes ?? source.preparationTimeMaxMinutes
    await uploadOrThrow(imagePath, image)
    await insertOrThrow('recipes', [{ id, owner_id: null, name: source.name.trim(), normalized_name: normalizeName(source.name), image_path: imagePath, image_mime_type: 'image/webp', image_width: source.imageWidth, image_height: source.imageHeight, image_byte_size: image.byteLength, instructions: source.instructions.trim(), calories_per_serving: source.caloriesPerServing, protein_grams_per_serving: source.proteinGramsPerServing, fat_grams_per_serving: source.fatGramsPerServing, carbs_grams_per_serving: source.carbsPerServing, preparation_time_min_minutes: min, preparation_time_max_minutes: max, classifications: [{ mealType, subcategoryId: source.subcategoryId }], archived_at: null, created_at: now, updated_at: now }])
    await replaceIngredients(id, ingredients)
  }
  console.log(`Seeded ${recipes.length} ${mealType} recipes.`)
}

async function uploadOrThrow(filePath, body) {
  const { error } = await client.storage.from('recipe-images').upload(filePath, body, { contentType: 'image/webp', upsert: true })
  if (error) throw new Error(`Image upload failed for ${filePath}: ${error.message}`)
}

async function insertOrThrow(table, rows) {
  const { error } = await client.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`${table} seed failed: ${error.message}`)
}

async function replaceIngredients(recipeId, ingredients) {
  const { error: deleteError } = await client.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
  if (deleteError) throw new Error(`Ingredient cleanup failed: ${deleteError.message}`)
  const rows = ingredients.map((ingredient) => ({ id: `${recipeId}:${ingredient.product_id}`, recipe_id: recipeId, ...ingredient }))
  const { error } = await client.from('recipe_ingredients').insert(rows)
  if (error) throw new Error(`Ingredient seed failed: ${error.message}`)
}

await upsertProducts(FIT_KITCHEN_CATALOG)
await seedCollection('public/imported-recipes/lunches-pdf/lunches.json', 'lunch')
await seedCollection('public/imported-recipes/breakfasts-pdf/recipes.json', 'breakfast')
await seedCollection('public/imported-recipes/dinners-pdf/recipes.json', 'dinner')
console.log(`Seed complete. System products: ${productMap.size}`)
