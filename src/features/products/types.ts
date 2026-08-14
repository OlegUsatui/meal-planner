import type { BaseUnit, ProductInput } from './domain/product.js'

export type ProductId = string

export interface Product {
  id: ProductId
  name: string
  normalizedName: string
  category: string
  baseUnit: BaseUnit
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  recipeUsageCount: number
  /** Derived UI flag; not persisted as a product field. */
  isBaseUnitLocked: boolean
  ownerId?: string | null
  isSystem?: boolean
}

export type CreateProductInput = ProductInput

export interface UpdateProductInput {
  name: string
  category: string
  baseUnit: BaseUnit
}

export interface ProductListOptions {
  includeArchived?: boolean
  query?: string
  category?: string
}
