import { describe, expect, it } from 'vitest'
import { moveMealPlanEntries } from './meal-plan-move'
import type { MealPlanEntry } from '../types'

const entry = (id: string, date: string, recipeId: string): MealPlanEntry => ({
  id,
  date,
  slot: 'breakfast',
  recipeId,
  createdAt: 'created',
  updatedAt: 'updated',
})

describe('meal plan move', () => {
  it('moves an entry into an empty target slot', () => {
    expect(moveMealPlanEntries(entry('source', '2026-08-15', 'recipe-a'), undefined, '2026-08-16', 'breakfast', '2026-08-14')).toEqual({
      source: { date: '2026-08-16', slot: 'breakfast', recipeId: 'recipe-a' },
      target: undefined,
    })
  })

  it('swaps entries when the target slot is occupied', () => {
    expect(moveMealPlanEntries(entry('source', '2026-08-15', 'recipe-a'), entry('target', '2026-08-16', 'recipe-b'), '2026-08-16', 'breakfast', '2026-08-14')).toEqual({
      source: { date: '2026-08-16', slot: 'breakfast', recipeId: 'recipe-a' },
      target: { date: '2026-08-15', slot: 'breakfast', recipeId: 'recipe-b' },
    })
  })

  it('rejects past targets and no-op moves', () => {
    expect(moveMealPlanEntries(entry('source', '2026-08-15', 'recipe-a'), undefined, '2026-08-15', 'breakfast', '2026-08-14')).toBeUndefined()
    expect(moveMealPlanEntries(entry('source', '2026-08-13', 'recipe-a'), undefined, '2026-08-15', 'breakfast', '2026-08-14')).toBeUndefined()
  })
})
