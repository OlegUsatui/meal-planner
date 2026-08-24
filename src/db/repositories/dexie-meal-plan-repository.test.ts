import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from '../database'
import { DexieMealPlanRepository } from './dexie-meal-plan-repository'

describe('DexieMealPlanRepository', () => {
  let database: MealPlannerDatabase
  beforeEach(() => { database = new MealPlannerDatabase(`plan-test-${crypto.randomUUID()}`) })
  afterEach(async () => { database.close(); await database.delete() })
  it('protects duplicate date-slot writes and past dates', async () => {
    const repository = new DexieMealPlanRepository(database, { now: () => '2026-08-14T00:00:00.000Z', id: () => 'entry-1', today: () => '2026-08-14' })
    await repository.upsert({ date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-a' })
    await repository.upsert({ date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-b' })
    expect(await repository.list()).toHaveLength(1)
    await expect(repository.upsert({ date: '2026-08-13', slot: 'lunch', recipeId: 'recipe-a' })).rejects.toMatchObject({ code: 'past-date' })
  })

  it('returns only entries inside an inclusive date range', async () => {
    const ids = ['entry-1', 'entry-2', 'entry-3']
    const repository = new DexieMealPlanRepository(database, { now: () => '2026-08-14T00:00:00.000Z', id: () => ids.shift() ?? 'entry-x', today: () => '2026-08-14' })
    await repository.upsert({ date: '2026-08-14', slot: 'breakfast', recipeId: 'recipe-a' })
    await repository.upsert({ date: '2026-08-20', slot: 'lunch', recipeId: 'recipe-b' })
    await repository.upsert({ date: '2026-08-21', slot: 'dinner', recipeId: 'recipe-c' })

    const entries = await repository.list({ from: '2026-08-14', to: '2026-08-20' })

    expect(entries.map((entry) => entry.date)).toEqual(['2026-08-14', '2026-08-20'])
  })

  it('moves an entry or swaps it with an occupied target atomically', async () => {
    const ids = ['source', 'target']
    const repository = new DexieMealPlanRepository(database, { now: () => '2026-08-14T00:00:00.000Z', id: () => ids.shift() ?? 'entry-x', today: () => '2026-08-14' })
    await repository.upsert({ date: '2026-08-15', slot: 'breakfast', recipeId: 'recipe-a' })
    await repository.upsert({ date: '2026-08-16', slot: 'breakfast', recipeId: 'recipe-b' })

    await repository.move('source', '2026-08-16', 'breakfast')

    expect(await repository.list()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'source', date: '2026-08-16', slot: 'breakfast', recipeId: 'recipe-a' }),
      expect.objectContaining({ id: 'target', date: '2026-08-15', slot: 'breakfast', recipeId: 'recipe-b' }),
    ]))
    await expect(repository.move('source', '2026-08-13', 'breakfast')).rejects.toMatchObject({ code: 'past-date' })
  })
})
