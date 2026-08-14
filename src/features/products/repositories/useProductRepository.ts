import { use } from 'react'
import { ProductRepositoryContext } from './product-repository-context'
import type { ProductRepository } from './product-repository'

export function useProductRepository(): ProductRepository {
  const repository = use(ProductRepositoryContext)
  if (!repository) {
    throw new Error('ProductRepositoryProvider is missing')
  }
  return repository
}
