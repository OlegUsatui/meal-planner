import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProductRepositoryProvider } from '../repositories/ProductRepositoryContext'
import type { ProductRepository } from '../repositories/product-repository'
import { ProductsPage } from './ProductsPage'

function renderPage(repository: ProductRepository) {
  const router = createMemoryRouter(
    [{ path: '/products', element: <ProductsPage /> }],
    { initialEntries: ['/products'] },
  )
  return render(
    <ProductRepositoryProvider repository={repository}>
      <RouterProvider router={router} />
    </ProductRepositoryProvider>,
  )
}

describe('ProductsPage', () => {
  it('explains the empty state and links to first product creation', async () => {
    const repository: ProductRepository = {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      archive: vi.fn(),
    }
    renderPage(repository)

    expect(
      await screen.findByRole('heading', { name: 'Створіть перший продукт' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Створити продукт' }),
    ).toHaveAttribute('href', '/products/new')
  })
})
