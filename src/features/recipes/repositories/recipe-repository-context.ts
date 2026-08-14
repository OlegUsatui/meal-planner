import { createContext } from 'react'
import type { RecipeRepository } from './recipe-repository'

export const RecipeRepositoryContext = createContext<RecipeRepository | null>(null)
