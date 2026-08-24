import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { WeekCalendar } from './WeekCalendar'

const recipe: RecipeSummary = { id: 'recipe-1', name: 'Рисова миска', preparationTimeMinMinutes: 20, preparationTimeMaxMinutes: 25, classifications: [{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }], archivedAt: null, image: null }
const entry: MealPlanEntry = { id: 'entry-1', date: '2026-08-15', slot: 'breakfast', recipeId: recipe.id, createdAt: 'now', updatedAt: 'now' }
const dates = ['2026-08-14', '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20']

function renderCalendar(overrides: Partial<ComponentProps<typeof WeekCalendar>> = {}) {
  return render(<WeekCalendar dates={dates} today="2026-08-14" selectedDate="2026-08-15" entries={[entry]} recipes={new Map([[recipe.id, recipe]])} onSelectDate={vi.fn()} onAdd={vi.fn()} onCopy={vi.fn()} onPaste={vi.fn()} onMove={vi.fn()} onReplace={vi.fn()} onRemove={vi.fn()} onOpen={vi.fn()} {...overrides} />)
}

describe('WeekCalendar actions', () => {
  it('copies from a card and pastes into the selected target cell from the context menu', async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    const onPaste = vi.fn()
    renderCalendar({ onCopy, onPaste, clipboardRecipeId: recipe.id })

    await user.click(screen.getByRole('button', { name: 'Дії для Рисова миска' }))
    await user.click(screen.getByRole('button', { name: 'Копіювати' }))
    const cells = document.querySelectorAll<HTMLElement>('.week-grid-cell')
    fireEvent.contextMenu(cells[2], { clientX: 24, clientY: 32 })
    await user.click(screen.getByRole('menuitem', { name: 'Вставити' }))

    expect(onCopy).toHaveBeenCalledWith(recipe.id)
    expect(onPaste).toHaveBeenCalledWith('2026-08-16', 'breakfast')
  })

  it('moves a card to another day in the same slot with drag and drop', () => {
    const onMove = vi.fn()
    renderCalendar({ onMove })
    const card = document.querySelector<HTMLElement>('.meal-card')!
    const cells = document.querySelectorAll<HTMLElement>('.week-grid-cell')

    fireEvent.dragStart(card)
    fireEvent.dragOver(cells[2])
    fireEvent.drop(cells[2])

    expect(onMove).toHaveBeenCalledWith(entry, '2026-08-16', 'breakfast')
  })

  it('opens copy, replace, and delete from a card context menu', async () => {
    const user = userEvent.setup()
    renderCalendar()
    fireEvent.contextMenu(document.querySelector<HTMLElement>('.meal-card')!, { clientX: 24, clientY: 32 })

    expect(screen.getByRole('menuitem', { name: 'Копіювати' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Замінити' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Видалити' })).toBeInTheDocument()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveTextContent('Замінити')
  })

  it('does not open a mutation menu for a past target', () => {
    renderCalendar()
    const cells = document.querySelectorAll<HTMLElement>('.week-grid-cell')
    fireEvent.contextMenu(cells[0], { clientX: 24, clientY: 32 })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
