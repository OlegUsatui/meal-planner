import { describe, expect, it } from 'vitest'
import { calculateDailyNutrition } from './daily-nutrition'

const recipe = { caloriesPerServing: 401.6, proteinGramsPerServing: 20.25, fatGramsPerServing: 10.12, carbsGramsPerServing: 50.05 }

describe('calculateDailyNutrition', () => {
  it('sums one serving of each planned recipe without using plan servings', () => {
    const result = calculateDailyNutrition([{ recipe }, { recipe: { ...recipe, caloriesPerServing: 100, proteinGramsPerServing: 5, fatGramsPerServing: 2, carbsGramsPerServing: 10 } }])
    expect(result).toEqual({ mealCount: 2, calories: 502, proteinGrams: 25.3, fatGrams: 12.1, carbsGrams: 60.1 })
  })
  it('returns an unavailable metric when a recipe value is missing', () => {
    const result = calculateDailyNutrition([{ recipe }, { recipe: { ...recipe, proteinGramsPerServing: null } }])
    expect(result.calories).toBe(803)
    expect(result.proteinGrams).toBeNull()
    expect(result.fatGrams).toBe(20.2)
  })
  it('returns an empty summary without displaying zero nutrition', () => {
    expect(calculateDailyNutrition([])).toEqual({ mealCount: 0, calories: null, proteinGrams: null, fatGrams: null, carbsGrams: null })
  })
})
