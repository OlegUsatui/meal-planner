import { normalizeProductIds } from '../features/recipe-suggestions/domain/recipe-suggestions'
import type { RecipeSuggestionRepository } from '../features/recipe-suggestions/repositories/recipe-suggestion-repository'
import type { RecipeSummary } from '../features/recipes/types'
import { ApiClient } from './api-client'

export class ApiRecipeSuggestionRepository implements RecipeSuggestionRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  listByProductIds(productIds: string[], signal?: AbortSignal): Promise<RecipeSummary[]> {
    const selected = normalizeProductIds(productIds)
    const path = '/api/recipes?productIds=' + encodeURIComponent(selected.join(','))
    return signal ? this.client.get<RecipeSummary[]>(path, { signal }) : this.client.get<RecipeSummary[]>(path)
  }
}
