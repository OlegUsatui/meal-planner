import type {
  CreateProductInput,
  Product,
  ProductId,
  ProductListOptions,
  UpdateProductInput,
} from '../types.js'

export interface ProductPage {
  items: Product[]
  page: number
  pageSize: number
  total: number
  hasNext: boolean
}

export interface ProductImportItem extends CreateProductInput {
  sourceKey: string
}

export interface ProductImportResult {
  created: number
  skipped: number
}

export interface ProductRepository {
  create(input: CreateProductInput): Promise<Product>
  importCatalog?(items: ProductImportItem[]): Promise<ProductImportResult>
  get(id: ProductId, signal?: AbortSignal): Promise<Product>
  list(options?: ProductListOptions, signal?: AbortSignal): Promise<Product[]>
  listPage?(options: ProductListOptions & { page: number; pageSize: number }, signal?: AbortSignal): Promise<ProductPage>
  update(id: ProductId, input: UpdateProductInput): Promise<Product>
  archive(id: ProductId): Promise<void>
  restore?(id: ProductId): Promise<void>
  remove?(id: ProductId): Promise<void>
}

export type ProductRepositoryErrorCode =
  | 'duplicate-name'
  | 'invalid-product'
  | 'not-found'
  | 'base-unit-locked'
  | 'forbidden'
  | 'in-use'

export class ProductRepositoryError extends Error {
  readonly code: ProductRepositoryErrorCode

  constructor(code: ProductRepositoryErrorCode, message: string) {
    super(message)
    this.name = 'ProductRepositoryError'
    this.code = code
  }
}
