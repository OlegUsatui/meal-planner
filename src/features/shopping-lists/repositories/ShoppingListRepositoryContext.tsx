import type { ReactNode } from 'react'
import type { ShoppingListRepository } from '../types'
import { ShoppingListRepositoryContext } from './shopping-list-repository-context'

export function ShoppingListRepositoryProvider({ repository, children }: { repository: ShoppingListRepository; children: ReactNode }) {
  return <ShoppingListRepositoryContext.Provider value={repository}>{children}</ShoppingListRepositoryContext.Provider>
}
