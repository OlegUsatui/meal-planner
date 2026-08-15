import type { ShoppingListItem } from './domain/shopping-list.js'

export interface ShoppingListRange {
  from: string
  to?: string
}

export interface ShoppingListRepository {
  list(range: ShoppingListRange, signal?: AbortSignal): Promise<ShoppingListItem[]>
}
