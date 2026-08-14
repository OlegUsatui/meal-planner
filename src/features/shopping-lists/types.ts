import type { ShoppingListItem } from './domain/shopping-list.js'

export interface ShoppingListRepository {
  list(today?: string): Promise<ShoppingListItem[]>
}
