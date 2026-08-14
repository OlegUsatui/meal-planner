import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from '../database'
import { FIT_KITCHEN_CATALOG } from '../../features/products/import/fit-kitchen-catalog'
import { DexieProductRepository } from './dexie-product-repository'
describe('DexieProductRepository', () => {
  let database: MealPlannerDatabase; let repository: DexieProductRepository
  beforeEach(() => { database = new MealPlannerDatabase(`meal-planner-test-${crypto.randomUUID()}`); repository = new DexieProductRepository(database, { now: () => '2026-08-11T18:00:00.000Z', id: (() => { let n = 0; return () => `id-${++n}` })() }) })
  afterEach(async () => { database.close(); await database.delete() })
  it('creates minimal product data without stock writes', async () => { const product = await repository.create({ name: 'Рис', category: 'Крупи', baseUnit: 'g' }); expect(product).toMatchObject({ name: 'Рис', category: 'Крупи', baseUnit: 'g', recipeUsageCount: 0 }); expect(await database.products.toArray()).toHaveLength(1) })
  it('imports catalogue once without legacy fields', async () => { await expect(repository.importCatalog(FIT_KITCHEN_CATALOG)).resolves.toEqual({ created: 56, skipped: 0 }); expect(await database.products.count()).toBe(56); expect(await repository.list({ query: 'Buldak' })).toEqual([expect.objectContaining({ baseUnit: 'pcs' })]) })
  it('rejects duplicate names and archives', async () => { const product = await repository.create({ name: 'Молоко', category: 'Молочні', baseUnit: 'ml' }); await expect(repository.create({ name: ' молоко ', category: 'Інше', baseUnit: 'ml' })).rejects.toMatchObject({ code: 'duplicate-name' }); await repository.archive(product.id); expect(await repository.get(product.id)).toMatchObject({ archivedAt: '2026-08-11T18:00:00.000Z' }) })
  it('locks unit when used by a recipe', async () => { const product = await repository.create({ name: 'Томати', category: 'Овочі', baseUnit: 'g' }); await database.recipeIngredients.add({ id: 'i', recipeId: 'r', productId: product.id, quantityBase: 100, enteredQuantity: 100, enteredUnit: 'g' }); await expect(repository.update(product.id, { name: product.name, category: product.category, baseUnit: 'ml' })).rejects.toMatchObject({ code: 'base-unit-locked' }) })
})
