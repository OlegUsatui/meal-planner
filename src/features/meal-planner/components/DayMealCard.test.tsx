import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RecipeSummary } from '../../recipes/types'
import { DayMealCard } from './DayMealCard'

const recipe: RecipeSummary & { caloriesPerServing: number; proteinGramsPerServing: number; fatGramsPerServing: number; carbsGramsPerServing: number } = { id: 'recipe-1', name: 'Рисова миска', preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, classifications: [], archivedAt: null, image: null, caloriesPerServing: 400, proteinGramsPerServing: 20, fatGramsPerServing: 10, carbsGramsPerServing: 60 }

describe('DayMealCard', () => {
  it('shows rich recipe information in day mode', () => {
    render(<DayMealCard recipe={recipe} onOpen={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} />)

    expect(screen.getByText('Рисова миска')).toBeInTheDocument()
    expect(screen.getByText('20–25 хв')).toBeInTheDocument()
    expect(screen.getByText('400 ккал')).toBeInTheDocument()
  })

  it('does not render plan controls when actions are not provided', () => {
    const onOpen = vi.fn()
    render(<DayMealCard recipe={recipe} onOpen={onOpen} />)
    expect(screen.queryByText('Порції')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Дії для Рисова миска' })).not.toBeInTheDocument()
    expect(onOpen).not.toHaveBeenCalled()
  })
})
