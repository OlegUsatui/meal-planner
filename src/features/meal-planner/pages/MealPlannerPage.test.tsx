import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecipeRepository } from '../../recipes/repositories/recipe-repository'
import { RecipeRepositoryProvider } from '../../recipes/repositories/RecipeRepositoryContext'
import type { Recipe } from '../../recipes/types'
import { MealPlanRepositoryProvider } from '../repositories/MealPlanRepositoryContext'
import type { MealPlanRepository } from '../types'
import { MealPlannerPage } from './MealPlannerPage'
import { MealPlanEntryPage } from './MealPlanEntryPage'
import { QueryTestProvider } from '../../../shared/testing/QueryTestProvider'

const recipe: Recipe = { id: 'recipe-1', name: 'Рисова миска', normalizedName: 'рисова миска', instructions: 'Змішати все.', classifications: [{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }, { mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }, { mealType: 'dinner', subcategoryId: 'dinner-complete-plate' }, { mealType: 'snack', subcategoryId: 'snack-general' }], caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: { blob: new Blob(['image'], { type: 'image/webp' }), mimeType: 'image/webp', width: 200, height: 120, byteSize: 5 }, ingredients: [{ id: 'ingredient-1', productId: 'rice', productName: 'Рис', productBaseUnit: 'g', quantityBase: 100, enteredQuantity: 100, enteredUnit: 'g' }] }

