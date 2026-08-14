import { type ReactNode } from 'react'
import { ProductRepositoryContext } from './product-repository-context'
import type { ProductRepository } from './product-repository'

export function ProductRepositoryProvider({
  repository,
  children,
}: {
  repository: ProductRepository
  children: ReactNode
}) {
  return (
    <ProductRepositoryContext value={repository}>
      {children}
    </ProductRepositoryContext>
  )
}
