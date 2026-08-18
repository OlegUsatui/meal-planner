import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeProductName, hasValidationErrors, validateProductInput } from '../features/products/domain/product.js'
import type { CreateProductInput, Product, ProductListOptions, UpdateProductInput } from '../features/products/types.js'
import { ProductRepositoryError, type ProductPage, type ProductRepository } from '../features/products/repositories/product-repository.js'
import { cleanName, currentUserId } from './common.js'

interface ProductRow { id: string; owner_id: string | null; name: string; normalized_name: string; category: string; base_unit: Product['baseUnit']; archived_at: string | null; created_at: string; updated_at: string }
interface IngredientRow { product_id: string }

export class SupabaseProductRepository implements ProductRepository {
  private readonly client: SupabaseClient
  private readonly isAdmin: boolean

  constructor(client: SupabaseClient, isAdmin = false) { this.client = client; this.isAdmin = isAdmin }

  async create(input: CreateProductInput): Promise<Product> {
    this.assertValid(input)
    const ownerId = await currentUserId(this.client)
    const normalizedName = normalizeProductName(input.name)
    await this.assertUniqueName(normalizedName, ownerId)
    const id = crypto.randomUUID(); const now = new Date().toISOString()
    const { error } = await this.client.from('products').insert({ id, owner_id: ownerId, name: cleanName(input.name), normalized_name: normalizedName, category: input.category.trim(), base_unit: input.baseUnit, created_at: now, updated_at: now })
    if (error) throw repositoryError(error.message, 'Не вдалося створити продукт.')
    return this.get(id)
  }

  async get(id: string): Promise<Product> {
    const { data, error } = await this.client.from('products').select('*').eq('id', id).maybeSingle()
    if (error || !data) throw new ProductRepositoryError('not-found', 'Продукт не знайдено')
    return this.toProduct(data as unknown as ProductRow, await this.usageCount(id))
  }

  async list(options: ProductListOptions = {}): Promise<Product[]> {
    const { data, error } = await this.client.from('products').select('*').order('name')
    if (error) throw repositoryError(error.message, 'Не вдалося завантажити продукти.')
    const query = options.query ? normalizeProductName(options.query) : ''
    const rows = (data as unknown as ProductRow[]).filter((row) => options.includeArchived || !row.archived_at).filter((row) => !query || row.normalized_name.includes(query)).filter((row) => !options.category || row.category === options.category)
    if (!rows.length) return []
    const { data: ingredients, error: ingredientsError } = await this.client.from('recipe_ingredients').select('product_id')
    if (ingredientsError) throw repositoryError(ingredientsError.message, 'Не вдалося завантажити використання продукту.')
    const counts = new Map<string, number>()
    for (const ingredient of ingredients as unknown as IngredientRow[]) counts.set(ingredient.product_id, (counts.get(ingredient.product_id) ?? 0) + 1)
    return rows.map((row) => this.toProduct(row, counts.get(row.id) ?? 0))
  }

  async listPage(options: ProductListOptions & { page: number; pageSize: number }): Promise<ProductPage> {
    const page = Math.max(1, options.page)
    const pageSize = Math.min(100, Math.max(1, options.pageSize))
    let productQuery = this.client.from('products').select('*', { count: 'exact' }).order('name')
    if (!options.includeArchived) productQuery = productQuery.is('archived_at', null)
    const query = options.query ? normalizeProductName(options.query) : ''
    if (query) productQuery = productQuery.ilike('normalized_name', `%${escapeLikePattern(query)}%`)
    if (options.category) productQuery = productQuery.eq('category', options.category)
    const from = (page - 1) * pageSize
    const { data, error, count } = await productQuery.range(from, from + pageSize - 1)
    if (error) throw repositoryError(error.message, 'Не вдалося завантажити продукти.')
    const rows = (data ?? []) as unknown as ProductRow[]
    if (!rows.length) return { items: [], page, pageSize, total: count ?? 0, hasNext: false }
    const { data: ingredients, error: ingredientsError } = await this.client.from('recipe_ingredients').select('product_id')
    if (ingredientsError) throw repositoryError(ingredientsError.message, 'Не вдалося завантажити використання продукту.')
    const counts = new Map<string, number>()
    for (const ingredient of ingredients as unknown as IngredientRow[]) counts.set(ingredient.product_id, (counts.get(ingredient.product_id) ?? 0) + 1)
    const total = count ?? 0
    return { items: rows.map((row) => this.toProduct(row, counts.get(row.id) ?? 0)), page, pageSize, total, hasNext: from + rows.length < total }
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    this.assertValid(input)
    const actorId = await currentUserId(this.client)
    const current = await this.get(id)
    if (current.isSystem && !this.isAdmin) throw new ProductRepositoryError('forbidden', 'Системний продукт не можна редагувати')
    if (!this.isAdmin && current.ownerId !== actorId) throw new ProductRepositoryError('forbidden', 'Продукт належить іншому користувачу')
    const ownerId = current.ownerId ?? actorId
    const normalizedName = normalizeProductName(input.name)
    await this.assertUniqueName(normalizedName, ownerId, id)
    const cleanInput = { name: cleanName(input.name), normalizedName, category: input.category.trim(), baseUnit: input.baseUnit }
    if (current.baseUnit !== input.baseUnit) {
      const { error } = await this.client.rpc('update_product_base_unit', {
        p_product_id: id,
        p_name: cleanInput.name,
        p_normalized_name: cleanInput.normalizedName,
        p_category: cleanInput.category,
        p_base_unit: cleanInput.baseUnit,
      })
      if (error) throw repositoryError(error.message, 'Не вдалося оновити продукт та пов’язані рецепти.')
    } else {
      let query = this.client.from('products').update({ name: cleanInput.name, normalized_name: cleanInput.normalizedName, category: cleanInput.category, base_unit: cleanInput.baseUnit, updated_at: new Date().toISOString() }).eq('id', id)
      if (!this.isAdmin) query = query.eq('owner_id', actorId)
      const { error } = await query
      if (error) throw repositoryError(error.message, 'Не вдалося оновити продукт.')
    }
    return this.get(id)
  }

