import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from './database'

describe('Dexie schema migration', () => {
  const names: string[] = []
  afterEach(async () => { for (const name of names.splice(0)) await Dexie.delete(name) })
  it('upgrades legacy records and removes obsolete stores', async () => {
    const name = `migration-${crypto.randomUUID()}`; names.push(name)
    const legacy = new Dexie(name)
    legacy.version(1).stores({ products: '&id, normalizedName, category, archivedAt, updatedAt', recipes: '&id, normalizedName, archivedAt, updatedAt, imageAssetId', recipeIngredients: '&id, recipeId, productId, &[recipeId+productId]', mealPlanEntries: '&id, &dateSlot, date, recipeId, status, planRevision', inventoryTransactions: '&id, productId, type, occurredAt, mealPlanEntryId, shoppingListItemId, &deduplicationKey', planMutations: '&revision, affectedDate, cause, occurredAt', shoppingLists: '&id, status, createdAt, rangeEnd, sourcePlanRevision', shoppingListItems: '&id, shoppingListId, productId, status, [shoppingListId+status]', imageAssets: '&id, createdAt', appSettings: '&id' })
    await legacy.open()
    await legacy.table('products').add({ id: 'p', name: 'Рис', normalizedName: 'рис', category: 'Крупи', baseUnit: 'g', packageQuantityBase: 1000, currentPriceOre: 100, archivedAt: null, createdAt: 'now', updatedAt: 'now' })
    await legacy.table('recipes').add({ id: 'r', name: 'Старий рецепт', normalizedName: 'старий рецепт', imageAssetId: 'image', baseServings: 2, instructions: 'Готувати', preparationTimeMinutes: 25, archivedAt: null, createdAt: 'now', updatedAt: 'now' })
    legacy.close()
    const upgraded = new MealPlannerDatabase(name)
    await upgraded.open()
    expect(upgraded.tables.map((table) => table.name)).not.toContain('inventoryTransactions')
    expect(await upgraded.products.get('p')).not.toHaveProperty('packageQuantityBase')
    expect(await upgraded.recipes.get('r')).toMatchObject({ classifications: [], preparationTimeMinMinutes: 25, preparationTimeMaxMinutes: 25 })
    expect(await upgraded.recipes.get('r')).not.toHaveProperty('preparationTimeMinutes')
    upgraded.close()
  })
})
