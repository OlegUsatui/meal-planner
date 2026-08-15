import type { SupabaseClient } from '@supabase/supabase-js'
import { hasRecipeValidationErrors, normalizeRecipeName, validateRecipeInput } from '../features/recipes/domain/recipe.js'
import { normalizeQuantity } from '../features/products/domain/product.js'
import { uniqueClassifications } from '../features/recipes/domain/recipe-taxonomy.js'
import type { CreateRecipeInput, Recipe, RecipeImageInput, RecipeSummary, UpdateRecipeInput } from '../features/recipes/types.js'
import { RecipeRepositoryError, type RecipeListFilters, type RecipeListOptions, type RecipeSummaryPage, type RecipeRepository } from '../features/recipes/repositories/recipe-repository.js'
import { R2Storage } from '../../api/_lib/r2.js'
import { asNumber, cleanName, currentUserId } from './common.js'
import { isOwnedRecipeImagePath } from './image-path.js'

interface RecipeRow { id: string; owner_id: string | null; name: string; normalized_name: string; image_path: string | null; image_mime_type: string | null; image_width: number | null; image_height: number | null; image_byte_size: number | null; instructions: string; calories_per_serving: number | string | null; protein_grams_per_serving: number | string | null; fat_grams_per_serving: number | string | null; carbs_grams_per_serving: number | string | null; preparation_time_min_minutes: number | null; preparation_time_max_minutes: number | null; classifications: unknown; archived_at: string | null; created_at: string; updated_at: string }
interface IngredientRow { id: string; recipe_id: string; product_id: string; quantity_base: number | string; entered_quantity: number | string; entered_unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs' }
interface ProductRow { id: string; name: string; base_unit: 'g' | 'ml' | 'pcs'; archived_at: string | null }
const SUMMARY_COLUMNS = 'id,owner_id,name,image_path,image_mime_type,image_width,image_height,image_byte_size,preparation_time_min_minutes,preparation_time_max_minutes,classifications,archived_at'

export class SupabaseRecipeRepository implements RecipeRepository {
  private readonly client: SupabaseClient
  private readonly storage: R2Storage
  private readonly isAdmin: boolean

  constructor(client: SupabaseClient, isAdminOrStorage: boolean | R2Storage = false, storage?: R2Storage) {
    this.client = client
    this.isAdmin = typeof isAdminOrStorage === 'boolean' ? isAdminOrStorage : false
    this.storage = typeof isAdminOrStorage === 'boolean' ? (storage ?? new R2Storage()) : isAdminOrStorage
  }

  async list(query = '', filters: RecipeListFilters = {}): Promise<RecipeSummary[]> {
    const normalizedQuery = normalizeRecipeName(query)
    let recipeQuery = this.client.from('recipes').select(SUMMARY_COLUMNS).is('archived_at', null).order('name')
    if (normalizedQuery) recipeQuery = recipeQuery.ilike('normalized_name', `%${escapeLikePattern(normalizedQuery)}%`)
    if (filters.systemOnly) recipeQuery = recipeQuery.is('owner_id', null)
    if (filters.mealType) recipeQuery = recipeQuery.filter('classifications', 'cs', JSON.stringify([{ mealType: filters.mealType }]))
    const { data, error } = await recipeQuery
    if (error) throw new RecipeRepositoryError('not-found', 'Не вдалося завантажити рецепти.')
    return this.summarizeRows((data ?? []) as unknown as RecipeRow[])
  }

  async listPage(query = '', options: RecipeListOptions): Promise<RecipeSummaryPage> {
    const page = Math.max(1, options.page)
    const pageSize = Math.min(100, Math.max(1, options.pageSize))
    let recipeQuery = this.client.from('recipes').select(SUMMARY_COLUMNS, { count: 'exact' }).order('name')
    if (!options.includeArchived) recipeQuery = recipeQuery.is('archived_at', null)
    if (options.systemOnly) recipeQuery = recipeQuery.is('owner_id', null)
    const normalizedQuery = normalizeRecipeName(query)
    if (normalizedQuery) recipeQuery = recipeQuery.ilike('normalized_name', `%${escapeLikePattern(normalizedQuery)}%`)
    if (options.uncategorized) recipeQuery = recipeQuery.filter('classifications', 'eq', '[]')
    else if (options.mealType || options.subcategoryId) {
      const classification = [{ ...(options.mealType ? { mealType: options.mealType } : {}), ...(options.subcategoryId ? { subcategoryId: options.subcategoryId } : {}) }]
      recipeQuery = recipeQuery.filter('classifications', 'cs', JSON.stringify(classification))
    }
    const from = (page - 1) * pageSize
    const { data, error, count } = await recipeQuery.range(from, from + pageSize - 1)
    if (error) throw new RecipeRepositoryError('not-found', 'Не вдалося завантажити рецепти.')
    const items = await this.summarizeRows((data ?? []) as unknown as RecipeRow[])
    const total = count ?? 0
    return { items, page, pageSize, total, hasNext: from + items.length < total }
  }

