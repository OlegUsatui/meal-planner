import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('paginates the product catalogue through the repository page contract', async () => {
    const repository: ProductRepository = {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      listPage: vi.fn()
        .mockResolvedValueOnce({ items: [{ ...product('one', 'Перший') }], page: 1, pageSize: 24, total: 25, hasNext: true })
        .mockResolvedValueOnce({ items: [{ ...product('two', 'Другий') }], page: 2, pageSize: 24, total: 25, hasNext: false }),
      update: vi.fn(),
      archive: vi.fn(),
    }
    renderPage(repository)

    expect(await screen.findByRole('heading', { name: 'Перший', level: 2 })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Перейти на наступну сторінку' }))
    expect(await screen.findByRole('heading', { name: 'Другий', level: 2 })).toBeInTheDocument()
    expect(repository.listPage).toHaveBeenNthCalledWith(2, { includeArchived: false, query: '', page: 2, pageSize: 24 })
  })
})

function product(id: string, name: string) {
  return { id, name, normalizedName: name.toLowerCase(), category: 'Фрукти', baseUnit: 'g' as const, archivedAt: null, createdAt: 'now', updatedAt: 'now', recipeUsageCount: 0, isBaseUnitLocked: false }
}
