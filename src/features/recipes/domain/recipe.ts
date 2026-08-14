import type { DisplayUnit } from '../../products/domain/product'
import { isValidRecipeClassification, type RecipeClassification } from './recipe-taxonomy'

export interface RecipeIngredientInput {
  productId: string
  enteredQuantity: number
  enteredUnit: DisplayUnit
}

export interface RecipeInput {
  name: string
  instructions: string
  ingredients: RecipeIngredientInput[]
  caloriesPerServing: number | null
  proteinGramsPerServing: number | null
  fatGramsPerServing: number | null
  carbsGramsPerServing: number | null
  preparationTimeMinMinutes: number | null
  preparationTimeMaxMinutes: number | null
  classifications: RecipeClassification[]
}

export interface RecipeValidationErrors {
  name?: string
  instructions?: string
  ingredients?: string
  nutrition?: string
  preparationTime?: string
  classifications?: string
}

export function normalizeRecipeName(name: string): string {
  return name.trim().replace(/\s+/gu, ' ').toLocaleLowerCase('uk-UA')
}

export function scaleIngredientQuantity(quantityBase: number, servings: number): number {
  return Math.round(quantityBase * servings * 1000) / 1000
}

export function validateRecipeInput(input: RecipeInput): RecipeValidationErrors {
  const errors: RecipeValidationErrors = {}
  if (!input.name.trim()) errors.name = 'Вкажіть назву рецепту'
  else if (input.name.trim().length > 160) errors.name = 'Назва має містити до 160 символів'
  if (!input.instructions.trim()) errors.instructions = 'Додайте спосіб приготування'
  else if (input.instructions.trim().length > 10000) errors.instructions = 'Спосіб приготування має містити до 10 000 символів'
  if (!input.ingredients.length) errors.ingredients = 'Додайте хоча б один продукт'
  else if (new Set(input.ingredients.map((ingredient) => ingredient.productId)).size !== input.ingredients.length) errors.ingredients = 'Один продукт можна додати лише один раз'
  else if (input.ingredients.some((ingredient) => !Number.isFinite(ingredient.enteredQuantity) || ingredient.enteredQuantity <= 0)) errors.ingredients = 'Вкажіть кількість для кожного продукту'
  const nutrition = [input.caloriesPerServing, input.proteinGramsPerServing, input.fatGramsPerServing, input.carbsGramsPerServing]
  if (nutrition.some((value) => value !== null && (!Number.isFinite(value) || value < 0))) errors.nutrition = 'Поживні значення не можуть бути від’ємними'
  const preparationTimes = [input.preparationTimeMinMinutes, input.preparationTimeMaxMinutes]
  if (preparationTimes.some((value) => value !== null && (!Number.isInteger(value) || value < 0 || value > 1440))) errors.preparationTime = 'Час має бути від 0 до 1440 хвилин'
  else if ((input.preparationTimeMinMinutes === null) !== (input.preparationTimeMaxMinutes === null)) errors.preparationTime = 'Вкажіть обидві межі часу'
  else if (input.preparationTimeMinMinutes !== null && input.preparationTimeMaxMinutes !== null && input.preparationTimeMinMinutes > input.preparationTimeMaxMinutes) errors.preparationTime = 'Мінімальний час не може перевищувати максимальний'
  if (!input.classifications.length) errors.classifications = 'Оберіть хоча б одну категорію рецепту'
  else if (input.classifications.some((classification) => !isValidRecipeClassification(classification))) errors.classifications = 'Оберіть коректні категорії рецепту'
  else if (new Set(input.classifications.map((classification) => `${classification.mealType}:${classification.subcategoryId}`)).size !== input.classifications.length) errors.classifications = 'Категорії рецепту не повинні повторюватися'
  return errors
}

export function hasRecipeValidationErrors(errors: RecipeValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

export function formatPreparationTime(minimum: number | null, maximum: number | null): string | null {
  if (minimum === null || maximum === null) return null
  return minimum === maximum ? `${minimum} хв` : `${minimum}–${maximum} хв`
}
