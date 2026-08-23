import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RecipeSummary } from '../../recipes/types'
import { MealCard } from './MealCard'

const recipe: RecipeSummary = { id: 'recipe-1', name: 'Рисова миска', preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, classifications: [], archivedAt: null, image: null }

describe('MealCard', () => {
  it('shows the recipe name in the compact card body', () => {
    render(<MealCard recipe={recipe} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} />)

    const recipeButton = screen.getByRole('button', { name: 'Відкрити рецепт Рисова миска' })
    expect(recipeButton).toHaveTextContent('Рисова миска')
    expect(recipeButton).not.toHaveAttribute('data-tooltip')
  })

  it('does not render a servings control', () => {
    render(<MealCard recipe={recipe} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.queryByText('Порції')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
