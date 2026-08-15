import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { DayMealCard } from './DayMealCard'

const entry: MealPlanEntry = { id: 'entry-1', date: '2026-08-15', slot: 'breakfast', recipeId: 'recipe-1', servings: 2, createdAt: 'now', updatedAt: 'now' }
const recipe: RecipeSummary & { caloriesPerServing: number; proteinGramsPerServing: number; fatGramsPerServing: number; carbsGramsPerServing: number } = { id: 'recipe-1', name: 'Рисова миска', preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, classifications: [], archivedAt: null, image: null, caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60 }

describe('DayMealCard', () => {
  it('shows rich recipe information in day mode', () => {
    render(<DayMealCard entry={entry} recipe={recipe} readOnly={false} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={vi.fn()} />)

    expect(screen.getByText('Рисова миска')).toBeInTheDocument()
    expect(screen.getByText('20–25 хв')).toBeInTheDocument()
    expect(screen.getByText('400 ккал')).toBeInTheDocument()
  })

  it('keeps the recipe action separate from the servings control', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onServingsChange = vi.fn().mockResolvedValue(undefined)
    render(<DayMealCard entry={entry} recipe={recipe} readOnly={false} onOpen={onOpen} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={onServingsChange} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Кількість порцій для Рисова миска' }), '3')
    expect(onServingsChange).toHaveBeenCalledWith(3)
    expect(onOpen).not.toHaveBeenCalled()
  })
})
