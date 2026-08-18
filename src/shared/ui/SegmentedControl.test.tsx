import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

describe('SegmentedControl', () => {
  it('marks the current value and emits the next value', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl value="day" ariaLabel="Режим" options={[{ value: 'day', label: 'День' }, { value: 'week', label: 'Тиждень' }]} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'День' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Тиждень' }))
    expect(onChange).toHaveBeenCalledWith('week')
  })
})