  async archive(id: string): Promise<void> {
    const ownerId = await currentUserId(this.client); const current = await this.get(id)
    if (current.isSystem && !this.isAdmin) throw new ProductRepositoryError('forbidden', 'Системний продукт не можна архівувати')
    if (!this.isAdmin && current.ownerId !== ownerId) throw new ProductRepositoryError('forbidden', 'Продукт належить іншому користувачу')
    let query = this.client.from('products').update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
    if (!this.isAdmin) query = query.eq('owner_id', ownerId)
    const { error } = await query
    if (error) throw repositoryError(error.message, 'Не вдалося архівувати продукт.')
  }

  async restore(id: string): Promise<void> {
    const ownerId = await currentUserId(this.client); const current = await this.get(id)
    if (current.isSystem && !this.isAdmin) throw new ProductRepositoryError('forbidden', 'Системний продукт не можна відновлювати')
    if (!this.isAdmin && current.ownerId !== ownerId) throw new ProductRepositoryError('forbidden', 'Продукт належить іншому користувачу')
    let query = this.client.from('products').update({ archived_at: null, updated_at: new Date().toISOString() }).eq('id', id)
    if (!this.isAdmin) query = query.eq('owner_id', ownerId)
    const { error } = await query
    if (error) throw repositoryError(error.message, 'Не вдалося відновити продукт.')
  }

  async remove(id: string): Promise<void> {
    if (!this.isAdmin) throw new ProductRepositoryError('forbidden', 'Безповоротно видаляти продукти може лише адміністратор')
    await this.get(id)
    const { error } = await this.client.from('products').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') throw new ProductRepositoryError('in-use', 'Продукт використовується в рецептах і не може бути видалений')
      throw repositoryError(error.message, 'Не вдалося видалити продукт.')
    }
  }

  private toProduct(row: ProductRow, usageCount: number): Product {
    return { id: row.id, ownerId: row.owner_id, isSystem: row.owner_id === null, name: row.name, normalizedName: row.normalized_name, category: row.category, baseUnit: row.base_unit, archivedAt: row.archived_at, createdAt: row.created_at, updatedAt: row.updated_at, recipeUsageCount: usageCount, isBaseUnitLocked: usageCount > 0 }
  }

  private async usageCount(id: string): Promise<number> {
    const { data, error } = await this.client.from('recipe_ingredients').select('product_id').eq('product_id', id)
    if (error) throw repositoryError(error.message, 'Не вдалося завантажити використання продукту.')
    return (data as unknown as IngredientRow[]).length
  }

  private async assertUniqueName(normalizedName: string, ownerId: string | null, exceptId?: string): Promise<void> {
    let query = this.client.from('products').select('id').eq('normalized_name', normalizedName).is('archived_at', null)
    query = ownerId === null ? query.is('owner_id', null) : query.eq('owner_id', ownerId)
    const { data, error } = await query
    if (error) throw repositoryError(error.message, 'Не вдалося перевірити назву продукту.')
    if ((data ?? []).some((row) => row.id !== exceptId)) throw new ProductRepositoryError('duplicate-name', 'Активний продукт із такою назвою вже існує')
  }

  private assertValid(input: CreateProductInput | UpdateProductInput): void {
    if (hasValidationErrors(validateProductInput(input))) throw new ProductRepositoryError('invalid-product', 'Некоректний продукт')
  }
}

function repositoryError(details: string, fallback: string): ProductRepositoryError {
  return new ProductRepositoryError('invalid-product', `${fallback} ${details}`)
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}
