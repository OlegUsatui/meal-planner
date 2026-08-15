import type { ProductPage, ProductRepository } from '../features/products/repositories/product-repository'
import type { CreateProductInput, Product, ProductId, ProductListOptions, UpdateProductInput } from '../features/products/types'
import { ApiClient } from './api-client'

export class ApiProductRepository implements ProductRepository {
  private readonly client: ApiClient

  constructor(client: ApiClient) { this.client = client }

  create(input: CreateProductInput): Promise<Product> { return this.client.post<Product>('/api/products', input) }

  get(id: ProductId, signal?: AbortSignal): Promise<Product> {
    const path = `/api/products/${encodeURIComponent(id)}`
    return signal ? this.client.get<Product>(path, { signal }) : this.client.get<Product>(path)
  }

  list(options: ProductListOptions = {}, signal?: AbortSignal): Promise<Product[]> {
    const params = new URLSearchParams()
    if (options.query) params.set('query', options.query)
    if (options.category) params.set('category', options.category)
    if (options.includeArchived) params.set('includeArchived', 'true')
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const path = `/api/products${suffix}`
    return signal ? this.client.get<Product[]>(path, { signal }) : this.client.get<Product[]>(path)
  }

  listPage(options: ProductListOptions & { page: number; pageSize: number }, signal?: AbortSignal): Promise<ProductPage> {
    const params = new URLSearchParams({ page: String(options.page), pageSize: String(options.pageSize) })
    if (options.query) params.set('query', options.query)
    if (options.category) params.set('category', options.category)
    if (options.includeArchived) params.set('includeArchived', 'true')
    const path = `/api/products?${params.toString()}`
    return signal ? this.client.get<ProductPage>(path, { signal }) : this.client.get<ProductPage>(path)
  }

  update(id: ProductId, input: UpdateProductInput): Promise<Product> { return this.client.patch<Product>(`/api/products/${encodeURIComponent(id)}`, input) }

  async archive(id: ProductId): Promise<void> { await this.client.delete(`/api/products/${encodeURIComponent(id)}`) }

  async restore(id: ProductId): Promise<void> { await this.client.patch(`/api/products/${encodeURIComponent(id)}?action=restore`, {}) }

  async remove(id: ProductId): Promise<void> { await this.client.delete(`/api/products/${encodeURIComponent(id)}?permanent=true`) }
}
