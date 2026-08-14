import type { ShoppingListItem } from './domain/shopping-list'

export interface ShoppingListRepository {
  list(today?: string): Promise<ShoppingListItem[]>
}
