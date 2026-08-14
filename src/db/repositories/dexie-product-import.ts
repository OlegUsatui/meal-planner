import type { MealPlannerDatabase } from '../database'
import type { ProductImportItem, ProductImportResult } from '../../features/products/repositories/product-repository'
import { ProductRepositoryError } from '../../features/products/repositories/product-repository'
import { hasValidationErrors, normalizeProductName, validateProductInput } from '../../features/products/domain/product'

export interface ProductImportRuntime {
  now: () => string
}

export async function importProductCatalog(
  database: MealPlannerDatabase,
  items: ProductImportItem[],
  runtime: ProductImportRuntime,
): Promise<ProductImportResult> {
  return database.transaction('rw', database.products, async () => {
    let created = 0
    let skipped = 0

    for (const item of items) {
      const normalizedName = normalizeProductName(item.name)
      const existingById = await database.products.get(`fit-kitchen:${item.sourceKey}`)
      const existingByName = await database.products.where('normalizedName').equals(normalizedName).filter((record) => !record.archivedAt).first()
      if (existingById || existingByName) {
        skipped += 1
        continue
      }
      if (hasValidationErrors(validateProductInput(item))) {
        throw new ProductRepositoryError('invalid-product', `Некоректний імпортований продукт: ${item.name}`)
      }

      const now = runtime.now()
      const productId = `fit-kitchen:${item.sourceKey}`
      await database.products.add({
        id: productId,
        name: item.name.trim().replace(/\s+/gu, ' '),
        normalizedName,
        category: item.category.trim(),
        baseUnit: item.baseUnit,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      created += 1
    }

    return { created, skipped }
  })
}
