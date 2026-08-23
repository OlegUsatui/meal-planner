import { afterEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from './database'
import { exportBackup, importBackup } from './backup'

describe('local backup', () => {
  const databases: MealPlannerDatabase[] = []
  afterEach(async () => { for (const db of databases) { db.close(); await db.delete() } })

  it('round-trips records and image blobs', async () => {
    const source = new MealPlannerDatabase(`backup-source-${crypto.randomUUID()}`)
    const target = new MealPlannerDatabase(`backup-target-${crypto.randomUUID()}`)
    databases.push(source, target)
    const now = new Date().toISOString()
    await source.products.add({ id: 'p', name: 'Рис', normalizedName: 'рис', category: 'Крупи', baseUnit: 'g', archivedAt: null, createdAt: now, updatedAt: now })
    await source.imageAssets.add({ id: 'i', blob: new Blob(['photo'], { type: 'image/png' }), mimeType: 'image/png', width: 1, height: 1, byteSize: 5, createdAt: now })
    const json = await exportBackup(source)
    await importBackup(target, json)
    expect(await target.products.get('p')).toMatchObject({ name: 'Рис' })
    expect(await target.imageAssets.get('i')).toMatchObject({ mimeType: 'image/png', byteSize: 5 })
  })

  it('rejects malformed backups without changing data', async () => {
    const db = new MealPlannerDatabase(`backup-invalid-${crypto.randomUUID()}`)
    databases.push(db)
    await expect(importBackup(db, '{"version":99}')).rejects.toThrow('Некоректна резервна копія')
  })

  it('drops legacy meal-plan servings when importing an old backup record', async () => {
    const source = new MealPlannerDatabase(`backup-legacy-source-${crypto.randomUUID()}`)
    const target = new MealPlannerDatabase(`backup-legacy-target-${crypto.randomUUID()}`)
    databases.push(source, target)
    await source.mealPlanEntries.add({ id: 'entry', date: '2026-08-30', slot: 'dinner', dateSlot: '2026-08-30:dinner', recipeId: 'recipe', createdAt: 'now', updatedAt: 'now' })
    const parsed = JSON.parse(await exportBackup(source)) as { mealPlanEntries: Array<Record<string, unknown>> }
    parsed.mealPlanEntries[0]!.servings = 4

    await importBackup(target, JSON.stringify(parsed))
    expect(await target.mealPlanEntries.get('entry')).not.toHaveProperty('servings')
  })
})
