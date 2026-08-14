import type { BaseUnit } from '../products/domain/product'
import type { RecipeIngredientInput, RecipeInput } from './domain/recipe'
import type { RecipeClassification } from './domain/recipe-taxonomy'

export type RecipeId = string

export interface RecipeImageInput {
  blob?: Blob
  url?: string
  path?: string
  mimeType: string
  width: number
  height: number
  byteSize: number
}

export interface RecipeIngredient extends RecipeIngredientInput {
  id: string
  quantityBase: number
  productName: string
  productBaseUnit: BaseUnit
}

export interface Recipe {
  id: RecipeId
  name: string
  normalizedName: string
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
  image: RecipeImageInput
  ingredients: RecipeIngredient[]
  ownerId?: string | null
  isSystem?: boolean
}

export interface CreateRecipeInput extends RecipeInput {
  image: RecipeImageInput
}

export interface UpdateRecipeInput extends RecipeInput {
  image?: RecipeImageInput
}
