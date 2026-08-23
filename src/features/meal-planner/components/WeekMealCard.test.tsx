import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { RecipeSummary } from '../../recipes/types'
import { WeekMealCard } from './WeekMealCard'

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
    render(<WeekMealCard recipe={recipe} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} />)

    expect(screen.getByText('Чаша з креветками')).toBeInTheDocument()
    expect(screen.getByText('20–25 хв')).toBeInTheDocument()
    expect(screen.getByText('Салати-боули')).toBeInTheDocument()
    expect(document.querySelector('.meal-card-image.image-placeholder')).toBeInTheDocument()
  })

  it('opens the recipe from the card without opening its controls', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<WeekMealCard recipe={recipe} onOpen={onOpen} onReplace={vi.fn()} onRemove={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Відкрити рецепт Чаша з креветками' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('does not render a servings control', () => {
    render(<WeekMealCard recipe={recipe} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.queryByText('Порції')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