  async get(id: string): Promise<Recipe> {
    const [{ data: recipe, error: recipeError }, { data: ingredients, error: ingredientError }, { data: products, error: productError }] = await Promise.all([
      this.client.from('recipes').select('*').eq('id', id).maybeSingle(),
      this.client.from('recipe_ingredients').select('*').eq('recipe_id', id),
      this.client.from('products').select('*'),
    ])
    if (recipeError || ingredientError || productError || !recipe) throw new RecipeRepositoryError('not-found', 'Рецепт не знайдено')
    const row = recipe as unknown as RecipeRow
    const signedUrl = row.image_path ? await this.storage.imageUrl(row.image_path) : undefined
    return this.toRecipe(row, ingredients as unknown as IngredientRow[], new Map((products as unknown as ProductRow[]).map((product) => [product.id, product])), signedUrl)
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const ownerId = await currentUserId(this.client); this.assertValid(input)
    const id = crypto.randomUUID(); const path = input.image ? `${ownerId}/${id}.webp` : null; const now = new Date().toISOString()
    await this.assertUniqueName(normalizeRecipeName(input.name), ownerId)
    if (input.image && path) { assertImage(input.image); await this.uploadImage(path, input.image) }
    try {
      const ingredients = await this.prepareIngredients(input)
      const { error } = await this.client.from('recipes').insert(recipeInsert(id, ownerId, path, input, now))
      if (error) throw error
      const { error: ingredientsError } = await this.client.from('recipe_ingredients').insert(ingredients.map((ingredient) => ({ id: crypto.randomUUID(), recipe_id: id, ...ingredient })))
      if (ingredientsError) throw ingredientsError
    } catch (error) { if (path) await this.storage.remove(path); throw new RecipeRepositoryError('invalid-recipe', error instanceof Error ? error.message : 'Не вдалося зберегти рецепт.') }
    return this.get(id)
  }

  async createUploaded(id: string, input: CreateRecipeInput): Promise<Recipe> {
    const ownerId = await currentUserId(this.client)
    this.assertValid(input)
    if (input.image) assertUploadedImage(input.image, ownerId, id, 'create')
    const now = new Date().toISOString()
    await this.assertUniqueName(normalizeRecipeName(input.name), ownerId)
    try {
      const ingredients = await this.prepareIngredients(input)
      const { error } = await this.client.from('recipes').insert(recipeInsert(id, ownerId, input.image?.path ?? null, input, now))
      if (error) throw error
      const { error: ingredientsError } = await this.client.from('recipe_ingredients').insert(ingredients.map((ingredient) => ({ id: crypto.randomUUID(), recipe_id: id, ...ingredient })))
      if (ingredientsError) throw ingredientsError
    } catch (error) {
      if (input.image?.path) try { await this.storage.remove(input.image.path) } catch { /* The original validation error is more useful to the API caller. */ }
      throw new RecipeRepositoryError('invalid-recipe', error instanceof Error ? error.message : 'Не вдалося зберегти рецепт.')
    }
    return this.get(id)
  }

