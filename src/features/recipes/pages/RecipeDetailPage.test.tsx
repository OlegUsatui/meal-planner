import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RecipeRepositoryProvider } from '../repositories/RecipeRepositoryContext'
import type { RecipeRepository } from '../repositories/recipe-repository'
import { MealPlanRepositoryProvider } from '../../meal-planner/repositories/MealPlanRepositoryContext'
import type { MealPlanRepository } from '../../meal-planner/types'
import { ProductRepositoryProvider } from '../../products/repositories/ProductRepositoryContext'
import type { ProductRepository } from '../../products/repositories/product-repository'
import type { Recipe } from '../types'
import { RecipeDetailPage } from './RecipeDetailPage'
import { QueryTestProvider } from '../../../shared/testing/QueryTestProvider'

describe('RecipeDetailPage', () => {
  const products: ProductRepository = { create: vi.fn(), get: vi.fn(), list: vi.fn().mockResolvedValue([]), update: vi.fn(), archive: vi.fn() }

  it('announces successful creation on the recipe detail page', async () => {
    const recipe: Recipe = { id: 'recipe-1', name: 'Рецепт без фото', normalizedName: 'рецепт без фото', instructions: 'Подати.', classifications: [], caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: null, ingredients: [] }
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlan: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    render(<QueryTestProvider><MemoryRouter initialEntries={['/recipes/recipe-1?created=1']}><RecipeRepositoryProvider repository={repository}><ProductRepositoryProvider repository={products}><MealPlanRepositoryProvider repository={mealPlan}><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></MealPlanRepositoryProvider></ProductRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider>)

    expect(await screen.findByText(/Рецепт створено/)).toBeInTheDocument()
  })

  it('shows a retryable error when the recipe cannot be loaded', async () => {
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockRejectedValue(new Error('network')), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlan: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    render(<QueryTestProvider><MemoryRouter initialEntries={['/recipes/recipe-1']}><RecipeRepositoryProvider repository={repository}><ProductRepositoryProvider repository={products}><MealPlanRepositoryProvider repository={mealPlan}><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></MealPlanRepositoryProvider></ProductRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider>)

    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити рецепт')
    expect(screen.getByRole('button', { name: 'Повторити' })).toBeInTheDocument()
  })

  it('adds the recipe to the plan from plan-selection context', async () => {
    const user = userEvent.setup()
    const recipe: Recipe = { id: 'recipe-1', name: 'Рисова миска', normalizedName: 'рисова миска', instructions: 'Змішати.', classifications: [], caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 20, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: { blob: new Blob(['image'], { type: 'image/webp' }), mimeType: 'image/webp', width: 10, height: 10, byteSize: 5 }, ingredients: [] }
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlan: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn().mockResolvedValue({}), remove: vi.fn() }
    const router = createMemoryRouter([{ path: '/recipes/:recipeId', element: <RecipeDetailPage /> }, { path: '/plan', element: <h1>План</h1> }], { initialEntries: ['/recipes/recipe-1?planDate=2026-08-15&planSlot=dinner&planServings=3&planMode=add'] })
    render(<QueryTestProvider><RecipeRepositoryProvider repository={repository}><ProductRepositoryProvider repository={products}><MealPlanRepositoryProvider repository={mealPlan}><RouterProvider router={router} /></MealPlanRepositoryProvider></ProductRepositoryProvider></RecipeRepositoryProvider></QueryTestProvider>)

    expect(await screen.findByRole('button', { name: 'Додати до плану' })).toBeInTheDocument()
    expect(screen.getByLabelText('Порцій')).toHaveValue('3')
    expect(screen.getByRole('heading', { name: 'На одну порцію' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Інгредієнти' })).toBeInTheDocument()
    expect(screen.getByText('400 ккал')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Збільшити кількість порцій' }))
    expect(screen.getByLabelText('Порцій')).toHaveValue('4')
    expect(screen.getByText('400 ккал')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Додати до плану' }))
    expect(mealPlan.upsert).toHaveBeenCalledWith({ date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-1', servings: 4 })
    expect(router.state.location.pathname).toBe('/plan')
    expect(router.state.location.search).toBe('?date=2026-08-15')
  })

  it('offers independent inline editing for every recipe block', async () => {
    const user = userEvent.setup()
    const recipe: Recipe = { id: 'recipe-1', name: 'Рисова миска', normalizedName: 'рисова миска', instructions: 'Змішати.', classifications: [{ mealType: 'dinner', subcategoryId: 'dinner-complete-plate' }], caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 20, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: null, ingredients: [] }
    let currentRecipe = recipe
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockImplementation(async () => currentRecipe), create: vi.fn(), update: vi.fn().mockImplementation(async (_id, input) => { currentRecipe = { ...currentRecipe, name: input.name }; return currentRecipe }), archive: vi.fn() }
    const mealPlan: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    render(<QueryTestProvider><MemoryRouter initialEntries={['/recipes/recipe-1']}><RecipeRepositoryProvider repository={repository}><ProductRepositoryProvider repository={products}><MealPlanRepositoryProvider repository={mealPlan}><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></MealPlanRepositoryProvider></ProductRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider>)

    expect(await screen.findByRole('heading', { name: 'Рисова миска' })).toBeInTheDocument()
    for (const label of ['Редагувати основну інформацію', 'Редагувати фото', 'Редагувати харчову цінність', 'Редагувати інгредієнти', 'Редагувати спосіб приготування']) expect(screen.getByRole('button', { name: label })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Редагувати основну інформацію' }))
    const name = screen.getByLabelText('Назва рецепту')
    await user.clear(name)
    await user.type(name, 'Нова миска')
    await user.click(screen.getByRole('button', { name: 'Зберегти основну інформацію' }))
    expect(repository.update).toHaveBeenCalledWith('recipe-1', expect.objectContaining({ name: 'Нова миска', instructions: 'Змішати.' }))
    expect(await screen.findByRole('heading', { name: 'Нова миска' })).toBeInTheDocument()
  })

  it('opens the photo editor in a modal and cancels without changing the recipe', async () => {
    const user = userEvent.setup()
    const recipe: Recipe = { id: 'recipe-1', name: 'Рецепт', normalizedName: 'рецепт', instructions: 'Подати.', classifications: [], caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: null, ingredients: [] }
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlan: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    render(<QueryTestProvider><MemoryRouter initialEntries={['/recipes/recipe-1']}><RecipeRepositoryProvider repository={repository}><ProductRepositoryProvider repository={products}><MealPlanRepositoryProvider repository={mealPlan}><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></MealPlanRepositoryProvider></ProductRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider>)

    await user.click(await screen.findByRole('button', { name: 'Редагувати фото' }))
    expect(screen.getByRole('dialog', { name: 'Редагування фото' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Скасувати редагування фото' }))
    expect(screen.queryByRole('dialog', { name: 'Редагування фото' })).not.toBeInTheDocument()
    expect(repository.update).not.toHaveBeenCalled()
  })
})
