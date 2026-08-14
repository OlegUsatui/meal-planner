import { type ReactNode } from 'react'
import type { RecipeRepository } from './recipe-repository'
import { RecipeRepositoryContext } from './recipe-repository-context'

export function RecipeRepositoryProvider({ repository, children }: { repository: RecipeRepository; children: ReactNode }) {
  return <RecipeRepositoryContext value={repository}>{children}</RecipeRepositoryContext>
}
