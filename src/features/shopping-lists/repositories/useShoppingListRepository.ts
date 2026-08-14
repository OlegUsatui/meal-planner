import { useContext } from 'react'
import { ShoppingListRepositoryContext } from './shopping-list-repository-context'

export function useShoppingListRepository() {
  const repository = useContext(ShoppingListRepositoryContext)
  if (!repository) throw new Error('ShoppingListRepositoryProvider is missing')
  return repository
}