describe('MealPlannerPage', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); vi.setSystemTime(new Date('2026-08-14T12:00:00')); vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('loads only the visible week and adds a recipe without leaving the calendar', async () => {
    const plan: MealPlanRepository = { list: vi.fn().mockResolvedValue([{ id: 'entry-1', date: '2026-08-14', slot: 'breakfast', recipeId: recipe.id, createdAt: 'now', updatedAt: 'now' }]), getByDateSlot: vi.fn(), upsert: vi.fn(), move: vi.fn(), remove: vi.fn().mockResolvedValue(undefined) }
    const recipes: RecipeRepository = { list: vi.fn().mockResolvedValue([recipe]), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const router = createMemoryRouter([{ path: '/plan', element: <MealPlannerPage /> }, { path: '/plan/add', element: <MealPlanEntryPage /> }, { path: '/recipes/:recipeId', element: <h1>Сторінка рецепту</h1> }], { initialEntries: ['/plan?date=2026-08-14'] })
    const { container } = render(<QueryTestProvider><RecipeRepositoryProvider repository={recipes}><MealPlanRepositoryProvider repository={plan}><RouterProvider router={router} /></MealPlanRepositoryProvider></RecipeRepositoryProvider></QueryTestProvider>)
    expect(await screen.findByRole('heading', { name: 'План харчування' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Новий рецепт' })).not.toBeInTheDocument()
    expect(container.querySelectorAll('.week-day')).toHaveLength(0)
    expect(container.querySelectorAll('.mobile-day-strip button')).toHaveLength(7)
    expect(plan.list).toHaveBeenCalledWith({ from: '2026-08-10', to: '2026-08-16' }, expect.any(AbortSignal))
    expect(container.querySelectorAll('.week-grid-day-header')).toHaveLength(7)
    router.navigate('/plan?date=2026-08-14')
    expect(await screen.findByRole('heading', { name: 'План харчування' })).toBeInTheDocument()
    expect(container.querySelectorAll('.week-grid-day-header')).toHaveLength(7)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByText('Порції')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Відкрити рецепт Рисова миска' }))
    expect(router.state.location.pathname).toBe('/recipes/recipe-1')
    router.navigate('/plan')
    expect(await screen.findByRole('heading', { name: 'План харчування' })).toBeInTheDocument()

    await waitFor(() => expect(screen.getAllByRole('button', { name: /Додати страву/ }).length).toBeGreaterThan(0))
    const add = screen.getAllByRole('button', { name: /Додати страву/ }).find((button) => !(button as HTMLButtonElement).disabled)
    expect(add).toBeDefined()
    await userEvent.click(add!)
    expect(router.state.location.pathname).toBe('/plan/add')
    expect(await screen.findByRole('heading', { name: 'Додати страву' })).toBeInTheDocument()
    expect(screen.queryByText('Обрана страва')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Рисова миска/ }).closest('.recipe-card')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити рецепт' })).toHaveAttribute('href', expect.stringContaining('/recipes/recipe-1'))
    expect(screen.queryByLabelText('Підкатегорія')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Кількість порцій')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Підкатегорії' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Додати до плану' })).not.toBeInTheDocument()
    const recipeCard = screen.getByRole('button', { name: /Рисова миска/ })
    await userEvent.click(recipeCard)
    expect(screen.getByRole('button', { name: 'Додати до плану' })).toHaveClass('meal-plan-entry-submit')
    await userEvent.click(screen.getByRole('button', { name: 'Сніданки з яєць' }))
    expect(screen.queryByRole('button', { name: 'Додати до плану' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Усі підкатегорії' }))
    const recipeCardAfterFilter = screen.getByRole('button', { name: /Рисова миска/ })
    await userEvent.click(recipeCardAfterFilter)
    expect(screen.getByRole('button', { name: 'Додати до плану' })).toBeInTheDocument()
    await userEvent.click(recipeCardAfterFilter)
    expect(screen.queryByRole('button', { name: 'Додати до плану' })).not.toBeInTheDocument()
    await userEvent.click(recipeCardAfterFilter)
    await userEvent.click(screen.getByRole('button', { name: 'Додати до плану' }))
    expect(plan.upsert).toHaveBeenCalledWith(expect.objectContaining({ recipeId: recipe.id }))
  })

  it('does not request full recipe details in week mode', async () => {
    const plan: MealPlanRepository = { list: vi.fn().mockResolvedValue([{ id: 'entry-1', date: '2026-08-14', slot: 'breakfast', recipeId: recipe.id, createdAt: 'now', updatedAt: 'now' }]), getByDateSlot: vi.fn(), upsert: vi.fn(), move: vi.fn(), remove: vi.fn() }
    const recipes: RecipeRepository = { list: vi.fn().mockResolvedValue([recipe]), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const router = createMemoryRouter([{ path: '/plan', element: <MealPlannerPage /> }], { initialEntries: ['/plan?date=2026-08-14&view=day'] })
    render(<QueryTestProvider><RecipeRepositoryProvider repository={recipes}><MealPlanRepositoryProvider repository={plan}><RouterProvider router={router} /></MealPlanRepositoryProvider></RecipeRepositoryProvider></QueryTestProvider>)

    expect(await screen.findByRole('heading', { name: 'План харчування' })).toBeInTheDocument()
    expect(recipes.get).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'День' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Тиждень' })).not.toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Тижневий план' })).toBeInTheDocument()
  })

  it('replaces and removes a planned meal with explicit confirmations', async () => {
    const plan: MealPlanRepository = { list: vi.fn().mockResolvedValue([{ id: 'entry-1', date: '2026-08-14', slot: 'breakfast', recipeId: recipe.id, createdAt: 'now', updatedAt: 'now' }]), getByDateSlot: vi.fn(), upsert: vi.fn().mockResolvedValue({}), move: vi.fn(), remove: vi.fn().mockResolvedValue(undefined) }
    const recipes: RecipeRepository = { list: vi.fn().mockResolvedValue([recipe]), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const router = createMemoryRouter([{ path: '/plan', element: <MealPlannerPage /> }, { path: '/plan/add', element: <MealPlanEntryPage /> }], { initialEntries: ['/plan?date=2026-08-14'] })
    render(<QueryTestProvider><RecipeRepositoryProvider repository={recipes}><MealPlanRepositoryProvider repository={plan}><RouterProvider router={router} /></MealPlanRepositoryProvider></RecipeRepositoryProvider></QueryTestProvider>)

    await userEvent.click(await screen.findByRole('button', { name: 'Дії для Рисова миска' }))
    await userEvent.click(screen.getByRole('button', { name: 'Замінити' }))
    expect(await screen.findByRole('heading', { name: 'Замінити страву' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Замінити в плані' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Замінити в плані' }))
    expect(plan.upsert).toHaveBeenCalledWith(expect.objectContaining({ recipeId: recipe.id }))
    router.navigate('/plan')
    await screen.findByRole('heading', { name: 'План харчування' })

    await userEvent.click(screen.getByRole('button', { name: 'Дії для Рисова миска' }))
    await userEvent.click(screen.getByRole('button', { name: 'Видалити' }))
    expect(screen.getByRole('dialog', { name: 'Видалити страву з плану?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Видалити з плану' }))
    expect(plan.remove).toHaveBeenCalledWith('entry-1')
  })
})
