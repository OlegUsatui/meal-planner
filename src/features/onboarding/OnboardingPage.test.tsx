import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/auth-context'
import { RecipeRepositoryProvider } from '../recipes/repositories/RecipeRepositoryContext'
import type { RecipeRepository } from '../recipes/repositories/recipe-repository'
import type { Recipe } from '../recipes/types'
import { MealPlanRepositoryProvider } from '../meal-planner/repositories/MealPlanRepositoryContext'
import type { MealPlanRepository } from '../meal-planner/types'
import { OnboardingPage } from './OnboardingPage'
import { QueryTestProvider } from '../../shared/testing/QueryTestProvider'

const recipe: Recipe = { id: 'system-recipe-1', ownerId: null, isSystem: true, name: 'Тепла рисова миска', normalizedName: 'тепла рисова миска', instructions: 'Змішати.', classifications: [{ mealType: 'dinner', subcategoryId: 'dinner-complete-plate' }], caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 20, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: { url: '/meal.webp', mimeType: 'image/webp', width: 200, height: 120, byteSize: 5 }, ingredients: [{ id: 'i1', productId: 'rice', productName: 'Рис', productBaseUnit: 'g', quantityBase: 100, enteredQuantity: 100, enteredUnit: 'g' }] }

describe('OnboardingPage', () => {
  it('plans a system recipe and completes onboarding', async () => {
    const plan = fakePlan()
    const completeOnboarding = vi.fn().mockResolvedValue(undefined)
    renderPage('/welcome', plan, completeOnboarding)

    await userEvent.click(screen.getByRole('button', { name: 'Запланувати першу страву' }))
    await userEvent.selectOptions(screen.getByLabelText('Прийом їжі'), 'dinner')
    await userEvent.click(await screen.findByRole('button', { name: 'Обрати рецепт' }))
    expect(screen.getByRole('dialog', { name: 'Додати страву' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Додати до плану' }))

    expect(plan.upsert).toHaveBeenCalledWith(expect.objectContaining({ recipeId: recipe.id, slot: 'dinner', servings: 2 }))
    expect(completeOnboarding).toHaveBeenCalledOnce()
    expect(await screen.findByRole('heading', { name: 'Перша страва у плані' })).toBeInTheDocument()
    expect(screen.getByText(/Рис/)).toBeInTheDocument()
  })

  it('can skip without creating personal content', async () => {
    const plan = fakePlan()
    const completeOnboarding = vi.fn().mockResolvedValue(undefined)
    const { router } = renderPage('/welcome', plan, completeOnboarding)

    await userEvent.click(screen.getByRole('button', { name: 'Пропустити поки що' }))

    expect(plan.upsert).not.toHaveBeenCalled()
    expect(completeOnboarding).toHaveBeenCalledOnce()
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows the actionable API error when completion cannot be stored', async () => {
    const completeOnboarding = vi.fn().mockRejectedValue(new Error('Потрібно застосувати міграцію бази даних.'))
    renderPage('/welcome', fakePlan(), completeOnboarding)

    await userEvent.click(screen.getByRole('button', { name: 'Пропустити поки що' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Потрібно застосувати міграцію бази даних.')
  })

  it('loads system summaries only once during the StrictMode first render', async () => {
    const { recipes } = renderPage('/welcome', fakePlan(), vi.fn().mockResolvedValue(undefined), true)

    await userEvent.click(screen.getByRole('button', { name: 'Запланувати першу страву' }))
    await userEvent.selectOptions(screen.getByLabelText('Прийом їжі'), 'dinner')
    expect(await screen.findByRole('button', { name: 'Обрати рецепт' })).toBeEnabled()
    expect(recipes.list).toHaveBeenCalledOnce()
    expect(recipes.list).toHaveBeenCalledWith('', { systemOnly: true })
  })
})

function fakePlan(): MealPlanRepository {
  return { list: vi.fn().mockResolvedValue([]), getByDateSlot: vi.fn(), upsert: vi.fn().mockResolvedValue({}), remove: vi.fn() }
}

function renderPage(initialEntry: string, plan: MealPlanRepository, completeOnboarding: () => Promise<void>, strict = false) {
  const recipes: RecipeRepository = { list: vi.fn().mockResolvedValue([recipe]), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
  const auth = { session: { access_token: 'token', user: { email: 'user@example.com' } }, loading: false, roleLoading: false, profileLoading: false, isAdmin: false, onboardingCompleted: false, completeOnboarding, signIn: vi.fn(), signUp: vi.fn(), resendSignup: vi.fn(), resetPassword: vi.fn(), updatePassword: vi.fn(), updateEmail: vi.fn(), reauthenticate: vi.fn(), signOut: vi.fn() } as unknown as AuthContextValue
  const router = createMemoryRouter([{ path: '/welcome', element: <OnboardingPage /> }, { path: '/', element: <h1>Сьогодні</h1> }], { initialEntries: [initialEntry] })
  const content = <QueryTestProvider><AuthContext value={auth}><RecipeRepositoryProvider repository={recipes}><MealPlanRepositoryProvider repository={plan}><RouterProvider router={router} /></MealPlanRepositoryProvider></RecipeRepositoryProvider></AuthContext></QueryTestProvider>
  render(strict ? <StrictMode>{content}</StrictMode> : content)
  return { router, recipes }
}