  async update(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    const actorId = await currentUserId(this.client); this.assertValid(input)
    const current = await this.get(id)
    if (current.isSystem && !this.isAdmin) throw new RecipeRepositoryError('forbidden', 'Системний рецепт не можна редагувати')
    if (!this.isAdmin && current.ownerId !== actorId) throw new RecipeRepositoryError('forbidden', 'Рецепт належить іншому користувачу')
    const ownerId = current.ownerId ?? actorId
    await this.assertUniqueName(normalizeRecipeName(input.name), ownerId, id)
    const nextPath = input.image
      ? current.isSystem && this.isAdmin
        ? `system/${id}-${Date.now()}.webp`
        : `${ownerId}/${id}-${Date.now()}.webp`
      : input.image === null ? null : current.image?.path ?? null
    if (input.image) { if (!nextPath) throw new RecipeRepositoryError('invalid-recipe', 'Не вдалося визначити фото рецепту'); assertImage(input.image); await this.uploadImage(nextPath, input.image) }
    const ingredients = await this.prepareIngredients(input)
    let query = this.client.from('recipes').update(recipeUpdatePreservingOwner(nextPath, input, current, new Date().toISOString())).eq('id', id)
    if (!this.isAdmin) query = query.eq('owner_id', actorId)
    const { error } = await query
    if (error) throw new RecipeRepositoryError('invalid-recipe', error.message)
    const { error: deleteError } = await this.client.from('recipe_ingredients').delete().eq('recipe_id', id)
    if (deleteError) throw new RecipeRepositoryError('invalid-recipe', deleteError.message)
    const { error: insertError } = await this.client.from('recipe_ingredients').insert(ingredients.map((ingredient) => ({ id: crypto.randomUUID(), recipe_id: id, ...ingredient })))
    if (insertError) throw new RecipeRepositoryError('invalid-recipe', insertError.message)
    return this.get(id)
  }

  async updateUploaded(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    const actorId = await currentUserId(this.client)
    this.assertValid(input)
    const current = await this.get(id)
    if (current.isSystem && !this.isAdmin) throw new RecipeRepositoryError('forbidden', 'Системний рецепт не можна редагувати')
    if (!this.isAdmin && current.ownerId !== actorId) throw new RecipeRepositoryError('forbidden', 'Рецепт належить іншому користувачу')
    if (!input.image?.path) throw new RecipeRepositoryError('invalid-recipe', 'Не вдалося визначити фото рецепту')
    assertUploadedImage(input.image, actorId, id, 'update', this.isAdmin)
    const ownerId = current.ownerId ?? actorId
    await this.assertUniqueName(normalizeRecipeName(input.name), ownerId, id)
    const ingredients = await this.prepareIngredients(input)
    let query = this.client.from('recipes').update(recipeUpdatePreservingOwner(input.image.path, input, current, new Date().toISOString())).eq('id', id)
    if (!this.isAdmin) query = query.eq('owner_id', actorId)
    const { error } = await query
    if (error) throw new RecipeRepositoryError('invalid-recipe', error.message)
    const { error: deleteError } = await this.client.from('recipe_ingredients').delete().eq('recipe_id', id)
    if (deleteError) throw new RecipeRepositoryError('invalid-recipe', deleteError.message)
    const { error: insertError } = await this.client.from('recipe_ingredients').insert(ingredients.map((ingredient) => ({ id: crypto.randomUUID(), recipe_id: id, ...ingredient })))
    if (insertError) throw new RecipeRepositoryError('invalid-recipe', insertError.message)
    return this.get(id)
  }

  async archive(id: string): Promise<void> {
    const ownerId = await currentUserId(this.client); const current = await this.get(id)
    if (current.isSystem && !this.isAdmin) throw new RecipeRepositoryError('forbidden', 'Системний рецепт не можна архівувати')
    if (!this.isAdmin && current.ownerId !== ownerId) throw new RecipeRepositoryError('forbidden', 'Рецепт належить іншому користувачу')
    let query = this.client.from('recipes').update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
    if (!this.isAdmin) query = query.eq('owner_id', ownerId)
    const { error } = await query
    if (error) throw new RecipeRepositoryError('not-found', error.message)
  }

  async remove(id: string): Promise<void> {
    if (!this.isAdmin) throw new RecipeRepositoryError('forbidden', 'Безповоротно видаляти рецепти може лише адміністратор')
    const current = await this.get(id)
    const { error } = await this.client.from('recipes').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') throw new RecipeRepositoryError('in-use', 'Рецепт використовується в плані харчування і не може бути видалений')
      throw new RecipeRepositoryError('invalid-recipe', error.message)
    }
    if (current.image?.path) {
      try { await this.storage.remove(current.image.path) } catch { /* Database deletion already succeeded. */ }
    }
  }

