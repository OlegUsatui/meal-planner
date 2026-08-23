import type { RecipeSummary } from '../../recipes/types'

export interface RecipeSuggestionRepository {
  listByProductIds(productIds: string[], signal?: AbortSignal): Promise<RecipeSummary[]>
}
