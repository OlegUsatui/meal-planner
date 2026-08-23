import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { QueryTestProvider } from '../../../shared/testing/QueryTestProvider'
import { ProductRepositoryProvider } from '../../products/repositories/ProductRepositoryContext'
import type { ProductRepository } from '../../products/repositories/product-repository'
import type { Product } from '../../products/types'
import { RecipeSuggestionRepositoryProvider } from '../repositories/RecipeSuggestionRepositoryContext'
import type { RecipeSuggestionRepository } from '../repositories/recipe-suggestion-repository'
import type { RecipeSummary } from '../../recipes/types'
import { CookPage } from './CookPage'

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>
}

function product(id: string, name: string): Product {
  return { id, name, normalizedName: name.toLocaleLowerCase('uk-UA'), category: 'Овочі та зелень', baseUnit: 'g', archivedAt: null, createdAt: 'now', updatedAt: 'now', recipeUsageCount: 0, isBaseUnitLocked: false }
}

function recipe(id: string, name: string): RecipeSummary {
  return { id, name, preparationTimeMinMinutes: 10, preparationTimeMaxMinutes: 10, classifications: [], archivedAt: null, image: null }
}

function productsRepository(products: Product[]): ProductRepository {
  return { create: vi.fn(), get: vi.fn(), list: vi.fn().mockResolvedValue(products), update: vi.fn(), archive: vi.fn() }
}

function renderPage(productRepository: ProductRepository, suggestionRepository: RecipeSuggestionRepository, initialEntries = ['/cook']) {
  return render(
    <QueryTestProvider>
      <ProductRepositoryProvider repository={productRepository}>
        <RecipeSuggestionRepositoryProvider repository={suggestionRepository}>
          <MemoryRouter initialEntries={initialEntries}><CookPage /><LocationProbe /></MemoryRouter>
        </RecipeSuggestionRepositoryProvider>
      </ProductRepositoryProvider>
    </QueryTestProvider>,
  )
}

describe('CookPage', () => {
  it('selects products, preserves the selection while searching, and loads matching recipes', async () => {
    const suggestionRepository: RecipeSuggestionRepository = { listByProductIds: vi.fn().mockResolvedValue([recipe('recipe-1', 'Омлет')]) }
    renderPage(productsRepository([product('egg', 'Яйця'), product('tomato', 'Помідори')]), suggestionRepository)

    expect(await screen.findByRole('heading', { name: 'Виберіть продукти' })).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Яйця' }))

    expect(await screen.findByRole('link', { name: /Омлет/ })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('?productIds=egg')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Пошук продуктів' }), 'помід')
    expect(screen.getByRole('checkbox', { name: 'Яйця' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Помідори' })).toBeInTheDocument()
    expect(suggestionRepository.listByProductIds).toHaveBeenCalledWith(['egg'], expect.any(AbortSignal))
  })

  it('shows the empty selection prompt and the no-results state', async () => {
    const suggestionRepository: RecipeSuggestionRepository = { listByProductIds: vi.fn().mockResolvedValue([]) }
    renderPage(productsRepository([product('egg', 'Яйця')]), suggestionRepository)

    expect(await screen.findByRole('heading', { name: 'Оберіть продукти у холодильнику' })).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Яйця' }))
    expect(await screen.findByRole('heading', { name: 'Рецептів не знайдено' })).toBeInTheDocument()
  })

  it('restores selected products from the URL and supports clearing them', async () => {
    const suggestionRepository: RecipeSuggestionRepository = { listByProductIds: vi.fn().mockResolvedValue([recipe('recipe-1', 'Омлет')]) }
    renderPage(productsRepository([product('egg', 'Яйця')]), suggestionRepository, ['/cook?productIds=egg'])

    expect(await screen.findByRole('link', { name: /Омлет/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Очистити вибір' }))
    expect(screen.getByTestId('location')).toHaveTextContent('')
    expect(screen.getByRole('heading', { name: 'Оберіть продукти у холодильнику' })).toBeInTheDocument()
  })
})
