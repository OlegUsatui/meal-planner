import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MealCardControls } from './MealCardControls'

describe('MealCardControls', () => {
  it('opens the actions menu from a week card trigger', async () => {
    const user = userEvent.setup()
    render(<MealCardControls recipeName="Рисова миска" onReplace={vi.fn()} onRemove={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Дії для Рисова миска' }))
    expect(screen.getByRole('menu', { name: 'Дії для Рисова миска' })).toBeInTheDocument()
  })
})
