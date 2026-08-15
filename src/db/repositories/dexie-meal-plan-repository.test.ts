import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MealPlannerDatabase } from '../database'
import { DexieMealPlanRepository } from './dexie-meal-plan-repository'

describe('DexieMealPlanRepository', () => {
  let database: MealPlannerDatabase
  beforeEach(() => { database = new MealPlannerDatabase(`plan-test-${crypto.randomUUID()}`) })
  afterEach(async () => { database.close(); await database.delete() })
  it('protects duplicate date-slot writes and past dates', async () => {
    const repository = new DexieMealPlanRepository(database, { now: () => '2026-08-14T00:00:00.000Z', id: () => 'entry-1', today: () => '2026-08-14' })
    await repository.upsert({ date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-a', servings: 2 })
    await repository.upsert({ date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-b', servings: 3 })
    expect(await repository.list()).toHaveLength(1)
    await expect(repository.upsert({ date: '2026-08-13', slot: 'lunch', recipeId: 'recipe-a', servings: 1 })).rejects.toMatchObject({ code: 'past-date' })
  })

  it('returns only entries inside an inclusive date range', async () => {
    const ids = ['entry-1', 'entry-2', 'entry-3']
    const repository = new DexieMealPlanRepository(database, { now: () => '2026-08-14T00:00:00.000Z', id: () => ids.shift() ?? 'entry-x', today: () => '2026-08-14' })
    await repository.upsert({ date: '2026-08-14', slot: 'breakfast', recipeId: 'recipe-a', servings: 1 })
    await repository.upsert({ date: '2026-08-20', slot: 'lunch', recipeId: 'recipe-b', servings: 2 })
    await repository.upsert({ date: '2026-08-21', slot: 'dinner', recipeId: 'recipe-c', servings: 3 })

    const entries = await repository.list({ from: '2026-08-14', to: '2026-08-20' })

    expect(entries.map((entry) => entry.date)).toEqual(['2026-08-14', '2026-08-20'])
  })
})