  private async prepareIngredients(input: Omit<CreateRecipeInput, 'image'> | UpdateRecipeInput) {
    const { data, error } = await this.client.from('products').select('*').in('id', input.ingredients.map((ingredient) => ingredient.productId))
    if (error) throw new RecipeRepositoryError('invalid-product', error.message)
    const products = data as unknown as ProductRow[]
    const productsById = new Map(products.map((product) => [product.id, product]))
    const uniqueProductIds = new Set(input.ingredients.map((ingredient) => ingredient.productId))
    if (uniqueProductIds.size !== input.ingredients.length || products.length !== input.ingredients.length || products.some((product) => product.archived_at)) throw new RecipeRepositoryError('invalid-product', 'Оберіть активний продукт')
    try { return input.ingredients.map((ingredient) => { const product = productsById.get(ingredient.productId); if (!product) throw new Error('product-not-found'); return { product_id: product.id, quantity_base: normalizeQuantity(ingredient.enteredQuantity, ingredient.enteredUnit, product.base_unit), entered_quantity: ingredient.enteredQuantity, entered_unit: ingredient.enteredUnit } }) }
    catch { throw new RecipeRepositoryError('invalid-product', 'Кількість або одиниця продукту несумісні') }
  }

  private async assertUniqueName(name: string, ownerId: string, exceptId?: string) {
    const { data, error } = await this.client.from('recipes').select('id').eq('owner_id', ownerId).eq('normalized_name', name).is('archived_at', null)
    if (error) throw new RecipeRepositoryError('invalid-recipe', error.message)
    if ((data ?? []).some((row) => row.id !== exceptId)) throw new RecipeRepositoryError('duplicate-name', 'Рецепт із такою назвою вже існує')
  }

  private async uploadImage(path: string, image: RecipeImageInput) {
    if (!image.blob) throw new RecipeRepositoryError('invalid-recipe', 'Додайте фото рецепту')
    try { await this.storage.upload(path, new Uint8Array(await image.blob.arrayBuffer()), image.mimeType) }
    catch (error) { throw new RecipeRepositoryError('invalid-recipe', `Не вдалося завантажити фото. ${error instanceof Error ? error.message : ''}`) }
  }

  private async summarizeRows(rows: RecipeRow[]): Promise<RecipeSummary[]> {
    const imageUrls = await Promise.all(rows.map((recipe) => recipe.image_path ? this.storage.imageUrl(recipe.image_path) : undefined))
    return rows.map((recipe, index) => this.toSummary(recipe, imageUrls[index]))
  }

  private toSummary(row: RecipeRow, signedUrl?: string): RecipeSummary {
    const classifications = Array.isArray(row.classifications) ? row.classifications : []
    return {
      id: row.id,
      ownerId: row.owner_id,
      isSystem: row.owner_id === null,
      name: row.name,
      preparationTimeMinMinutes: row.preparation_time_min_minutes,
      preparationTimeMaxMinutes: row.preparation_time_max_minutes,
      classifications: classifications as Recipe['classifications'],
      archivedAt: row.archived_at,
      image: row.image_path && row.image_mime_type && row.image_width && row.image_height && row.image_byte_size
        ? { path: row.image_path, url: signedUrl, mimeType: row.image_mime_type, width: row.image_width, height: row.image_height, byteSize: row.image_byte_size }
        : null,
    }
  }

