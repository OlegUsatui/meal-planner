import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecipeRepositoryProvider } from '../repositories/RecipeRepositoryContext'
import type { RecipeRepository } from '../repositories/recipe-repository'
import type { Recipe } from '../types'
import { RecipesPage } from './RecipesPage'

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>
}

const base: Omit<Recipe, 'id' | 'name' | 'normalizedName' | 'classifications'> = { instructions: 'Готувати', caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: { blob: new Blob(['image']), mimeType: 'image/webp', width: 10, height: 10, byteSize: 5 }, ingredients: [] }

describe('RecipesPage categories', () => {
  beforeEach(() => { vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }) })
  afterEach(() => vi.unstubAllGlobals())
  it('filters meal types and keeps legacy recipes under uncategorized', async () => {
    const recipes: Recipe[] = [
      { ...base, id: 'b', name: 'Омлет', normalizedName: 'омлет', classifications: [{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }] },
      { ...base, id: 'l', name: 'Салат', normalizedName: 'салат', classifications: [{ mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }] },
      { ...base, id: 'old', name: 'Старий рецепт', normalizedName: 'старий рецепт', classifications: [] },
    ]
    const repository: RecipeRepository = { list: vi.fn().mockResolvedValue(recipes), get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    render(<MemoryRouter><RecipeRepositoryProvider repository={repository}><RecipesPage /></RecipeRepositoryProvider></MemoryRouter>)
    expect(await screen.findByText('Омлет')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Обід' }))
    expect(screen.getByText('Салат')).toBeInTheDocument()
    expect(screen.queryByText('Омлет')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Без категорії' }))
    expect(screen.getByText('Старий рецепт')).toBeInTheDocument()
  })

  it('shows a retryable error instead of an empty catalogue when loading fails', async () => {
    const repository: RecipeRepository = { list: vi.fn().mockRejectedValue(new Error('network')), get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    render(<MemoryRouter><RecipeRepositoryProvider repository={repository}><RecipesPage /></RecipeRepositoryProvider></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити рецепти')
    expect(screen.getByRole('button', { name: 'Повторити' })).toBeInTheDocument()
  })

  it('paginates the catalogue through the repository page contract', async () => {
    const repository: RecipeRepository = {
      list: vi.fn(), listPage: vi.fn()
        .mockResolvedValueOnce({ items: [{ ...base, id: 'one', name: 'Перший', normalizedName: 'перший', classifications: [] }], page: 1, pageSize: 24, total: 25, hasNext: true })
        .mockResolvedValueOnce({ items: [{ ...base, id: 'two', name: 'Другий', normalizedName: 'другий', classifications: [] }], page: 2, pageSize: 24, total: 25, hasNext: false }),
      get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(),
    }
    render(<MemoryRouter><RecipeRepositoryProvider repository={repository}><RecipesPage /></RecipeRepositoryProvider></MemoryRouter>)
    expect(await screen.findByText('Перший')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Перейти на наступну сторінку' }))
    expect(await screen.findByText('Другий')).toBeInTheDocument()
    expect(repository.listPage).toHaveBeenNthCalledWith(2, '', { page: 2, pageSize: 24 })
  })

  it('restores catalogue filters and page from the URL and resets page when searching', async () => {
    const repository: RecipeRepository = {
      list: vi.fn(), listPage: vi.fn().mockResolvedValue({ items: [], page: 2, pageSize: 24, total: 25, hasNext: false }),
      get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(),
    }
    render(<MemoryRouter initialEntries={['/recipes?q=суп&section=lunch&subcategory=lunch-soups&page=2']}><RecipeRepositoryProvider repository={repository}><RecipesPage /></RecipeRepositoryProvider><LocationProbe /></MemoryRouter>)

    expect(await screen.findByDisplayValue('суп')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('?q=суп&section=lunch&subcategory=lunch-soups&page=2')
    expect(repository.listPage).toHaveBeenCalledWith('суп', { page: 2, pageSize: 24, mealType: 'lunch', subcategoryId: 'lunch-soups' })
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Пошук рецептів' }))
    expect(screen.getByRole('searchbox', { name: 'Пошук рецептів' })).toHaveValue('')
    expect(screen.getByTestId('location')).toHaveTextContent('?section=lunch&subcategory=lunch-soups')
    expect(repository.listPage).toHaveBeenLastCalledWith('', { page: 1, pageSize: 24, mealType: 'lunch', subcategoryId: 'lunch-soups' })
  })

  it('keeps all subcategory options available in the filter panel', async () => {
    const repository: RecipeRepository = {
      list: vi.fn(), listPage: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 24, total: 0, hasNext: false }),
      get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(),
    }
    render(<MemoryRouter initialEntries={['/recipes?section=lunch']}><RecipeRepositoryProvider repository={repository}><RecipesPage /></RecipeRepositoryProvider></MemoryRouter>)

    const panel = await screen.findByRole('group', { name: 'Підкатегорії' })
    expect(panel).toHaveClass('recipe-subcategory-filters')
    expect(panel.querySelectorAll('button')).toHaveLength(14)
    expect(screen.getByRole('button', { name: 'Паста й локшина з білком' })).toBeInTheDocument()
  })

  it('locks plan selection to the requested meal type and excludes uncategorized recipes', async () => {
    const repository: RecipeRepository = {
      list: vi.fn(), listPage: vi.fn().mockResolvedValue({ items: [
        { ...base, id: 'breakfast', name: 'Сніданковий рецепт', normalizedName: 'сніданковий рецепт', classifications: [{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }] },
        { ...base, id: 'lunch', name: 'Обідній рецепт', normalizedName: 'обідній рецепт', classifications: [{ mealType: 'lunch', subcategoryId: 'lunch-soups' }] },
        { ...base, id: 'legacy', name: 'Старий рецепт', normalizedName: 'старий рецепт', classifications: [] },
      ], page: 1, pageSize: 24, total: 3, hasNext: false }),
      get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(),
    }
    render(<MemoryRouter initialEntries={['/recipes?planDate=2026-08-15&planSlot=breakfast&planServings=1&planMode=add&section=lunch']}><RecipeRepositoryProvider repository={repository}><RecipesPage /></RecipeRepositoryProvider></MemoryRouter>)

    expect(await screen.findByText('Сніданковий рецепт')).toBeInTheDocument()
    expect(screen.queryByText('Обідній рецепт')).not.toBeInTheDocument()
    expect(screen.queryByText('Старий рецепт')).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Прийом їжі' })).not.toBeInTheDocument()
    expect(repository.listPage).toHaveBeenCalledWith('', { page: 1, pageSize: 24, mealType: 'breakfast' })
    expect(screen.getByRole('link', { name: /Сніданковий рецепт/ })).toHaveAttribute('href', expect.stringContaining('section=breakfast'))
  })
})
