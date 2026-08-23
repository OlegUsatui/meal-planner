import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { MealCard } from './MealCard'

const entry: MealPlanEntry = { id: 'entry-1', date: '2026-08-15', slot: 'breakfast', recipeId: 'recipe-1', servings: 2, createdAt: 'now', updatedAt: 'now' }
const recipe: RecipeSummary = { id: 'recipe-1', name: 'Рисова миска', preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, classifications: [], archivedAt: null, image: null }

describe('MealCard', () => {
  it('changes servings without opening the recipe card', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onServingsChange = vi.fn().mockResolvedValue(undefined)

    render(<MealCard entry={entry} recipe={recipe} readOnly={false} onOpen={onOpen} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={onServingsChange} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Кількість порцій для Рисова миска' }), '4')

    expect(onServingsChange).toHaveBeenCalledWith(4)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('shows the recipe name in the compact card body', () => {
    render(<MealCard entry={entry} recipe={recipe} readOnly={false} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={vi.fn()} />)

    const recipeButton = screen.getByRole('button', { name: 'Відкрити рецепт Рисова миска' })
    expect(recipeButton).toHaveTextContent('Рисова миска')
    expect(recipeButton).not.toHaveAttribute('data-tooltip')
  })

  it('keeps the servings visible but read-only for past entries', () => {
    render(<MealCard entry={entry} recipe={recipe} readOnly onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} onServingsChange={vi.fn()} />)

    expect(screen.getByText('Порції')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Кількість порцій для Рисова миска' })).not.toBeInTheDocument()
  })
})
