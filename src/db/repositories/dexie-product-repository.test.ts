import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  it('propagates a base unit change to referenced recipe ingredients without changing numbers', async () => {
    const product = await repository.create({ name: 'Томати', category: 'Овочі', baseUnit: 'g' })
    await database.recipeIngredients.bulkAdd([
      { id: 'i-1', recipeId: 'r-1', productId: product.id, quantityBase: 100, enteredQuantity: 100, enteredUnit: 'g' },
      { id: 'i-2', recipeId: 'r-2', productId: product.id, quantityBase: 0.5, enteredQuantity: 0.5, enteredUnit: 'kg' },
    ])

    await repository.update(product.id, { name: product.name, category: product.category, baseUnit: 'ml' })

    expect((await database.products.get(product.id))?.baseUnit).toBe('ml')
    expect(await database.recipeIngredients.toArray()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'i-1', quantityBase: 100, enteredQuantity: 100, enteredUnit: 'ml' }),
      expect.objectContaining({ id: 'i-2', quantityBase: 0.5, enteredQuantity: 0.5, enteredUnit: 'ml' }),
    ]))
  })

  it('does not partially update a product when ingredient propagation fails', async () => {
    const product = await repository.create({ name: 'Томати', category: 'Овочі', baseUnit: 'g' })
    await database.recipeIngredients.add({ id: 'i', recipeId: 'r', productId: product.id, quantityBase: 100, enteredQuantity: 100, enteredUnit: 'g' })
    const bulkPut = vi.spyOn(database.recipeIngredients, 'bulkPut').mockRejectedValueOnce(new Error('simulated failure'))

    await expect(repository.update(product.id, { name: product.name, category: product.category, baseUnit: 'ml' })).rejects.toThrow('simulated failure')
    expect((await database.products.get(product.id))?.baseUnit).toBe('g')
    bulkPut.mockRestore()
  })
})
