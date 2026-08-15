import type { CreateRecipeInput, Recipe, RecipeId, RecipeSummary, UpdateRecipeInput } from '../types.js'
import type { RecipeMealType } from '../domain/recipe-taxonomy.js'

export interface RecipeListFilters {
  mealType?: RecipeMealType
  systemOnly?: boolean
}

export interface RecipeListOptions extends RecipeListFilters {
  page: number
  pageSize: number
  subcategoryId?: string
  uncategorized?: boolean
  includeArchived?: boolean
}

export interface RecipeSummaryPage {
  items: RecipeSummary[]
  page: number
  pageSize: number
  total: number
  hasNext: boolean
}

export interface RecipeRepository {
  list(query?: string, filters?: RecipeListFilters, signal?: AbortSignal): Promise<RecipeSummary[]>
  listPage?(query: string, options: RecipeListOptions, signal?: AbortSignal): Promise<RecipeSummaryPage>
  get(id: RecipeId, signal?: AbortSignal): Promise<Recipe>
  create(input: CreateRecipeInput): Promise<Recipe>
  update(id: RecipeId, input: UpdateRecipeInput): Promise<Recipe>
  archive(id: RecipeId): Promise<void>
  remove?(id: RecipeId): Promise<void>
}

/** @deprecated Use RecipeSummaryPage. */
export type RecipePage = RecipeSummaryPage

export class RecipeRepositoryError extends Error {
  readonly code: 'invalid-recipe' | 'duplicate-name' | 'not-found' | 'invalid-product' | 'forbidden' | 'in-use'

  constructor(code: 'invalid-recipe' | 'duplicate-name' | 'not-found' | 'invalid-product' | 'forbidden' | 'in-use', message: string) {
    super(message)
    this.name = 'RecipeRepositoryError'
    this.code = code
  }
}
