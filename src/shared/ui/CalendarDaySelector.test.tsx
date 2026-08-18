import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalendarDaySelector } from './CalendarDaySelector'

describe('CalendarDaySelector', () => {
  it('renders accessible dates and selects a day', async () => {
    const onSelect = vi.fn()
    render(<CalendarDaySelector dates={['2026-08-18', '2026-08-19']} today="2026-08-18" selectedDate="2026-08-18" onSelect={onSelect} variant="strip" />)
    const next = screen.getByRole('button', { name: /19 серпня/i })
    await userEvent.click(next)
    expect(onSelect).toHaveBeenCalledWith('2026-08-19')
  })
})
