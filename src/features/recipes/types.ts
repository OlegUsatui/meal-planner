import type { BaseUnit } from '../products/domain/product.js'
import type { RecipeIngredientInput, RecipeInput } from './domain/recipe.js'
import type { RecipeClassification } from './domain/recipe-taxonomy.js'

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

export interface RecipeSummary {
  id: RecipeId
  name: string
  preparationTimeMinMinutes: number | null
  preparationTimeMaxMinutes: number | null
  classifications: RecipeClassification[]
  archivedAt: string | null
  image: RecipeImageInput | null
  ownerId?: string | null
  isSystem?: boolean
}

export interface Recipe extends RecipeSummary {
  normalizedName: string
  instructions: string
  caloriesPerServing: number | null
  proteinGramsPerServing: number | null
  fatGramsPerServing: number | null
  carbsGramsPerServing: number | null
  createdAt: string
  updatedAt: string
  ingredients: RecipeIngredient[]
}

export interface CreateRecipeInput extends RecipeInput {
  image: RecipeImageInput | null
}

export interface UpdateRecipeInput extends RecipeInput {
  image?: RecipeImageInput | null
}
