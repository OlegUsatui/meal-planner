import { createContext } from 'react'
import type { RecipeSuggestionRepository } from './recipe-suggestion-repository'

export const RecipeSuggestionRepositoryContext = createContext<RecipeSuggestionRepository | null>(null)
