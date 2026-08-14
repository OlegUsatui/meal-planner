import type { CreateRecipeInput, Recipe, RecipeId, UpdateRecipeInput } from '../types.js'

export interface RecipeRepository {
  list(query?: string): Promise<Recipe[]>
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
