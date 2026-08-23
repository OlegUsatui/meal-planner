import { describe, expect, it } from 'vitest'
import {
  isPastMealPlanDate,
  getWeekDates,
  startOfWeek,
  shiftDate,
  validateMealPlanInput,
} from './meal-plan'

describe('meal plan domain', () => {
  it('validates slots and dates', () => {
    expect(validateMealPlanInput({ date: '2026-08-14', slot: 'dinner', recipeId: 'r1' })).toEqual({})
    expect(validateMealPlanInput({ date: 'bad-date', slot: 'breakfast', recipeId: '' })).toEqual({
      date: 'Оберіть майбутню дату',
      recipeId: 'Оберіть рецепт',
    })
  })

  it('blocks dates before today', () => {
    expect(isPastMealPlanDate('2026-08-13', '2026-08-14')).toBe(true)
    expect(isPastMealPlanDate('2026-08-14', '2026-08-14')).toBe(false)
  })

  it('builds Monday-first weeks without UTC date drift', () => {
    expect(startOfWeek('2026-08-14')).toBe('2026-08-10')
    expect(getWeekDates('2026-08-10')).toEqual(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16'])
    expect(shiftDate('2026-08-10', 7)).toBe('2026-08-17')
  })

})
