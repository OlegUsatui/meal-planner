import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { WeekMealCard } from './WeekMealCard'

const entry: MealPlanEntry = { id: 'entry-1', date: '2026-08-15', slot: 'lunch', recipeId: 'recipe-1', servings: 2, createdAt: 'now', updatedAt: 'now' }
const recipe: RecipeSummary = {
  id: 'recipe-1',
  name: 'Чаша з креветками',
  preparationTimeMinMinutes: 20,
  preparationTimeMaxMinutes: 25,
  classifications: [{ mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }],
  archivedAt: null,
  image: null,
}

describe('WeekMealCard', () => {
  it('shows the compact recipe hierarchy and placeholder', () => {
    render(<WeekMealCard entry={entry} recipe={recipe} readOnly={false} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={vi.fn()} />)

    expect(screen.getByText('Чаша з креветками')).toBeInTheDocument()
    expect(screen.getByText('20–25 хв')).toBeInTheDocument()
    expect(screen.getByText('Салати-боули')).toBeInTheDocument()
    expect(document.querySelector('.meal-card-image.image-placeholder')).toBeInTheDocument()
  })

  it('opens the recipe from the card without opening its controls', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<WeekMealCard entry={entry} recipe={recipe} readOnly={false} onOpen={onOpen} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Відкрити рецепт Чаша з креветками' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('keeps servings read-only for past entries', () => {
    render(<WeekMealCard entry={entry} recipe={recipe} readOnly onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={vi.fn()} />)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Кількість порцій для Чаша з креветками' })).not.toBeInTheDocument()
  })
})
