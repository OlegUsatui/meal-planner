import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecipeRepositoryProvider } from '../repositories/RecipeRepositoryContext'
import type { RecipeRepository } from '../repositories/recipe-repository'
import type { Recipe } from '../types'
import { RecipesPage } from './RecipesPage'

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
})
