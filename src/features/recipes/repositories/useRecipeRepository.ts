import { use } from 'react'
import { RecipeRepositoryContext } from './recipe-repository-context'
import type { RecipeRepository } from './recipe-repository'

export function useRecipeRepository(): RecipeRepository {
  const repository = use(RecipeRepositoryContext)
  if (!repository) throw new Error('RecipeRepositoryProvider is missing')
  return repository
}
