import { use } from 'react'
import { RecipeSuggestionRepositoryContext } from './recipe-suggestion-repository-context'
import type { RecipeSuggestionRepository } from './recipe-suggestion-repository'

export function useRecipeSuggestionRepository(): RecipeSuggestionRepository {
  const repository = use(RecipeSuggestionRepositoryContext)
  if (!repository) throw new Error('RecipeSuggestionRepositoryProvider is missing')
  return repository
}
