import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChipGroup } from './ChipGroup'

describe('ChipGroup', () => {
  it('marks the selected option and reports changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipGroup ariaLabel="Категорії" value="all" onChange={onChange} options={[{ value: 'all', label: 'Усі' }, { value: 'dinner', label: 'Вечеря' }]} />)

    expect(screen.getByRole('button', { name: 'Усі' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Вечеря' }))
    expect(onChange).toHaveBeenCalledWith('dinner')
  })
})
