import type {
  CreateProductInput,
  Product,
  ProductId,
  ProductListOptions,
  UpdateProductInput,
} from '../types'

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
  get(id: ProductId): Promise<Product>
  list(options?: ProductListOptions): Promise<Product[]>
  update(id: ProductId, input: UpdateProductInput): Promise<Product>
  archive(id: ProductId): Promise<void>
}

export type ProductRepositoryErrorCode =
  | 'duplicate-name'
  | 'invalid-product'
  | 'not-found'
  | 'base-unit-locked'

export class ProductRepositoryError extends Error {
  readonly code: ProductRepositoryErrorCode

  constructor(code: ProductRepositoryErrorCode, message: string) {
    super(message)
    this.name = 'ProductRepositoryError'
    this.code = code
  }
}
