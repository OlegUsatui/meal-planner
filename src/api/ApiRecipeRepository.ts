import type { RecipeRepository } from '../features/recipes/repositories/recipe-repository'
import type { CreateRecipeInput, Recipe, RecipeId, UpdateRecipeInput } from '../features/recipes/types'
import { ApiClient } from './api-client'

export class ApiRecipeRepository implements RecipeRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  async list(query = ''): Promise<Recipe[]> {
    const params = query ? `?query=${encodeURIComponent(query)}` : ''
    return this.client.get<Recipe[]>(`/api/recipes${params}`)
  }

  get(id: RecipeId): Promise<Recipe> { return this.client.get<Recipe>(`/api/recipes/${encodeURIComponent(id)}`) }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const id = crypto.randomUUID()
    const upload = await this.client.uploadRecipeImage(id, input.image, 'create')
    return this.client.post<Recipe>('/api/recipes', serializeInput(input, upload.path, id))
  }

  async update(id: RecipeId, input: UpdateRecipeInput): Promise<Recipe> {
    const upload = input.image?.blob ? await this.client.uploadRecipeImage(id, input.image, 'update') : undefined
    return this.client.patch<Recipe>(`/api/recipes/${encodeURIComponent(id)}`, serializeInput(input, upload?.path))
  }

  async archive(id: RecipeId): Promise<void> { await this.client.delete(`/api/recipes/${encodeURIComponent(id)}`) }
}

function serializeInput(input: CreateRecipeInput | UpdateRecipeInput, path?: string, id?: string): Record<string, unknown> {
  const { blob: _blob, url: _url, ...image } = input.image ?? {}
  return { ...(id ? { id } : {}), ...input, image: input.image ? { ...image, ...(path ? { path } : {}) } : undefined }
}
