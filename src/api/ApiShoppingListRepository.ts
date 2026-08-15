import type { ShoppingListItem } from '../features/shopping-lists/domain/shopping-list'
import type { ShoppingListRange, ShoppingListRepository } from '../features/shopping-lists/types'
import { ApiClient } from './api-client'

export class ApiShoppingListRepository implements ShoppingListRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  list(range: ShoppingListRange, signal?: AbortSignal): Promise<ShoppingListItem[]> {
    const query = new URLSearchParams({ from: range.from })
    if (range.to) query.set('to', range.to)
    const path = `/api/shopping-list?${query.toString()}`
    return signal ? this.client.get<ShoppingListItem[]>(path, { signal }) : this.client.get<ShoppingListItem[]>(path)
  }
}
