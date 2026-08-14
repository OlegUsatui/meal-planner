import type { ShoppingListItem } from '../features/shopping-lists/domain/shopping-list'
import type { ShoppingListRepository } from '../features/shopping-lists/types'
import { ApiClient } from './api-client'

export class ApiShoppingListRepository implements ShoppingListRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  list(today?: string): Promise<ShoppingListItem[]> { return this.client.get<ShoppingListItem[]>(today ? `/api/shopping-list?today=${encodeURIComponent(today)}` : '/api/shopping-list') }
}
