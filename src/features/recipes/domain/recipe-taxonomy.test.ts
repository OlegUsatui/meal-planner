import { describe, expect, it } from 'vitest'
import { isValidRecipeClassification, recipeAvailableForMealType, recipeSubcategories, uniqueClassifications } from './recipe-taxonomy'

describe('recipe taxonomy', () => {
  it('contains the fixed breakfast, lunch, dinner and snack taxonomy', () => {
    expect(recipeSubcategories.filter((item) => item.mealType === 'breakfast')).toHaveLength(11)
    expect(recipeSubcategories.filter((item) => item.mealType === 'lunch')).toHaveLength(13)
    expect(recipeSubcategories.filter((item) => item.mealType === 'dinner')).toHaveLength(11)
    expect(recipeSubcategories.filter((item) => item.mealType === 'snack')).toHaveLength(1)
  })

  it('validates pairs and removes exact duplicates', () => {
    expect(isValidRecipeClassification({ mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' })).toBe(true)
    expect(isValidRecipeClassification({ mealType: 'breakfast', subcategoryId: 'lunch-salad-bowls' })).toBe(false)
    expect(uniqueClassifications([{ mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }, { mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }])).toHaveLength(1)
  })

  it('makes legacy unclassified recipes available in every meal picker', () => {
    expect(recipeAvailableForMealType([], 'snack')).toBe(true)
    expect(recipeAvailableForMealType([{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }], 'lunch')).toBe(false)
  })
})
