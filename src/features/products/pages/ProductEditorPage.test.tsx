import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProductRepositoryProvider } from '../repositories/ProductRepositoryContext'
import { ProductRepositoryError, type ProductRepository } from '../repositories/product-repository'
import { ProductEditorPage } from './ProductEditorPage'
import { QueryTestProvider } from '../../../shared/testing/QueryTestProvider'

function repositoryStub(): ProductRepository {
  return {
    create: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  }
}

describe('ProductEditorPage', () => {
  it('navigates to the catalogue after successful creation', async () => {
    const repository = repositoryStub()
    vi.mocked(repository.create).mockResolvedValue({ id: 'product-1' } as never)
    const router = createMemoryRouter(
      [
        { path: '/products/new', element: <ProductEditorPage /> },
        { path: '/products', element: <h1>Каталог готовий</h1> },
      ],
      { initialEntries: ['/products/new'] },
    )
    render(
      <QueryTestProvider><ProductRepositoryProvider repository={repository}>
        <RouterProvider router={router} />
      </ProductRepositoryProvider></QueryTestProvider>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Назва продукту'), 'Гречка')
    await user.selectOptions(screen.getByLabelText('Категорія'), 'Крупи та макарони')
    await user.click(screen.getByRole('button', { name: 'Створити продукт' }))

    expect(await screen.findByRole('heading', { name: 'Каталог готовий' })).toBeInTheDocument()
  })

  it('shows a duplicate-name error without losing the form', async () => {
    const repository = repositoryStub()
    vi.mocked(repository.create).mockRejectedValue(
      new ProductRepositoryError('duplicate-name', 'duplicate'),
    )
    const router = createMemoryRouter(
      [{ path: '/products/new', element: <ProductEditorPage /> }],
      { initialEntries: ['/products/new'] },
    )
    render(
      <QueryTestProvider><ProductRepositoryProvider repository={repository}>
        <RouterProvider router={router} />
      </ProductRepositoryProvider></QueryTestProvider>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Назва продукту'), 'Гречка')
    await user.selectOptions(screen.getByLabelText('Категорія'), 'Крупи та макарони')
    await user.click(screen.getByRole('button', { name: 'Створити продукт' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Продукт із такою назвою вже існує',
    )
    expect(screen.getByLabelText('Назва продукту')).toHaveValue('Гречка')
  })

  it('shows archive impact and restores focus after Escape', async () => {
    const repository = repositoryStub()
    vi.mocked(repository.get).mockResolvedValue({
      id: 'milk',
      name: 'Молоко',
      normalizedName: 'молоко',
      category: 'Молочні продукти',
      baseUnit: 'ml',
      archivedAt: null,
      createdAt: '2026-08-11T18:00:00.000Z',
      updatedAt: '2026-08-11T18:00:00.000Z',
      isBaseUnitLocked: true,
      recipeUsageCount: 2,
    })
    const router = createMemoryRouter(
      [{ path: '/products/:productId', element: <ProductEditorPage /> }],
      { initialEntries: ['/products/milk'] },
    )
    render(
      <QueryTestProvider><ProductRepositoryProvider repository={repository}>
        <RouterProvider router={router} />
      </ProductRepositoryProvider></QueryTestProvider>,
    )
    const user = userEvent.setup()
    const archiveButton = await screen.findByRole('button', { name: 'Архівувати' })
    await user.click(archiveButton)

    expect(screen.getByRole('dialog')).toHaveTextContent('Рецептів: 2')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(archiveButton).toHaveFocus()
  })
})
