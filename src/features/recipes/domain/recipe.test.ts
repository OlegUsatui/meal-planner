import { describe, expect, it } from 'vitest'
import { formatPreparationTime, scaleIngredientQuantity, validateRecipeInput } from './recipe'

describe('recipe domain', () => {
  it('scales an ingredient without changing its stored base quantity', () => {
    expect(scaleIngredientQuantity(150, 3)).toBe(450)
    expect(scaleIngredientQuantity(150, 1)).toBe(150)
  })

  it('reports missing recipe fields and duplicate products', () => {
    expect(validateRecipeInput({
      name: ' ',
      instructions: ' ',
      ingredients: [
        { productId: 'rice', enteredQuantity: 100, enteredUnit: 'g' },
        { productId: 'rice', enteredQuantity: 100, enteredUnit: 'g' },
      ],
      caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null,
      classifications: [],
    })).toEqual({
      name: 'Вкажіть назву рецепту',
      instructions: 'Додайте спосіб приготування',
      ingredients: 'Один продукт можна додати лише один раз',
      classifications: 'Оберіть хоча б одну категорію рецепту',
    })
  })

  it('accepts optional per-serving nutrition and validates preparation time', () => {
    const base = { name: 'Суп', instructions: 'Зварити', ingredients: [{ productId: 'rice', enteredQuantity: 100, enteredUnit: 'g' as const }], caloriesPerServing: 450, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 55, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 30, classifications: [{ mealType: 'lunch' as const, subcategoryId: 'lunch-protein-soups' }] }
    expect(validateRecipeInput(base)).toEqual({})
    expect(validateRecipeInput({ ...base, preparationTimeMaxMinutes: 1441 })).toMatchObject({ preparationTime: 'Час має бути від 0 до 1440 хвилин' })
    expect(validateRecipeInput({ ...base, preparationTimeMinMinutes: 31 })).toMatchObject({ preparationTime: 'Мінімальний час не може перевищувати максимальний' })
    expect(formatPreparationTime(20, 30)).toBe('20–30 хв')
    expect(formatPreparationTime(25, 25)).toBe('25 хв')
    expect(formatPreparationTime(null, null)).toBeNull()
  })
})
