import { describe, expect, it } from 'vitest'
import {
  isPastMealPlanDate,
  scaleRecipeQuantity,
  getWeekDates,
  startOfWeek,
  shiftDate,
  scaleNutrition,
  validateMealPlanInput,
} from './meal-plan'

describe('meal plan domain', () => {
  it('validates slots, servings and dates', () => {
    expect(validateMealPlanInput({ date: '2026-08-14', slot: 'dinner', recipeId: 'r1', servings: 2 })).toEqual({})
    expect(validateMealPlanInput({ date: 'bad-date', slot: 'breakfast', recipeId: '', servings: 0 })).toEqual({
      date: 'Оберіть майбутню дату',
      recipeId: 'Оберіть рецепт',
      servings: 'Кількість порцій має бути від 1 до 99',
    })
  })

  it('blocks dates before today', () => {
    expect(isPastMealPlanDate('2026-08-13', '2026-08-14')).toBe(true)
    expect(isPastMealPlanDate('2026-08-14', '2026-08-14')).toBe(false)
  })

  it('scales an ingredient by planned servings', () => {
    expect(scaleRecipeQuantity(250, 5)).toBe(1250)
  })

  it('builds Monday-first weeks without UTC date drift', () => {
    expect(startOfWeek('2026-08-14')).toBe('2026-08-10')
    expect(getWeekDates('2026-08-10')).toEqual(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16'])
    expect(shiftDate('2026-08-10', 7)).toBe('2026-08-17')
  })

  it('scales optional nutrition without replacing missing values', () => {
    expect(scaleNutrition(12.5, 3)).toBe(37.5)
    expect(scaleNutrition(null, 3)).toBeNull()
  })
})