  private toRecipe(row: RecipeRow, ingredients: IngredientRow[], products: Map<string, ProductRow>, signedUrl?: string): Recipe {
    const classifications = Array.isArray(row.classifications) ? row.classifications : []
    return { id: row.id, ownerId: row.owner_id, isSystem: row.owner_id === null, name: row.name, normalizedName: row.normalized_name, instructions: row.instructions, caloriesPerServing: asNumber(row.calories_per_serving), proteinGramsPerServing: asNumber(row.protein_grams_per_serving), fatGramsPerServing: asNumber(row.fat_grams_per_serving), carbsGramsPerServing: asNumber(row.carbs_grams_per_serving), preparationTimeMinMinutes: row.preparation_time_min_minutes, preparationTimeMaxMinutes: row.preparation_time_max_minutes, classifications: classifications as Recipe['classifications'], archivedAt: row.archived_at, createdAt: row.created_at, updatedAt: row.updated_at, image: row.image_path && row.image_mime_type && row.image_width && row.image_height && row.image_byte_size ? { path: row.image_path, url: signedUrl, mimeType: row.image_mime_type, width: row.image_width, height: row.image_height, byteSize: row.image_byte_size } : null, ingredients: ingredients.filter((ingredient) => ingredient.recipe_id === row.id).map((ingredient) => { const product = products.get(ingredient.product_id); if (!product) throw new RecipeRepositoryError('invalid-product', 'Продукт рецепту не знайдено'); return { id: ingredient.id, recipeId: row.id, productId: product.id, quantityBase: Number(ingredient.quantity_base), enteredQuantity: Number(ingredient.entered_quantity), enteredUnit: ingredient.entered_unit, productName: product.name, productBaseUnit: product.base_unit } }) }
  }

  private assertValid(input: CreateRecipeInput | UpdateRecipeInput) { if (hasRecipeValidationErrors(validateRecipeInput(input))) throw new RecipeRepositoryError('invalid-recipe', 'Некоректний рецепт') }
}

function assertImage(image: RecipeImageInput) { if (!image.blob || !image.mimeType.startsWith('image/') || image.width < 1 || image.height < 1 || image.byteSize < 1 || image.byteSize > 2 * 1024 * 1024) throw new RecipeRepositoryError('invalid-recipe', 'Некоректне фото рецепту') }
function assertUploadedImage(image: RecipeImageInput, userId: string, recipeId: string, mode: 'create' | 'update', isAdmin = false) { if (!image.path || !image.mimeType.startsWith('image/') || image.width < 1 || image.height < 1 || image.byteSize < 1 || image.byteSize > 2 * 1024 * 1024) throw new RecipeRepositoryError('invalid-recipe', 'Некоректне фото рецепту'); if (!isOwnedRecipeImagePath(userId, recipeId, image.path, mode) && !(isAdmin && (image.path.startsWith(`system/${recipeId}-`) || image.path.startsWith(`admin/${userId}/${recipeId}-`)))) throw new RecipeRepositoryError('invalid-recipe', 'Некоректний шлях фото рецепту') }
function escapeLikePattern(value: string): string { return value.replace(/[\\%_]/gu, '\\$&') }
function recipeUpdatePreservingOwner(path: string | null, input: UpdateRecipeInput, current: Recipe, now: string) { const image = input.image === undefined ? current.image : input.image; return { owner_id: current.ownerId ?? null, name: cleanName(input.name), normalized_name: normalizeRecipeName(input.name), image_path: path, image_mime_type: image?.mimeType ?? null, image_width: image?.width ?? null, image_height: image?.height ?? null, image_byte_size: image?.byteSize ?? null, instructions: input.instructions.trim(), calories_per_serving: input.caloriesPerServing, protein_grams_per_serving: input.proteinGramsPerServing, fat_grams_per_serving: input.fatGramsPerServing, carbs_grams_per_serving: input.carbsGramsPerServing, preparation_time_min_minutes: input.preparationTimeMinMinutes, preparation_time_max_minutes: input.preparationTimeMaxMinutes, classifications: uniqueClassifications(input.classifications), updated_at: now } }
function recipeInsert(id: string, ownerId: string, path: string | null, input: CreateRecipeInput | UpdateRecipeInput, now: string) { return { id, owner_id: ownerId, name: cleanName(input.name), normalized_name: normalizeRecipeName(input.name), image_path: path, image_mime_type: input.image?.mimeType ?? null, image_width: input.image?.width ?? null, image_height: input.image?.height ?? null, image_byte_size: input.image?.byteSize ?? null, instructions: input.instructions.trim(), calories_per_serving: input.caloriesPerServing, protein_grams_per_serving: input.proteinGramsPerServing, fat_grams_per_serving: input.fatGramsPerServing, carbs_grams_per_serving: input.carbsGramsPerServing, preparation_time_min_minutes: input.preparationTimeMinMinutes, preparation_time_max_minutes: input.preparationTimeMaxMinutes, classifications: uniqueClassifications(input.classifications), archived_at: null, created_at: now, updated_at: now } }
