import { type ReactNode } from 'react'
import type { RecipeSuggestionRepository } from './recipe-suggestion-repository'
import { RecipeSuggestionRepositoryContext } from './recipe-suggestion-repository-context'

export function RecipeSuggestionRepositoryProvider({ repository, children }: { repository: RecipeSuggestionRepository; children: ReactNode }) {
  return <RecipeSuggestionRepositoryContext value={repository}>{children}</RecipeSuggestionRepositoryContext>
}
