import { createContext } from 'react'
import type { ShoppingListRepository } from '../types'

export const ShoppingListRepositoryContext = createContext<ShoppingListRepository | null>(null)
