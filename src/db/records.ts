import type { BaseUnit, DisplayUnit } from '../features/products/domain/product'
import type { RecipeClassification } from '../features/recipes/domain/recipe-taxonomy'

export interface ProductRecord {
  id: string
  name: string
  normalizedName: string
  category: string
  baseUnit: BaseUnit
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RecipeRecord {
  id: string
  name: string
  normalizedName: string
  imageAssetId: string | null
  instructions: string
  caloriesPerServing: number | null
  proteinGramsPerServing: number | null
  fatGramsPerServing: number | null
  carbsGramsPerServing: number | null
  preparationTimeMinMinutes: number | null
  preparationTimeMaxMinutes: number | null
  classifications: RecipeClassification[]
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RecipeIngredientRecord {
  id: string
  recipeId: string
  productId: string
  quantityBase: number
  enteredQuantity: number
  enteredUnit: DisplayUnit
}

export interface MealPlanEntryRecord {
  id: string
  date: string
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  dateSlot: string
  recipeId: string
  servings: number
  createdAt: string
  updatedAt: string
}

export interface ImageAssetRecord {
  id: string
  blob: Blob
  mimeType: string
  width: number
  height: number
  byteSize: number
  createdAt: string
}

export interface AppSettingsRecord {
  id: 'app'
  locale: 'uk-UA'
  currency: 'NOK'
  firstDayOfWeek: 1
  onboardingCompleted: boolean
  lastOpenedDate: string | null
  createdAt: string
  updatedAt: string
  lunchPdfImportVersion?: string
  breakfastDinnerPdfImportVersion?: string
  recipeTitleRepairVersion?: string
}
