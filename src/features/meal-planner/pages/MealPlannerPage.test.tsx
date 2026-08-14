import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecipeRepository } from '../../recipes/repositories/recipe-repository'
import { RecipeRepositoryProvider } from '../../recipes/repositories/RecipeRepositoryContext'
import type { Recipe } from '../../recipes/types'
import { MealPlanRepositoryProvider } from '../repositories/MealPlanRepositoryContext'
import type { MealPlanRepository } from '../types'
import { MealPlannerPage } from './MealPlannerPage'

const recipe: Recipe = { id: 'recipe-1', name: 'Рисова миска', normalizedName: 'рисова миска', instructions: 'Змішати все.', classifications: [{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }, { mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }, { mealType: 'dinner', subcategoryId: 'dinner-complete-plate' }, { mealType: 'snack', subcategoryId: 'snack-general' }], caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: { blob: new Blob(['image'], { type: 'image/webp' }), mimeType: 'image/webp', width: 200, height: 120, byteSize: 5 }, ingredients: [{ id: 'ingredient-1', productId: 'rice', productName: 'Рис', productBaseUnit: 'g', quantityBase: 100, enteredQuantity: 100, enteredUnit: 'g' }] }

describe('MealPlannerPage', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); vi.setSystemTime(new Date('2026-08-14T12:00:00')); vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }) })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('renders a week, opens recipe details and exposes add/remove actions', async () => {
    const plan: MealPlanRepository = { list: vi.fn().mockResolvedValue([{ id: 'entry-1', date: '2026-08-14', slot: 'breakfast', recipeId: recipe.id, servings: 2, createdAt: 'now', updatedAt: 'now' }]), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn().mockResolvedValue(undefined) }
    const recipes: RecipeRepository = { list: vi.fn().mockResolvedValue([recipe]), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const router = createMemoryRouter([{ path: '/plan', element: <MealPlannerPage /> }], { initialEntries: ['/plan'] })
    const { container } = render(<RecipeRepositoryProvider repository={recipes}><MealPlanRepositoryProvider repository={plan}><RouterProvider router={router} /></MealPlanRepositoryProvider></RecipeRepositoryProvider>)
    expect(await screen.findByRole('heading', { name: 'План харчування' })).toBeInTheDocument()
    expect(container.querySelectorAll('.week-day')).toHaveLength(7)

    await userEvent.click(screen.getByRole('button', { name: 'Відкрити рецепт Рисова миска' }))
    const details = screen.getByRole('dialog', { name: 'Рисова миска' })
    expect(within(details).getByText('800 ккал')).toBeInTheDocument()
    expect(within(details).getByText('200 g')).toBeInTheDocument()
    await userEvent.click(within(details).getByRole('button', { name: 'Закрити' }))

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await userEvent.click(screen.getByRole('button', { name: 'Дії для Рисова миска' }))
    await userEvent.click(screen.getByRole('button', { name: 'Видалити' }))
    expect(plan.remove).toHaveBeenCalledWith('entry-1')

    const add = screen.getAllByRole('button', { name: /Додати страву/ }).find((button) => !(button as HTMLButtonElement).disabled)
    expect(add).toBeDefined()
    await userEvent.click(add!)
    expect(screen.getByRole('dialog', { name: 'Додати страву' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Знайти рецепт…')).toBeInTheDocument()
  })
})
