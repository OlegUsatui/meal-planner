import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActionMenu } from './ActionMenu'

describe('ActionMenu', () => {
  it('opens actions and closes after selecting one', async () => {
    const onSelect = vi.fn()
    render(<ActionMenu label="Дії для страви" items={[{ label: 'Замінити', onSelect }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Дії для страви' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Замінити' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
