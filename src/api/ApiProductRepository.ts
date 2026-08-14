import type { ProductRepository } from '../features/products/repositories/product-repository'
import type { CreateProductInput, Product, ProductId, ProductListOptions, UpdateProductInput } from '../features/products/types'
import { ApiClient } from './api-client'

export class ApiProductRepository implements ProductRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  create(input: CreateProductInput): Promise<Product> { return this.client.post<Product>('/api/products', input) }

  get(id: ProductId): Promise<Product> { return this.client.get<Product>(`/api/products/${encodeURIComponent(id)}`) }

  list(options: ProductListOptions = {}): Promise<Product[]> {
    const params = new URLSearchParams()
    if (options.query) params.set('query', options.query)
    if (options.category) params.set('category', options.category)
    if (options.includeArchived) params.set('includeArchived', 'true')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return this.client.get<Product[]>(`/api/products${suffix}`)
  }

  update(id: ProductId, input: UpdateProductInput): Promise<Product> { return this.client.patch<Product>(`/api/products/${encodeURIComponent(id)}`, input) }

  async archive(id: ProductId): Promise<void> { await this.client.delete(`/api/products/${encodeURIComponent(id)}`) }
}
