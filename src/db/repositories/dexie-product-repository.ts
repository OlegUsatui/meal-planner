import type { MealPlannerDatabase } from '../database'
import type { ProductRecord } from '../records'
import { hasValidationErrors, normalizeProductName, validateProductInput } from '../../features/products/domain/product'
import { importProductCatalog } from './dexie-product-import'
import {
  ProductRepositoryError,
  type ProductImportItem,
  type ProductImportResult,
  type ProductRepository,
} from '../../features/products/repositories/product-repository'
import type { CreateProductInput, Product, ProductListOptions, UpdateProductInput } from '../../features/products/types'

interface RepositoryRuntime {
  now: () => string
  id: () => string
}

const defaultRuntime: RepositoryRuntime = {
  now: () => new Date().toISOString(),
  id: () => crypto.randomUUID(),
}

export class DexieProductRepository implements ProductRepository {
  private readonly database: MealPlannerDatabase
  private readonly runtime: RepositoryRuntime

  constructor(database: MealPlannerDatabase, runtime: RepositoryRuntime = defaultRuntime) {
    this.database = database
    this.runtime = runtime
  }

  async create(input: CreateProductInput): Promise<Product> {
    this.assertValid(input)
    const normalizedName = normalizeProductName(input.name)
    const id = this.runtime.id()
    await this.database.transaction('rw', this.database.products, async () => {
      await this.assertUniqueName(normalizedName)
      const now = this.runtime.now()
      await this.database.products.add({
        id,
        name: cleanName(input.name),
        normalizedName,
        category: input.category.trim(),
        baseUnit: input.baseUnit,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      })
    })
    return this.get(id)
  }

  async importCatalog(items: ProductImportItem[]): Promise<ProductImportResult> {
    return importProductCatalog(this.database, items, this.runtime)
  }

  async get(id: string): Promise<Product> {
    const record = await this.database.products.get(id)
    if (!record) throw new ProductRepositoryError('not-found', 'Продукт не знайдено')
    return this.toProduct(record)
  }

  async list(options: ProductListOptions = {}): Promise<Product[]> {
    const query = options.query ? normalizeProductName(options.query) : ''
    const records = (await this.database.products.toArray())
      .filter((record) => options.includeArchived || !record.archivedAt)
      .filter((record) => !query || record.normalizedName.includes(query))
      .filter((record) => !options.category || record.category === options.category)
      .sort((left, right) => left.name.localeCompare(right.name, 'uk-UA', { sensitivity: 'base' }))
    return Promise.all(records.map((record) => this.toProduct(record)))
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    this.assertValid(input)
    const normalizedName = normalizeProductName(input.name)
    await this.database.transaction('rw', this.database.products, this.database.recipeIngredients, async () => {
      const current = await this.database.products.get(id)
      if (!current) throw new ProductRepositoryError('not-found', 'Продукт не знайдено')
      await this.assertUniqueName(normalizedName, id)
      if (current.baseUnit !== input.baseUnit && await this.isUnitLocked(id)) {
        throw new ProductRepositoryError('base-unit-locked', 'Одиницю продукту вже не можна змінити')
      }
      await this.database.products.update(id, {
        name: cleanName(input.name),
        normalizedName,
        category: input.category.trim(),
        baseUnit: input.baseUnit,
        updatedAt: this.runtime.now(),
      })
    })
    return this.get(id)
  }

  async archive(id: string): Promise<void> {
    const changed = await this.database.products.update(id, {
      archivedAt: this.runtime.now(),
      updatedAt: this.runtime.now(),
    })
    if (!changed) throw new ProductRepositoryError('not-found', 'Продукт не знайдено')
  }

  private assertValid(input: CreateProductInput): void {
    if (hasValidationErrors(validateProductInput(input))) {
      throw new ProductRepositoryError('invalid-product', 'Некоректний продукт')
    }
  }

  private async assertUniqueName(normalizedName: string, exceptId?: string): Promise<void> {
    const matches = await this.database.products.where('normalizedName').equals(normalizedName).toArray()
    if (matches.some((record) => !record.archivedAt && record.id !== exceptId)) {
      throw new ProductRepositoryError('duplicate-name', 'Активний продукт із такою назвою вже існує')
    }
  }

  private async isUnitLocked(productId: string): Promise<boolean> {
    return (await this.database.recipeIngredients.where({ productId }).count()) > 0
  }

  private async toProduct(record: ProductRecord): Promise<Product> {
    const recipeUsageCount = await this.database.recipeIngredients.where({ productId: record.id }).count()
    return { ...record, recipeUsageCount, isBaseUnitLocked: recipeUsageCount > 0, ownerId: null, isSystem: false }
  }
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/gu, ' ')
}
