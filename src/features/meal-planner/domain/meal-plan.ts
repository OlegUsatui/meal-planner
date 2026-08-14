import type { BaseUnit } from '../../products/domain/product.js'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlanInput {
  date: string
  slot: MealSlot
  recipeId: string
  servings: number
}

export interface MealPlanValidationErrors {
  date?: string
  slot?: string
  recipeId?: string
  servings?: string
}

export function validateMealPlanInput(input: MealPlanInput): MealPlanValidationErrors {
  const errors: MealPlanValidationErrors = {}
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(input.date)) errors.date = 'Оберіть майбутню дату'
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(input.slot)) errors.slot = 'Оберіть коректний прийом їжі'
  if (!input.recipeId.trim()) errors.recipeId = 'Оберіть рецепт'
  if (!Number.isInteger(input.servings) || input.servings < 1 || input.servings > 99) errors.servings = 'Кількість порцій має бути від 1 до 99'
  return errors
}

export function isPastMealPlanDate(date: string, today: string): boolean {
  return date < today
}

export function scaleRecipeQuantity(quantityBase: number, plannedServings: number): number {
  return Math.round(quantityBase * plannedServings * 1000) / 1000
}

export function scaleNutrition(value: number | null, servings: number): number | null {
  return value === null ? null : Math.round(value * servings * 10) / 10
}

export function shiftDate(date: string, days: number): string {
  const value = parseLocalDate(date)
  value.setDate(value.getDate() + days)
  return formatLocalDate(value)
}

export function startOfWeek(date: string): string {
  const value = parseLocalDate(date)
  const offset = (value.getDay() + 6) % 7
  value.setDate(value.getDate() - offset)
  return formatLocalDate(value)
}

export function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index))
}

export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const mealSlots: Array<{ value: MealSlot; label: string }> = [
  { value: 'breakfast', label: 'Сніданок' },
  { value: 'lunch', label: 'Обід' },
  { value: 'dinner', label: 'Вечеря' },
  { value: 'snack', label: 'Перекус' },
]

export function unitLabel(unit: BaseUnit): string {
  return unit === 'pcs' ? 'шт' : unit
}
