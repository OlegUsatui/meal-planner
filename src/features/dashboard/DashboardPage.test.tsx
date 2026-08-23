import { render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardRepositoryProvider } from './DashboardRepositoryContext'
import type { DashboardRepository } from './types'
import { DashboardPage } from './DashboardPage'
import { QueryTestProvider } from '../../shared/testing/QueryTestProvider'
import { RecipeRepositoryProvider } from '../recipes/repositories/RecipeRepositoryContext'
import type { RecipeRepository } from '../recipes/repositories/recipe-repository'
import type { Recipe } from '../recipes/types'
import { MealPlanRepositoryProvider } from '../meal-planner/repositories/MealPlanRepositoryContext'
import type { MealPlanRepository } from '../meal-planner/types'

const recipe: Recipe = { id: 'r1', name: 'Тепла миска', normalizedName: 'тепла миска', instructions: 'Змішати.', classifications: [{ mealType: 'dinner', subcategoryId: 'dinner-complete-plate' }], caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 50, preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, archivedAt: null, createdAt: 'now', updatedAt: 'now', image: null, ingredients: [] }

function renderDashboard(repository: DashboardRepository, recipeRepository: RecipeRepository, mealPlanRepository: MealPlanRepository) {
  return render(<QueryTestProvider><MemoryRouter><RecipeRepositoryProvider repository={recipeRepository}><MealPlanRepositoryProvider repository={mealPlanRepository}><DashboardRepositoryProvider repository={repository}><DashboardPage /></DashboardRepositoryProvider></MealPlanRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider>)
}

describe('DashboardPage', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); vi.setSystemTime(new Date('2026-08-14T12:00:00')) })
  afterEach(() => { vi.useRealTimers() })

  it('shows today meals, empty slots and a seven-day shopping preview', async () => {
    const repository: DashboardRepository = { get: vi.fn().mockResolvedValue({ today: '2026-08-14', todayEntries: [{ id: 'e1', date: '2026-08-14', slot: 'dinner', recipeId: 'r1', recipeName: 'Тепла миска' }], nextEntry: { id: 'e1', date: '2026-08-14', slot: 'dinner', recipeId: 'r1', recipeName: 'Тепла миска' }, sevenDayShoppingCount: 8, hasPersonalRecipes: false, hasPersonalProducts: false, hasPlanEntries: true }) }
    const recipeRepository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlanRepository: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    renderDashboard(repository, recipeRepository, mealPlanRepository)

    expect(await screen.findByRole('heading', { name: 'Сьогодні' })).toBeInTheDocument()
    expect(repository.get).toHaveBeenCalledWith('2026-08-14')
    expect(await screen.findByRole('button', { name: 'Відкрити рецепт Тепла миска' })).toBeInTheDocument()
    expect(screen.getAllByText('Тепла миска')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Харчова цінність' })).toBeInTheDocument()
    const nutritionCard = screen.getByRole('region', { name: 'Харчова цінність' })
    expect(within(nutritionCard).getByText('400')).toBeInTheDocument()
    expect(within(nutritionCard).getByText('20')).toBeInTheDocument()
    expect(within(nutritionCard).getByText('10')).toBeInTheDocument()
    expect(within(nutritionCard).getByText('50')).toBeInTheDocument()
    expect(within(nutritionCard).getByText('1 страва')).toBeInTheDocument()
    expect(screen.queryByText('Найближча страва')).not.toBeInTheDocument()
    expect(screen.getByText('8 продуктів')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Додати страву/ })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Відкрити рецепт Тепла миска' })).toBeInTheDocument()
    expect(screen.queryByText('Перший крок')).not.toBeInTheDocument()
  })

  it('shows setup guidance only before the first plan entry', async () => {
    const repository: DashboardRepository = { get: vi.fn().mockResolvedValue({ today: '2026-08-14', todayEntries: [], nextEntry: null, sevenDayShoppingCount: 0, hasPersonalRecipes: false, hasPersonalProducts: false, hasPlanEntries: false }) }
    const recipeRepository: RecipeRepository = { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlanRepository: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }
    renderDashboard(repository, recipeRepository, mealPlanRepository)
    expect(await screen.findByText('Перший крок')).toBeInTheDocument()
    expect(screen.getByText('Заплануйте страви, щоб побачити підсумок.')).toBeInTheDocument()
    expect(screen.queryByText('0 ккал')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Запланувати страву' })).toHaveAttribute('href', '/plan?date=2026-08-14')
  })

  it('deduplicates the initial request in StrictMode', async () => {
    const repository: DashboardRepository = { get: vi.fn().mockResolvedValue({ today: '2026-08-14', todayEntries: [], nextEntry: null, sevenDayShoppingCount: 0, hasPersonalRecipes: false, hasPersonalProducts: false, hasPlanEntries: true }) }
    const recipeRepository: RecipeRepository = { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlanRepository: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn(), remove: vi.fn() }

    render(<StrictMode><QueryTestProvider><MemoryRouter><RecipeRepositoryProvider repository={recipeRepository}><MealPlanRepositoryProvider repository={mealPlanRepository}><DashboardRepositoryProvider repository={repository}><DashboardPage /></DashboardRepositoryProvider></MealPlanRepositoryProvider></RecipeRepositoryProvider></MemoryRouter></QueryTestProvider></StrictMode>)

    expect(await screen.findByRole('heading', { name: 'Страви на сьогодні' })).toBeInTheDocument()
    expect(repository.get).toHaveBeenCalledOnce()
  })

  it('does not render plan mutation controls on dashboard meal cards', async () => {
    const repository: DashboardRepository = { get: vi.fn().mockResolvedValue({ today: '2026-08-14', todayEntries: [{ id: 'e1', date: '2026-08-14', slot: 'dinner', recipeId: 'r1', recipeName: 'Тепла миска' }], nextEntry: null, sevenDayShoppingCount: 0, hasPersonalRecipes: false, hasPersonalProducts: false, hasPlanEntries: true }) }
    const recipeRepository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockResolvedValue(recipe), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    const mealPlanRepository: MealPlanRepository = { list: vi.fn(), getByDateSlot: vi.fn(), upsert: vi.fn().mockResolvedValue({}), remove: vi.fn() }
    renderDashboard(repository, recipeRepository, mealPlanRepository)

    await screen.findByRole('button', { name: 'Відкрити рецепт Тепла миска' })
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByText('Порції')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Дії для Тепла миска' })).not.toBeInTheDocument()
    expect(mealPlanRepository.upsert).not.toHaveBeenCalled()
    expect(mealPlanRepository.remove).not.toHaveBeenCalled()
  })
})
