import { createContext } from 'react'
import type { ProductRepository } from './product-repository'

export const ProductRepositoryContext = createContext<ProductRepository | null>(null)
