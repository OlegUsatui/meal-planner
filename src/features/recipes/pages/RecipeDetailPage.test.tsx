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
    expect(screen.queryByLabelText('Порцій')).not.toBeInTheDocument()
    expect(screen.queryByText('Харчова цінність')).not.toBeInTheDocument()
    expect(screen.queryByText('Орієнтовно')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Інгредієнти:' })).toBeInTheDocument()
    expect(screen.getByText('400 ккал')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Редагувати рецепт' }))
    expect(screen.queryByRole('button', { name: 'Додати до плану' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Скасувати' }))
    expect(screen.getByRole('button', { name: 'Додати до плану' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Додати до плану' }))
    expect(mealPlan.upsert).toHaveBeenCalledWith({ date: '2026-08-15', slot: 'dinner', recipeId: 'recipe-1', servings: 3 })
    expect(router.state.location.pathname).toBe('/plan')
    expect(router.state.location.search).toBe('?date=2026-08-15')
  })

  it('offers one full-page editor for the complete recipe', async () => {
    const user = userEvent.setup()
    vi.mocked(products.list).mockResolvedValueOnce([{ id: 'rice', name: 'Рис', normalizedName: 'рис', category: 'Крупи та макарони', baseUnit: 'g', archivedAt: null, createdAt: 'now', updatedAt: 'now', recipeUsageCount: 1, isBaseUnitLocked: true }])
    const recipe: Recipe = { id: 'recipe-1', name: 'Рисова миска', normalizedName: 'рисова миска', instructions: 'Змішати.', classifications: [{ mealType: 'dinner', subcategoryId: 'dinner-complete-plate' }], caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 20, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: null, ingredients: [{ id: 'ingredient-1', productId: 'rice', productName: 'Рис', enteredQuantity: 100, enteredUnit: 'g', quantityBase: 100, productBaseUnit: 'g' }] }
    let currentRecipe = recipe
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockImplementation(async () => currentRecipe), create: vi.fn(), update: vi.fn().mockImplementation(async (_id, input) => { currentRecipe = { ...currentRecipe, name: input.name }; return currentRecipe }), archive: vi.fn() }
    const mealPlan: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    render(<QueryTestProvider><MemoryRouter initialEntries={['/recipes/recipe-1']}><RecipeRepositoryProvider repository={repository}><ProductRepositoryProvider repository={products}><MealPlanRepositoryProvider repository={mealPlan}><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></MealPlanRepositoryProvider></ProductRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider>)

    expect(await screen.findByRole('heading', { name: 'Рисова миска' })).toBeInTheDocument()
    const detailLayout = screen.getByRole('heading', { name: 'Рисова миска' }).closest('.recipe-detail-layout')
    expect(detailLayout).toBeInTheDocument()
    expect(detailLayout).toHaveClass('recipe-poster')
    expect(detailLayout).toHaveClass('recipe-poster-full-height')
    expect(detailLayout?.closest('.recipe-detail')).toHaveClass('recipe-detail-wide')
    expect(detailLayout?.querySelector('.recipe-title-accent')).toHaveTextContent('Рисова')
    expect(detailLayout?.querySelector('.recipe-title-rest')).toHaveTextContent('миска')
    expect(detailLayout?.querySelector('.recipe-time-badge')).toHaveTextContent('20 хв')
    expect(screen.queryByText('Ваш рецепт')).not.toBeInTheDocument()
    expect(screen.queryByText('Підготовка продуктів')).not.toBeInTheDocument()
    expect(screen.queryByText('Крок за кроком')).not.toBeInTheDocument()
    const hero = detailLayout?.querySelector('.recipe-detail-hero')
    const intro = hero?.querySelector('.recipe-detail-hero-copy')
    const media = hero?.querySelector('.recipe-detail-hero-media')
    expect(intro).toBeInTheDocument()
    expect(media).toBeInTheDocument()
    expect(media).toHaveClass('recipe-poster-media')
    expect(intro!.compareDocumentPosition(media!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Редагувати рецепт' })).toBeInTheDocument()
    for (const label of ['Редагувати основну інформацію', 'Редагувати фото', 'Редагувати харчову цінність', 'Редагувати інгредієнти', 'Редагувати спосіб приготування']) expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Редагувати рецепт' }))
    expect(screen.getByRole('heading', { name: 'Редагування рецепта' })).toBeInTheDocument()
    const name = screen.getByLabelText('Назва рецепту')
    expect(name).toHaveValue('Рисова миска')
    expect(screen.getByLabelText(/Спосіб приготування/)).toHaveValue('Змішати.')
    expect(screen.getByRole('button', { name: 'Зберегти рецепт' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeInTheDocument()
    await user.clear(name)
    await user.type(name, 'Нова миска')
    await user.click(screen.getByRole('button', { name: 'Зберегти рецепт' }))
    expect(repository.update).toHaveBeenCalledWith('recipe-1', expect.objectContaining({ name: 'Нова миска', instructions: 'Змішати.' }))
    expect(await screen.findByRole('heading', { name: 'Нова миска' })).toBeInTheDocument()
  })

  it('exposes photo editing only inside the full-page editor', async () => {
    const user = userEvent.setup()
    const recipe: Recipe = { id: 'recipe-1', name: 'Рецепт', normalizedName: 'рецепт', instructions: 'Подати.', classifications: [], caloriesPerServing: null, proteinGramsPerServing: null, fatGramsPerServing: null, carbsGramsPerServing: null, preparationTimeMinMinutes: null, preparationTimeMaxMinutes: null, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: null, ingredients: [] }
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlan: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    render(<QueryTestProvider><MemoryRouter initialEntries={['/recipes/recipe-1']}><RecipeRepositoryProvider repository={repository}><ProductRepositoryProvider repository={products}><MealPlanRepositoryProvider repository={mealPlan}><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></MealPlanRepositoryProvider></ProductRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider>)

    expect(await screen.findByRole('button', { name: 'Редагувати рецепт' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Редагувати фото' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Редагувати рецепт' }))
    expect(screen.getByText('Фото ще не додано')).toBeInTheDocument()
    expect(screen.getByText('Завантажити фото')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Скасувати' }))
    expect(screen.getByRole('button', { name: 'Редагувати рецепт' })).toBeInTheDocument()
    expect(repository.update).not.toHaveBeenCalled()
  })
})
