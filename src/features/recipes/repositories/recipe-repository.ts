import type { CreateRecipeInput, Recipe, RecipeId, UpdateRecipeInput } from '../types.js'
import type { RecipeMealType } from '../domain/recipe-taxonomy.js'

export interface RecipeListOptions {
  page: number
  pageSize: number
  mealType?: RecipeMealType
  subcategoryId?: string
  uncategorized?: boolean
}

export interface RecipePage {
  items: Recipe[]
  page: number
  pageSize: number
  total: number
  hasNext: boolean
}

export interface RecipeRepository {
  list(query?: string): Promise<Recipe[]>
  listPage?(query: string, options: RecipeListOptions): Promise<RecipePage>
  get(id: RecipeId): Promise<Recipe>
  create(input: CreateRecipeInput): Promise<Recipe>
  update(id: RecipeId, input: UpdateRecipeInput): Promise<Recipe>
  archive(id: RecipeId): Promise<void>
}

export class RecipeRepositoryError extends Error {
  readonly code: 'invalid-recipe' | 'duplicate-name' | 'not-found' | 'invalid-product'

  constructor(code: 'invalid-recipe' | 'duplicate-name' | 'not-found' | 'invalid-product', message: string) {
    super(message)
    this.name = 'RecipeRepositoryError'
    this.code = code
  }
}
