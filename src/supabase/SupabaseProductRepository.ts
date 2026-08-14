import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeProductName, hasValidationErrors, validateProductInput } from '../features/products/domain/product'
import type { CreateProductInput, Product, ProductListOptions, UpdateProductInput } from '../features/products/types'
import { ProductRepositoryError, type ProductRepository } from '../features/products/repositories/product-repository'
import { cleanName, currentUserId } from './common'

interface ProductRow { id: string; owner_id: string | null; name: string; normalized_name: string; category: string; base_unit: Product['baseUnit']; archived_at: string | null; created_at: string; updated_at: string }
interface IngredientRow { product_id: string }

export class SupabaseProductRepository implements ProductRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) { this.client = client }

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
    const { data: ingredients, error: ingredientsError } = await this.client.from('recipe_ingredients').select('product_id').in('product_id', rows.map((row) => row.id))
    if (ingredientsError) throw repositoryError(ingredientsError.message, 'Не вдалося завантажити використання продукту.')
    const counts = new Map<string, number>()
    for (const ingredient of ingredients as unknown as IngredientRow[]) counts.set(ingredient.product_id, (counts.get(ingredient.product_id) ?? 0) + 1)
    return rows.map((row) => this.toProduct(row, counts.get(row.id) ?? 0))
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    this.assertValid(input)
    const ownerId = await currentUserId(this.client)
    const current = await this.get(id)
    if (current.isSystem) throw new ProductRepositoryError('not-found', 'Системний продукт не можна редагувати')
    const normalizedName = normalizeProductName(input.name)
    await this.assertUniqueName(normalizedName, ownerId, id)
    if (current.baseUnit !== input.baseUnit && current.isBaseUnitLocked) throw new ProductRepositoryError('base-unit-locked', 'Одиницю продукту вже не можна змінити')
    const { error } = await this.client.from('products').update({ name: cleanName(input.name), normalized_name: normalizedName, category: input.category.trim(), base_unit: input.baseUnit, updated_at: new Date().toISOString() }).eq('id', id).eq('owner_id', ownerId)
    if (error) throw repositoryError(error.message, 'Не вдалося оновити продукт.')
    return this.get(id)
  }

  async archive(id: string): Promise<void> {
    const ownerId = await currentUserId(this.client); const current = await this.get(id)
    if (current.isSystem) throw new ProductRepositoryError('not-found', 'Системний продукт не можна архівувати')
    const { error } = await this.client.from('products').update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).eq('owner_id', ownerId)
    if (error) throw repositoryError(error.message, 'Не вдалося архівувати продукт.')
  }

  private toProduct(row: ProductRow, usageCount: number): Product {
    return { id: row.id, ownerId: row.owner_id, isSystem: row.owner_id === null, name: row.name, normalizedName: row.normalized_name, category: row.category, baseUnit: row.base_unit, archivedAt: row.archived_at, createdAt: row.created_at, updatedAt: row.updated_at, recipeUsageCount: usageCount, isBaseUnitLocked: usageCount > 0 }
  }

  private async usageCount(id: string): Promise<number> {
    const { data, error } = await this.client.from('recipe_ingredients').select('product_id').eq('product_id', id)
    if (error) throw repositoryError(error.message, 'Не вдалося завантажити використання продукту.')
    return (data as unknown as IngredientRow[]).length
  }

  private async assertUniqueName(normalizedName: string, ownerId: string, exceptId?: string): Promise<void> {
    const { data, error } = await this.client.from('products').select('id').eq('owner_id', ownerId).eq('normalized_name', normalizedName).is('archived_at', null)
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
