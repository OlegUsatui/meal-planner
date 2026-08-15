import type { RecipeListFilters, RecipeListOptions, RecipeSummaryPage, RecipeRepository } from '../features/recipes/repositories/recipe-repository'
import type { CreateRecipeInput, Recipe, RecipeId, RecipeSummary, UpdateRecipeInput } from '../features/recipes/types'
import { ApiClient } from './api-client'

export class ApiRecipeRepository implements RecipeRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  async list(query = '', filters: RecipeListFilters = {}, signal?: AbortSignal): Promise<RecipeSummary[]> {
    const params = [query ? `query=${encodeURIComponent(query)}` : '', filters.mealType ? `mealType=${encodeURIComponent(filters.mealType)}` : '', filters.systemOnly ? 'systemOnly=true' : ''].filter(Boolean).join('&')
    const path = `/api/recipes${params ? `?${params}` : ''}`
    return signal ? this.client.get<RecipeSummary[]>(path, { signal }) : this.client.get<RecipeSummary[]>(path)
  }

  listPage(query: string, options: RecipeListOptions, signal?: AbortSignal): Promise<RecipeSummaryPage> {
    const params = [query ? `query=${encodeURIComponent(query)}` : '', `page=${options.page}`, `pageSize=${options.pageSize}`, options.mealType ? `mealType=${encodeURIComponent(options.mealType)}` : '', options.subcategoryId ? `subcategoryId=${encodeURIComponent(options.subcategoryId)}` : '', options.uncategorized ? 'uncategorized=true' : '', options.includeArchived ? 'includeArchived=true' : '', options.systemOnly ? 'systemOnly=true' : ''].filter(Boolean).join('&')
    const path = `/api/recipes?${params}`
    return signal ? this.client.get<RecipeSummaryPage>(path, { signal }) : this.client.get<RecipeSummaryPage>(path)
  }

  get(id: RecipeId, signal?: AbortSignal): Promise<Recipe> {
    const path = `/api/recipes/${encodeURIComponent(id)}`
    return signal ? this.client.get<Recipe>(path, { signal }) : this.client.get<Recipe>(path)
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const id = crypto.randomUUID()
    const upload = input.image ? await this.client.uploadRecipeImage(id, input.image, 'create') : undefined
    return this.client.post<Recipe>('/api/recipes', serializeInput(input, upload?.path, id))
  }

  async update(id: RecipeId, input: UpdateRecipeInput): Promise<Recipe> {
    const upload = input.image?.blob ? await this.client.uploadRecipeImage(id, input.image, 'update') : undefined
    return this.client.patch<Recipe>(`/api/recipes/${encodeURIComponent(id)}`, serializeInput(input, upload?.path))
  }

  async archive(id: RecipeId): Promise<void> { await this.client.delete(`/api/recipes/${encodeURIComponent(id)}`) }

  async remove(id: RecipeId): Promise<void> { await this.client.delete(`/api/recipes/${encodeURIComponent(id)}?permanent=true`) }
}

function serializeInput(input: CreateRecipeInput | UpdateRecipeInput, path?: string, id?: string): Record<string, unknown> {
  const { blob: _blob, url: _url, ...image } = input.image ?? {}
  return { ...(id ? { id } : {}), ...input, image: input.image ? { ...image, ...(path ? { path } : {}) } : input.image }
}
